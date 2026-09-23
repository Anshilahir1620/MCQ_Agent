import os
import re
import json
import time
import uuid
import asyncio
import logging
from pathlib import Path
from typing import List, Optional
from collections import defaultdict

from dotenv import load_dotenv
from pydantic import BaseModel
from langchain_community.document_loaders import (PyPDFLoader, Docx2txtLoader, TextLoader,UnstructuredPowerPointLoader, UnstructuredExcelLoader, WebBaseLoader,)
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.colors import HexColor
from io import BytesIO
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("mcq_backend")

for key in ["GOOGLE_API_KEY", "GROQ_API_KEY", "PINECONE_API_KEY"]:
    if not os.getenv(key):
        raise EnvironmentError(f"Missing {key} in your .env file")
    

class MCQ(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class MCQSet(BaseModel):
    questions: List[MCQ]

class TopicBreakdown(BaseModel):
    topic: str
    wrong_question_numbers: List[int]   


class StudyInsights(BaseModel):
    weak_topics: List[TopicBreakdown]      
    improvement_points: List[str]
    strong_topics: List[str]             


def load_document(file_path: str):
    extension = Path(file_path).suffix.lower()
    loaders = {
        ".pdf": PyPDFLoader,
        ".docx": Docx2txtLoader,
        ".txt": TextLoader,
        ".pptx": UnstructuredPowerPointLoader,
        ".xlsx": UnstructuredExcelLoader,
    }
    if extension not in loaders:
        raise ValueError(f"Unsupported file type: {extension}")
    return loaders[extension](file_path).load()


def load_website(url: str):
    loader = WebBaseLoader(url)
    docs = loader.load()
    for doc in docs:
        doc.metadata = {"filename": url, "file_type": "web", "source": url, "page": 1}
    return docs


def chunk_data(documents, chunk_size: int = 2000, chunk_overlap: int = 200):
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return splitter.split_documents(documents)


EMBEDDING_DIMENSION = 3072
NAMESPACE_TTL_HOURS = 2.0  

def ensure_index(index_name: str = "langchainvector",dimension: int = EMBEDDING_DIMENSION,cloud: str = "aws", region: str = "us-east-1"):
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    existing = [i["name"] for i in pc.list_indexes()]
    if index_name not in existing:
        pc.create_index(name=index_name, dimension=dimension, metric="cosine",
                         spec=ServerlessSpec(cloud=cloud, region=region))
        logger.info(f"Created Pinecone index '{index_name}' (dim={dimension}).")
    else:
        logger.info(f"Pinecone index '{index_name}' already exists.")


def make_session_namespace() -> str:
    """Timestamp is embedded directly in the name, so no separate DB/file
    is needed to know how old a namespace is — cleanup_expired_namespaces()
    reads it straight back out of the name itself."""
    return f"session-{int(time.time())}-{uuid.uuid4().hex[:8]}"


def make_chunk_id(chunk, file_path: str) -> str:
    import hashlib
    raw = f"{file_path}:{chunk.page_content}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def store_chunks(chunks, file_path: str, index_name: str, namespace: str, max_retries: int = 5):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    ids = [make_chunk_id(c, file_path) for c in chunks]

    for attempt in range(max_retries):
        try:
            vectorstore = PineconeVectorStore.from_existing_index(
                index_name=index_name, embedding=embeddings, namespace=namespace,
            )
            vectorstore.add_documents(documents=chunks, ids=ids)
            logger.info(f"Upserted {len(chunks)} chunks into '{index_name}' (namespace={namespace}).")
            return vectorstore
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait = 2 ** attempt
            logger.warning(f"Embedding failed (attempt {attempt + 1}/{max_retries}): {e}. Retrying in {wait}s...")
            time.sleep(wait)


def delete_namespace(index_name: str, namespace: str):
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index = pc.Index(index_name)
    try:
        index.delete(delete_all=True, namespace=namespace)
        logger.info(f"Deleted namespace '{namespace}' from '{index_name}'.")
    except Exception as e:
        logger.warning(f"Could not delete namespace '{namespace}': {e}")


def cleanup_expired_namespaces(index_name: str = "langchainvector", ttl_hours: float = NAMESPACE_TTL_HOURS):
    try:
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        index = pc.Index(index_name)
        stats = index.describe_index_stats()
        namespaces = stats.get("namespaces", {}) or {}
    except Exception as e:
        logger.warning(f"Could not fetch index stats for cleanup: {e}")
        return

    now = time.time()
    cutoff = ttl_hours * 3600
    deleted_count = 0

    for ns_name in namespaces:
        if not ns_name.startswith("session-"):
            continue
        try:
            created_at = int(ns_name.split("-")[1])
        except (IndexError, ValueError):
            continue

        if now - created_at > cutoff:
            delete_namespace(index_name, ns_name)
            deleted_count += 1

    if deleted_count:
        logger.info(f"Cleanup: removed {deleted_count} expired namespace(s).")




_groq_llm = ChatGroq(model="openai/gpt-oss-120b", api_key=os.getenv("GROQ_API_KEY"), temperature=0.3)
_groq_structured = _groq_llm.with_structured_output(MCQSet)
_groq_insights_structured = _groq_llm.with_structured_output(StudyInsights)

def _parse_retry_after(error_str: str, fallback: float) -> float:
    match = re.search(r"try again in ([\d.]+)(s|ms)", error_str)
    if not match:
        return fallback
    value = float(match.group(1))
    return value / 1000 if match.group(2) == "ms" else value


async def generate_mcqs_from_context(context: str, num_questions: int = 5, max_retries: int = 4) -> MCQSet:
    prompt = f"""Generate {num_questions} multiple choice questions based ONLY on the
content below. Each question must have exactly 4 options, one correct answer,
and a short explanation.

IMPORTANT: You MUST respond using the structured output tool only. Do not
write your answer as plain text, markdown, or a numbered list.

Content:
{context}
"""
    for attempt in range(max_retries):
        try:
            return await _groq_structured.ainvoke(prompt)
        except Exception as e:
            error_str = str(e)
            is_rate_limit = "rate_limit_exceeded" in error_str or "429" in error_str
            if is_rate_limit and attempt < max_retries - 1:
                wait = _parse_retry_after(error_str, fallback=2 ** attempt) + 0.5
                logger.warning(f"Rate limited, waiting {wait:.1f}s (attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(wait)
                continue
            raise


async def generate_mcqs_for_topic(retriever, topic: str, num_questions: int = 5) -> MCQSet:
    docs = retriever.invoke(topic)
    context = "\n\n".join(doc.page_content for doc in docs)
    return await generate_mcqs_from_context(context, num_questions)


def select_spaced_chunks(valid_chunks, count: int):
    if count >= len(valid_chunks):
        return valid_chunks
    step = len(valid_chunks) / count
    indices = sorted({min(round(i * step), len(valid_chunks) - 1) for i in range(count)})
    return [valid_chunks[i] for i in indices]


async def generate_mcqs_for_all_chunks(chunks, total_questions: int = 10, max_concurrent: int = 3) -> dict:
    valid_chunks = [c for c in chunks if len(c.page_content.strip()) >= 100]
    if not valid_chunks:
        return {"questions": [], "warning": "No readable text found in this document."}

    warning = None
    if total_questions < len(valid_chunks):
        warning = (
            f"Your document has more content than {total_questions} question(s) can fully "
            f"cover -- some topics may be missed. Try increasing the question count."
        )
        chunks_to_use = select_spaced_chunks(valid_chunks, total_questions)
    else:
        chunks_to_use = valid_chunks

    base, remainder = divmod(total_questions, len(chunks_to_use))
    semaphore = asyncio.Semaphore(max_concurrent)

    async def process_chunk(i, chunk):
        q_count = base + (1 if i < remainder else 0)
        if q_count == 0:
            return []
        async with semaphore:
            try:
                result = await generate_mcqs_from_context(chunk.page_content, q_count)
                return result.questions
            except Exception as e:
                logger.warning(f"Skipping chunk {i} (generation failed after retries): {e}")
                return []

    results = await asyncio.gather(*[process_chunk(i, c) for i, c in enumerate(chunks_to_use)])
    all_questions = [q for chunk_result in results for q in chunk_result]

    if not all_questions:
        warning = "Question generation failed for all chunks. Please try again."

    return {"questions": all_questions[:total_questions], "warning": warning}

async def handle_upload(uploaded_file_path: str, total_questions: int) -> dict:
    """Always returns MCQ objects with full data (including correct_answer).
    The API layer decides what to withhold based on mode — never here."""
    documents = load_document(uploaded_file_path)
    if not documents:
        return {"questions": [], "warning": "Could not extract any content from this file."}

    chunks = chunk_data(documents)
    return await generate_mcqs_for_all_chunks(chunks, total_questions=total_questions)


async def handle_upload_with_topic(uploaded_file_path: str, topic: str, num_questions: int = 5,
                                    index_name: str = "langchainvector") -> dict:
    session_namespace = make_session_namespace()

    documents = load_document(uploaded_file_path)
    chunks = chunk_data(documents)

    await asyncio.to_thread(ensure_index, index_name)
    vectorstore = await asyncio.to_thread(store_chunks, chunks, uploaded_file_path, index_name, session_namespace)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4, "namespace": session_namespace})

    mcq_set = await generate_mcqs_for_topic(retriever, topic, num_questions)
    return {"questions": mcq_set.questions, "warning": None}


