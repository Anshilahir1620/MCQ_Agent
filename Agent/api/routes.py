import os
import uuid
import tempfile
from typing import List
from fastapi.responses import StreamingResponse

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from index import (handle_upload,handle_upload_with_topic,grade_quiz,
                   generate_study_recommendations,
                   MCQ,generate_mcq_pdf)

router = APIRouter(prefix="/api", tags=["api"])

ALLOWED_EXTENSIONS = {".pdf", ".pptx", ".txt", ".docx"}
MAX_FILE_SIZE = 40 * 1024 * 1024  # 40MB

VALID_MODES = {"quiz", "exam"}

QUIZ_SESSIONS: dict = {}

class PDFExportPayload(BaseModel):
    questions: List[dict]   # the full exam-mode questions array, as already returned by /generate
    title: str = "Exam Mode Answer Key"



def _strip_answers(mcqs) -> List[dict]:
    """Used for BOTH modes at generation time — correct_answer/explanation
    must never reach the browser before the quiz is submitted, regardless
    of whether the mode is 'quiz' or 'exam'. Exam mode's answer-key view
    is revealed only after submission, not at generation."""
    out = []
    for q in mcqs:
        question = q.question if hasattr(q, "question") else q["question"]
        options = q.options if hasattr(q, "options") else q["options"]
        out.append({"question": question, "options": options})
    return out

@router.post("/generate")
async def generate(file: UploadFile = File(...),total_questions: int = Form(10),mode: str = Form("quiz"),topic: str = Form(""),):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    if mode not in VALID_MODES:
        raise HTTPException(400, f"Invalid mode: {mode!r}. Must be one of {VALID_MODES}")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large (max {MAX_FILE_SIZE // (1024 * 1024)}MB)")

    total_questions = max(3, min(total_questions, 50))

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        if topic:
            result = await handle_upload_with_topic(tmp_path, topic, total_questions)
        else:
            result = await handle_upload(tmp_path, total_questions)

        mcqs = result["questions"]
        warning = result["warning"]

    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        import logging
        logging.getLogger("api").error(f"Generation error: {e}")
        raise HTTPException(500, "Generation failed, please try again")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    if not mcqs:
        raise HTTPException(422, "Could not generate questions from this file")

    if mode == "exam":
        questions_out = [
            {
                "question": q.question,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "explanation": q.explanation,
            }
            for q in mcqs
        ]
        return {
            "mode": "exam",
            "topic": topic or None,
            "warning": warning,
            "questions": questions_out,
        }
    session_id = str(uuid.uuid4())
    QUIZ_SESSIONS[session_id] = {"mcqs": mcqs, "result": None, "mode": mode}
    return {
        "session_id": session_id,
        "mode": "quiz",
        "topic": topic or None,
        "warning": warning,
        "questions": _strip_answers(mcqs),
    }


class SubmitPayload(BaseModel):
    answers: List[str]


@router.post("/quiz/{session_id}/submit")
async def submit(session_id: str, payload: SubmitPayload):
    session = QUIZ_SESSIONS.get(session_id)
    if not session:
        raise HTTPException(404, "Quiz session not found or expired")

    if session["result"] is not None:
        return session["result"]  

    mcqs: List[MCQ] = session["mcqs"]
    if len(payload.answers) != len(mcqs):
        raise HTTPException(400, "Answer count doesn't match question count")

    graded = grade_quiz(mcqs, payload.answers)
    insights = await generate_study_recommendations(graded)  

    result = {**graded, "ai_insights": insights, "mode": session["mode"]}
    session["result"] = result
    return result


@router.get("/quiz/{session_id}/result")
def get_result(session_id: str):
    session = QUIZ_SESSIONS.get(session_id)
    if not session or session["result"] is None:
        raise HTTPException(404, "No result yet for this session — submit the quiz first")
    return session["result"]


@router.get("/quiz/{session_id}/download-pdf")
def download_quiz_pdf(session_id: str):
    """For quiz mode — only available AFTER the user has submitted, so 
    answers/explanations aren't downloadable before they've actually taken the quiz."""
    session = QUIZ_SESSIONS.get(session_id)
    if not session:
        raise HTTPException(404, "Quiz session not found or expired")
    if session["result"] is None:
        raise HTTPException(400, "Submit the quiz before downloading the answer key")

    mcqs = session["mcqs"]
    pdf_buffer = generate_mcq_pdf(mcqs, include_answers=True, title="Quiz Results & Answer Key")

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=quiz_answers.pdf"},
    )


@router.post("/export-pdf")
def export_pdf(payload: PDFExportPayload):
    """Stateless PDF export — used by exam mode, which has no session_id to look 
    anything up by. The frontend sends back the exact question data it already has."""
    pdf_buffer = generate_mcq_pdf(payload.questions, include_answers=True, title=payload.title)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=mcq_answer_key.pdf"},
    )