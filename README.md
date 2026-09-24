# MCQ-Agent

An AI-powered backend that generates multiple-choice questions (MCQs) from uploaded documents (PDF, PPTX, DOCX, TXT). Supports full-document coverage or topic-specific generation, two quiz-taking modes (Quiz Mode and Exam Mode), automatic grading with AI-generated study insights, and PDF export of results.

Built with **FastAPI**, **LangChain**, **Groq** (LLM), **Google Generative AI** (embeddings), and **Pinecone** (vector search for topic-based generation).

---

## Table of Contents

- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
  - [POST /api/generate](#post-apigenerate)
  - [POST /api/quiz/{session_id}/submit](#post-apiquizsession_idsubmit)
  - [GET /api/quiz/{session_id}/result](#get-apiquizsession_idresult)
  - [GET /api/quiz/{session_id}/download-pdf](#get-apiquizsession_iddownload-pdf)
  - [POST /api/export-pdf](#post-apiexport-pdf)
  - [GET /health](#get-health)
- [Quiz Mode vs Exam Mode](#quiz-mode-vs-exam-mode)
- [Topic-Specific Generation & Namespace Cleanup](#topic-specific-generation--namespace-cleanup)
- [Rate Limiting & Retries](#rate-limiting--retries)
- [Security Notes](#security-notes)
- [Known Limitations](#known-limitations)

---

## How It Works

1. **Upload** — a user uploads a document (PDF/PPTX/DOCX/TXT) along with how many questions they want and which mode (Quiz or Exam).
2. **Load & Chunk** — the document is parsed into text and split into ~2000-character chunks.
3. **Generate** — chunks are sent to Groq's LLM (`openai/gpt-oss-120b`) in parallel (bounded concurrency) to generate structured MCQs, each with a question, 4 options, correct answer, explanation, and topic label.
4. **Respond**
   - **Exam Mode**: the full answer key (questions + correct answers + explanations) is returned immediately — no session is created, nothing is graded.
   - **Quiz Mode**: only questions + options are returned (answers withheld), and a `session_id` is issued so the quiz can be graded later.
5. **Submit (Quiz Mode only)** — the user answers all questions client-side, then submits them in one batch. The backend grades them, computes a per-topic breakdown of wrong answers, and asks the LLM for short, targeted improvement points.
6. **Export** — either mode can be downloaded as a PDF answer sheet.

---

## Tech Stack

| Layer | Technology |
|---|---|
| API framework | FastAPI (async) |
| Document loading | LangChain (`PyPDFLoader`, `Docx2txtLoader`, `TextLoader`, `UnstructuredPowerPointLoader`) |
| Text splitting | LangChain `RecursiveCharacterTextSplitter` |
| MCQ generation | Groq (`openai/gpt-oss-120b`) via `langchain-groq`, structured output via Pydantic |
| Embeddings | Google Generative AI (`gemini-embedding-001`) |
| Vector search (topic mode) | Pinecone (serverless) |
| PDF export | ReportLab |
| Scheduled cleanup | APScheduler |
| Hosting | Render |

---

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Set environment variables

Create a `.env` file (see [Environment Variables](#environment-variables) below).

### 3. Run locally

```bash
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs`.

### 4. Deploy (Render)

- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add all required environment variables in the Render dashboard under **Environment**.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | Yes | Google Generative AI API key, used for embeddings (topic-based generation only) |
| `GROQ_API_KEY` | Yes | Groq API key, used for all MCQ generation and AI insights |
| `PINECONE_API_KEY` | Yes | Pinecone API key, used for topic-based generation's vector search |

The app will refuse to start if any of these are missing.

---

## API Routes

All routes below (except `/health`) are prefixed with **`/api`**.

### POST `/api/generate`

Generates a set of MCQs from an uploaded document.

**Request:** `multipart/form-data`

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `file` | File | Yes | — | `.pdf`, `.pptx`, `.txt`, or `.docx`. Max 40MB. |
| `total_questions` | int | No | `10` | Clamped server-side to the range 3–50 |
| `mode` | string | No | `"quiz"` | `"quiz"` or `"exam"` |
| `topic` | string | No | `""` | If provided, switches to topic-specific generation using Pinecone vector search instead of full-document coverage |

**Response — Quiz Mode:**

```json
{
  "session_id": "uuid",
  "mode": "quiz",
  "topic": null,
  "warning": "string or null",
  "questions": [
    { "question": "string", "options": ["string", "string", "string", "string"] }
  ]
}
```

No `correct_answer` or `explanation` is included — answers are withheld until `/submit` is called.

**Response — Exam Mode:**

```json
{
  "mode": "exam",
  "topic": null,
  "warning": "string or null",
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_answer": "string",
      "explanation": "string"
    }
  ]
}
```

No `session_id` — nothing is stored server-side, since there is nothing to grade or submit later. This is a one-shot, complete answer key.

**Errors:**

| Status | Cause |
|---|---|
| 400 | Unsupported file extension, invalid `mode`, file exceeds 40MB |
| 422 | Document produced no usable content (e.g. empty/unreadable file) |
| 500 | Unexpected generation failure (check server logs) |

---

### POST `/api/quiz/{session_id}/submit`

Grades a completed Quiz Mode session and returns AI-generated study insights.
**Not used for Exam Mode** — Exam Mode never creates a session.

**Request body:**

```json
{ "answers": ["option text the user picked for Q1", "...", "..."] }
```

`answers` must be the same length and order as the `questions` array returned by `/generate`. Each entry must exactly match one of that question's option strings.

**Response:**

```json
{
  "score": 7,
  "total": 10,
  "percentage": 70,
  "graded_questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "user_answer": "string",
      "correct_answer": "string",
      "is_correct": true,
      "explanation": "string"
    }
  ],
  "ai_insights": {
    "weak_topics": [
      { "topic": "string", "wrong_question_numbers": [3, 7] }
    ],
    "improvement_points": ["string", "string"],
    "strong_topics": ["string"]
  },
  "mode": "quiz"
}
```

- `weak_topics` lists only topics with at least one wrong answer, sorted by most mistakes first, with the exact question numbers (1-indexed) that were missed.
- `improvement_points` are short, LLM-generated, actionable bullet points based on the specific wrong answers.
- Calling this endpoint again with the same `session_id` returns the **cached** result instantly — it does not re-grade or re-call the LLM.

**Errors:**

| Status | Cause |
|---|---|
| 400 | `answers` length doesn't match the number of questions |
| 404 | Session not found (invalid ID, or server restarted — sessions are in-memory) |

---

### GET `/api/quiz/{session_id}/result`

Retrieves a previously submitted result — useful for recovering state after a page refresh.

**Response:** identical shape to `/submit`'s response.

**Errors:**

| Status | Cause |
|---|---|
| 404 | Session not found, or the quiz hasn't been submitted yet |

---

### GET `/api/quiz/{session_id}/download-pdf`

Downloads a PDF of the graded quiz (Quiz Mode only), including questions, options, the correct answers, and explanations. Only available **after** `/submit` has been called.

**Response:** `application/pdf` file stream (`Content-Disposition: attachment; filename=quiz_answers.pdf`)

**Errors:**

| Status | Cause |
|---|---|
| 400 | Quiz hasn't been submitted yet |
| 404 | Session not found |

---

### POST `/api/export-pdf`

Stateless PDF export for Exam Mode (which has no `session_id`). The frontend sends back the exact question data it already received from `/generate`.

**Request body:**

```json
{
  "questions": [
    { "question": "string", "options": ["..."], "correct_answer": "string", "explanation": "string" }
  ],
  "title": "Exam Mode Answer Key"
}
```

**Response:** `application/pdf` file stream (`Content-Disposition: attachment; filename=mcq_answer_key.pdf`)

---

### GET `/health`

Simple liveness check.

```json
{ "status": "ok" }
```

---

## Quiz Mode vs Exam Mode

| | Quiz Mode | Exam Mode |
|---|---|---|
| Answers shown at generation? | No | Yes, immediately |
| Requires `/submit`? | Yes | No |
| Session created? | Yes (`session_id`) | No |
| Grading / scoring? | Yes | No |
| AI Insights (weak topics, tips)? | Yes | No |
| Use case | Interactive quiz-taking with scoring and personalized feedback | Instant answer-key / study sheet generation |

---

## Topic-Specific Generation & Namespace Cleanup

When a `topic` is provided, the document is embedded and stored in a **Pinecone namespace unique to that request** (`session-<timestamp>-<random>`), then queried for chunks relevant to the topic before generating questions from just those chunks.

Namespaces are **not deleted immediately** — they're left alive so a user could, in principle, query the same upload again shortly after. Instead:

- A background job (`cleanup_expired_namespaces`) runs **once on server startup** and **every hour** thereafter.
- It reads Pinecone's own `describe_index_stats()` to see every namespace that currently exists, extracts the timestamp embedded in each namespace's name, and deletes any older than **2 hours**.
- No separate database or file is used to track expiry — the timestamp lives in the namespace name itself, so cleanup works correctly even after a server restart or Render free-tier sleep/wake cycle (the startup run always catches anything that expired while the server was down).

---

## Rate Limiting & Retries

Groq enforces a tokens-per-minute (TPM) limit. To handle this gracefully:

- `generate_mcqs_from_context` retries automatically on HTTP 429 responses, parsing Groq's own `"try again in Xs"` message to wait the exact required time (plus a small buffer) rather than guessing.
- Chunk processing concurrency is capped (`max_concurrent`, default 3) to avoid bursting past the TPM limit in the first place.
- If a chunk fails after all retries, it's skipped (logged as a warning) rather than failing the entire request — the user still gets whatever questions were successfully generated.

---

## Security Notes

- Correct answers and explanations are **never** included in `/generate`'s response for Quiz Mode — only after `/submit`. This prevents reading answers via the browser's network tab before attempting the quiz.
- Uploaded files are written to a temporary path and deleted immediately after processing (`finally` block), regardless of success or failure.
- File type and size are validated server-side (`ALLOWED_EXTENSIONS`, `MAX_FILE_SIZE`), even though the frontend also restricts this — never trust client-side validation alone.
- `total_questions` is clamped server-side (3–50) even if a raw API request tries to request more.

---

## Known Limitations

- **`QUIZ_SESSIONS` is in-memory** — all active/completed quiz sessions are lost on server restart or redeploy. For production use with persistence, this should be moved to Redis or a database.
- **Single-instance only** — both `QUIZ_SESSIONS` and the namespace-cleanup scheduler assume one running server process. Horizontal scaling (multiple instances) would need a shared session store and a coordinated (not per-instance) cleanup job.
- **Render free tier sleeps** after inactivity, which delays (but does not skip) scheduled namespace cleanup until the next request wakes the service.
