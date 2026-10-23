import { createContext, useContext, useState } from 'react';

const QuizContext = createContext(null);

export function QuizProvider({ children }) {
    // ── Generate-phase state ──────────────────────────────────────────────────
    // Raw API response fields stored after /generate succeeds
    const [apiQuestions, setApiQuestions] = useState([]); // array of question objects
    const [apiMode, setApiMode] = useState(null);          // 'quiz' | 'exam' (from response)
    const [sessionId, setSessionId] = useState(null);      // present only for quiz mode
    const [apiTopic, setApiTopic] = useState(null);        // topic from response
    const [warning, setWarning] = useState(null);          // warning string or null

    // ── Submit-phase state ────────────────────────────────────────────────────
    // Full result from /submit or /result (quiz mode only)
    const [quizResult, setQuizResult] = useState(null);

    // ── UI convenience ────────────────────────────────────────────────────────
    const [sourceFile, setSourceFile] = useState(null);   // File object for display
    const [questionCount, setQuestionCount] = useState(0);
    const [practiceMode, setPracticeMode] = useState('quiz'); // user's UI selection

    /** Called after a successful /generate call — stores the full response. */
    const storeGenerateResponse = (data, file) => {
        setApiQuestions(data.questions ?? []);
        setApiMode(data.mode);
        setSessionId(data.session_id ?? null);
        setApiTopic(data.topic ?? null);
        setWarning(data.warning ?? null);
        setQuestionCount(data.questions?.length ?? 0);
        setSourceFile(file);
        setQuizResult(null); // reset any prior result
    };

    /** Called after a successful /submit call. */
    const storeQuizResult = (result) => {
        setQuizResult(result);
    };

    return (
        <QuizContext.Provider
            value={{
                // generate response
                apiQuestions,
                apiMode,
                sessionId,
                apiTopic,
                warning,
                storeGenerateResponse,

                // submit result
                quizResult,
                storeQuizResult,

                // UI helpers
                sourceFile,
                setSourceFile,
                questionCount,
                setQuestionCount,
                practiceMode,
                setPracticeMode,
            }}
        >
            {children}
        </QuizContext.Provider>
    );
}

export function useQuiz() {
    const ctx = useContext(QuizContext);
    if (!ctx) throw new Error('useQuiz must be used within QuizProvider');
    return ctx;
}
