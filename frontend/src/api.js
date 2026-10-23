const BASE_URL = import.meta.env.VITE_API_URL;

/** POST /generate — returns either quiz shape or exam shape depending on `mode` */
export async function generateMCQs({ file, totalQuestions, mode, topic }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('total_questions', totalQuestions);
    formData.append('mode', mode);
    if (topic) formData.append('topic', topic);

    const response = await fetch(`${BASE_URL}/generate`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Generation failed' }));
        throw new Error(err.detail || 'Generation failed');
    }
    return response.json();
}

/**
 * POST /quiz/{session_id}/submit
 * `answers` = array of option TEXT strings, one per question, same order as questions.
 */
export async function submitQuiz(sessionId, answers) {
    const response = await fetch(`${BASE_URL}/quiz/${sessionId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Submission failed' }));
        throw new Error(err.detail || 'Submission failed');
    }
    return response.json();
}

/** GET /quiz/{session_id}/result — for page-refresh recovery on results page */
export async function getQuizResult(sessionId) {
    const response = await fetch(`${BASE_URL}/quiz/${sessionId}/result`);

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Result not found' }));
        throw new Error(err.detail || 'Result not found');
    }
    return response.json();
}

/**
 * POST /export-pdf — Exam mode: send questions array, get PDF blob back.
 * Returns { blob, filename } — caller is responsible for triggering the download.
 */
export async function exportExamPdf(questions) {
    const response = await fetch(`${BASE_URL}/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'PDF export failed' }));
        throw new Error(err.detail || 'PDF export failed');
    }

    const blob = await response.blob();
    // Extract filename from Content-Disposition if provided, otherwise fallback
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename[^;=\n]*=(["']?)([^"'\n;]+)\1/);
    const filename = match?.[2] ?? 'exam-answer-key.pdf';
    return { blob, filename };
}

/**
 * GET /quiz/{session_id}/download-pdf — Quiz mode: server generates PDF from stored result.
 * Returns { blob, filename }.
 */
export async function downloadQuizPdf(sessionId) {
    const response = await fetch(`${BASE_URL}/quiz/${sessionId}/download-pdf`);

    if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'PDF download failed' }));
        throw new Error(err.detail || 'PDF download failed');
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename[^;=\n]*=(["']?)([^"'\n;]+)\1/);
    const filename = match?.[2] ?? `quiz-result-${sessionId}.pdf`;
    return { blob, filename };
}

/** Utility: given a blob + filename, create an object URL and click-trigger a download */
export function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoke after a tick so the browser has had time to start the download
    setTimeout(() => URL.revokeObjectURL(url), 250);
}