def grade_quiz(mcqs: List[MCQ], user_answers: List[str]) -> dict:
    graded = []
    correct_count = 0
    for mcq, answer in zip(mcqs, user_answers):
        is_correct = answer is not None and answer.strip().lower() == mcq.correct_answer.strip().lower()
        if is_correct:
            correct_count += 1
        graded.append({
            "question": mcq.question, "options": mcq.options, "user_answer": answer,
            "correct_answer": mcq.correct_answer, "is_correct": is_correct,
            "explanation": mcq.explanation,
        })
    return {
        "score": correct_count,
        "total": len(mcqs),
        "percentage": round((correct_count / len(mcqs)) * 100) if mcqs else 0,
        "graded_questions": graded,
    }



async def generate_study_recommendations(graded: dict) -> dict:
    # Group WRONG question numbers by topic — this is what you actually want to show
    topic_wrong_numbers = defaultdict(list)
    topic_all = defaultdict(set)   # tracks every topic seen, so we can compute strong_topics

    for i, g in enumerate(graded["graded_questions"], start=1):   # 1-indexed question number
        topic = g.get("topic", "General")
        topic_all[topic].add(i)
        if not g["is_correct"]:
            topic_wrong_numbers[topic].append(i)

    weak_topics = [
        TopicBreakdown(topic=topic, wrong_question_numbers=sorted(numbers))
        for topic, numbers in topic_wrong_numbers.items()
    ]
    # Sort by most-wrong-first, so the weakest topic appears at the top
    weak_topics.sort(key=lambda t: len(t.wrong_question_numbers), reverse=True)

    strong_topics = [topic for topic in topic_all if topic not in topic_wrong_numbers]

    if not weak_topics:
        return {
            "weak_topics": [],
            "improvement_points": ["Strong performance across all topics — no specific weak areas detected."],
            "strong_topics": strong_topics,
        }

    wrong_questions = [g for g in graded["graded_questions"] if not g["is_correct"]]
    wrong_summary = "\n".join(
        f"- [{g.get('topic', 'General')}] {g['question']} (Correct: {g['correct_answer']})"
        for g in wrong_questions
    )

    prompt = f"""A student got these questions wrong, grouped by topic:
{[(w.topic, w.wrong_question_numbers) for w in weak_topics]}

Full details of what they got wrong:
{wrong_summary}

Write 3-5 short, specific, actionable improvement bullet points (each under 20 words) 
based only on the above. Be concrete about WHAT to review, not generic advice."""

    result = await _groq_insights_structured.ainvoke(prompt)

    return {
        "weak_topics": [w.model_dump() for w in weak_topics],
        "improvement_points": result.improvement_points,
        "strong_topics": strong_topics,
    }


def generate_mcq_pdf(mcqs, include_answers: bool = True, title: str = "MCQ Set") -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("TitleStyle", parent=styles["Title"], textColor=HexColor("#1a1a1a"))
    question_style = ParagraphStyle("Question", parent=styles["Heading3"], spaceBefore=16, spaceAfter=6)
    option_style = ParagraphStyle("Option", parent=styles["Normal"], leftIndent=20, spaceAfter=4)
    correct_style = ParagraphStyle("Correct", parent=option_style, textColor=HexColor("#16a34a"))
    explanation_style = ParagraphStyle("Explanation", parent=styles["Normal"], leftIndent=20,
                                        textColor=HexColor("#555555"), fontSize=9, spaceAfter=14)

    elements = [Paragraph(title, title_style), Spacer(1, 0.2*inch)]

    for i, mcq in enumerate(mcqs, 1):
        question = mcq.question if hasattr(mcq, "question") else mcq["question"]
        options = mcq.options if hasattr(mcq, "options") else mcq["options"]
        correct = mcq.correct_answer if hasattr(mcq, "correct_answer") else mcq.get("correct_answer")
        explanation = mcq.explanation if hasattr(mcq, "explanation") else mcq.get("explanation")

        elements.append(Paragraph(f"Q{i}. {question}", question_style))
        for j, opt in enumerate(options):
            label = chr(65 + j)  # A, B, C, D
            style = correct_style if (include_answers and opt == correct) else option_style
            marker = " ✓" if (include_answers and opt == correct) else ""
            elements.append(Paragraph(f"{label}. {opt}{marker}", style))

        if include_answers and explanation:
            elements.append(Paragraph(f"<b>Explanation:</b> {explanation}", explanation_style))

        elements.append(HRFlowable(width="100%", color=HexColor("#dddddd"), spaceAfter=8))

    doc.build(elements)
    buffer.seek(0)
    return buffer