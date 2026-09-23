import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, ArrowRight, CheckCircle, XCircle, Trophy,
    RotateCcw, Lightbulb, Zap, GraduationCap, AlertCircle,
    Loader2, X, List, Download, TrendingDown, TrendingUp, ArrowRight as ArrowRightSm,
} from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
import ProgressBar from '../components/ProgressBar';
import { useQuiz } from '../context/QuizContext';
import { submitQuiz, getQuizResult, exportExamPdf, downloadQuizPdf, triggerBlobDownload } from '../api';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const QUESTIONS_PER_PAGE = 5;

// ─── SHARED: EXPLANATION BLOCK ────────────────────────────────────────────────

function ExplanationBlock({ text }) {
    if (!text) return null;
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mt-5 rounded-xl border border-brand-orange/25 bg-brand-orange/[0.06] border-l-4 border-l-brand-orange p-5"
        >
            <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-brand-orange flex-shrink-0" />
                <p className="text-[11px] font-bold text-brand-orange uppercase tracking-widest">
                    Explanation
                </p>
            </div>
            <p className="text-sm text-brand-muted leading-relaxed">{text}</p>
        </motion.div>
    );
}

// ─── SHARED: DOWNLOAD PDF BUTTON ──────────────────────────────────────────────

function DownloadPdfButton({ onDownload, label = 'Download PDF' }) {
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null); // { type: 'error', msg }

    const handleClick = async () => {
        setLoading(true);
        setToast(null);
        try {
            await onDownload();
        } catch (err) {
            setToast({ type: 'error', msg: err.message || 'PDF generation failed. Please try again.' });
            // Auto-dismiss after 5s
            setTimeout(() => setToast(null), 5000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <motion.button
                onClick={handleClick}
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-brand-orange/40 bg-brand-orange/10 text-brand-orange text-sm font-semibold transition-all duration-200 hover:bg-brand-orange/15 hover:border-brand-orange/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Generating PDF…</>
                    : <><Download className="w-4 h-4" />{label}</>}
            </motion.button>

            {/* Error toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95, boxShadow: '0px 0px 0px rgba(239,68,68,0)' }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: [0.95, 1.02, 1],
                            boxShadow: ['0px 0px 0px rgba(239,68,68,0)', '0px 0px 24px rgba(239,68,68,0.5)', '0px 0px 0px rgba(239,68,68,0)']
                        }}
                        exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.2 } }}
                        transition={{
                            duration: 0.4,
                            ease: 'easeOut',
                            boxShadow: { delay: 0.35, duration: 0.8, ease: 'easeOut' }
                        }}
                        className="absolute top-full mt-2 left-0 z-50 flex items-start gap-2 px-4 py-3 rounded-xl border border-red-500/40 border-l-4 border-l-red-500 bg-red-500/10 text-red-400 text-xs whitespace-nowrap shadow-lg"
                    >
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>{toast.msg}</span>
                        <button onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100">
                            <X className="w-3 h-3" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── SHARED: PAGINATION CONTROLS ─────────────────────────────────────────────

function Pagination({ page, totalPages, onChange, total, perPage }) {
    const start = page * perPage + 1;
    const end = Math.min((page + 1) * perPage, total);

    const pages = Array.from({ length: totalPages }, (_, i) => i);
    // Show at most 7 page buttons — ellide in the middle for large sets
    const visiblePages = totalPages <= 7
        ? pages
        : [
            ...pages.slice(0, Math.min(2, page)),
            ...(page > 2 ? ['…left'] : []),
            ...pages.slice(Math.max(0, page - 1), Math.min(totalPages, page + 2)),
            ...(page < totalPages - 3 ? ['…right'] : []),
            ...pages.slice(Math.max(totalPages - 2, page + 2)),
        ].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

    return (
        <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-xs text-brand-mutedDark">
                Showing <span className="text-brand-muted font-medium">{start}–{end}</span> of{' '}
                <span className="text-brand-muted font-medium">{total}</span>
            </p>
            <div className="flex items-center gap-1.5">
                {/* Previous */}
                <button
                    onClick={() => onChange(page - 1)}
                    disabled={page === 0}
                    className="btn-ghost px-3 py-2 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {visiblePages.map((p, idx) =>
                        typeof p === 'string' ? (
                            <span key={`ellipsis-${idx}`} className="px-1 text-brand-mutedDark text-xs">
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onChange(p)}
                                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 ${p === page
                                    ? 'bg-brand-orange text-white shadow-orange-glow-sm'
                                    : 'border border-white/10 text-brand-muted hover:border-brand-orange hover:text-brand-orange hover:bg-brand-orange/5'
                                    }`}
                            >
                                {p + 1}
                            </button>
                        )
                    )}
                </div>

                {/* Next */}
                <button
                    onClick={() => onChange(page + 1)}
                    disabled={page === totalPages - 1}
                    className="btn-ghost px-3 py-2 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next page"
                >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

// ─── SHARED: SIDEBAR QUESTION JUMP LIST ───────────────────────────────────────

function QuestionSidebar({ questions, currentPage, onJump, answers, type }) {
    // type: 'exam' | 'review'
    return (
        <aside className="hidden xl:block sticky top-28 self-start">
            <div className="card p-4 w-64">
                <div className="flex items-center gap-2 mb-3">
                    <List className="w-3.5 h-3.5 text-brand-orange" />
                    <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
                        Questions
                    </span>
                </div>
                <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
                    {questions.map((q, i) => {
                        const pageForQ = Math.floor(i / QUESTIONS_PER_PAGE);
                        const isActive = pageForQ === currentPage;
                        let dotColor = 'bg-white/20';
                        if (type === 'review' && answers) {
                            dotColor = answers[i]?.is_correct ? 'bg-green-500' : 'bg-red-500';
                        } else if (type === 'exam') {
                            dotColor = 'bg-brand-orange/60';
                        }
                        return (
                            <button
                                key={i}
                                onClick={() => onJump(pageForQ)}
                                className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 ${isActive
                                    ? 'bg-brand-orange/10 text-brand-text'
                                    : 'text-brand-mutedDark hover:text-brand-muted hover:bg-white/[0.03]'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                                <span className="truncate">Q{i + 1}. {q.question?.slice(0, 40)}{q.question?.length > 40 ? '…' : ''}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}

// ─── WARNING BANNER ───────────────────────────────────────────────────────────

function WarningBanner({ message, onDismiss }) {
    if (!message) return null;
    return (
        <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95, boxShadow: '0px 0px 0px rgba(245,158,11,0)' }}
            animate={{
                opacity: 1,
                y: 0,
                scale: [0.95, 1.02, 1],
                boxShadow: ['0px 0px 0px rgba(245,158,11,0)', '0px 0px 24px rgba(245,158,11,0.5)', '0px 0px 0px rgba(245,158,11,0)']
            }}
            exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{
                duration: 0.4,
                ease: 'easeOut',
                boxShadow: { delay: 0.35, duration: 0.8, ease: 'easeOut' }
            }}
            className="mb-5 flex items-start gap-3 p-4 rounded-xl border border-amber-500/40 border-l-4 border-l-amber-500 bg-amber-500/10 text-amber-400 text-sm"
        >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{message}</span>
            <button onClick={onDismiss} className="flex-shrink-0 opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

// ─── EXAM MODE — READ-ONLY ANSWER SHEET ──────────────────────────────────────

function ExamAnswerSheet({ questions, onBack }) {
    const [page, setPage] = useState(0);
    const listRef = useRef(null);
    const [direction, setDirection] = useState(1);
    const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
    const pageQuestions = questions.slice(page * QUESTIONS_PER_PAGE, (page + 1) * QUESTIONS_PER_PAGE);
    const pageOffset = page * QUESTIONS_PER_PAGE;

    const changePage = (next) => {
        setDirection(next > page ? 1 : -1);
        setPage(next);
        requestAnimationFrame(() => {
            listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    return (
        <div className="flex gap-8 items-start">
            {/* ── Main content ── */}
            <div className="flex-1 min-w-0">
                {/* Header bar */}
                <div className="flex items-center gap-3 mb-6" ref={listRef}>
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-brand-orange" />
                        <span className="text-sm font-semibold text-brand-text">Exam Mode — Answer Key</span>
                    </div>
                    <span className="ml-auto text-xs text-brand-muted">
                        {questions.length} question{questions.length !== 1 ? 's' : ''}
                    </span>
                    {/* PDF download — exam is stateless, POST questions directly */}
                    <DownloadPdfButton
                        label="Download PDF"
                        onDownload={async () => {
                            const { blob, filename } = await exportExamPdf(questions);
                            triggerBlobDownload(blob, filename);
                        }}
                    />
                </div>

                {/* Animated question list */}
                <div className="relative overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={page}
                            custom={direction}
                            initial={(d) => ({ x: d > 0 ? 48 : -48, opacity: 0 })}
                            animate={{ x: 0, opacity: 1 }}
                            exit={(d) => ({ x: d > 0 ? -48 : 48, opacity: 0 })}
                            transition={{ duration: 0.28, ease: 'easeInOut' }}
                            className="space-y-5"
                        >
                            {pageQuestions.map((q, idx) => {
                                const globalIdx = pageOffset + idx;
                                return (
                                    <div key={globalIdx} className="card overflow-hidden">
                                        {/* Question */}
                                        <div className="p-5 pb-4">
                                            <span className="text-xs font-mono text-brand-mutedDark block mb-2">
                                                QUESTION {globalIdx + 1}
                                            </span>
                                            <h2 className="text-sm font-semibold text-brand-text leading-relaxed">
                                                {q.question}
                                            </h2>
                                        </div>

                                        {/* Options */}
                                        <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-2">
                                            {q.options.map((opt, i) => {
                                                const isCorrect = opt === q.correct_answer;
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors duration-300 ${isCorrect
                                                            ? 'border-green-500/50 bg-green-500/10'
                                                            : 'border-white/[0.06] bg-white/[0.02]'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${isCorrect
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-white/10 text-brand-muted'
                                                                }`}
                                                        >
                                                            {OPTION_LABELS[i]}
                                                        </span>
                                                        <span
                                                            className={`text-sm flex-1 leading-relaxed ${isCorrect ? 'text-brand-text font-medium' : 'text-brand-muted'
                                                                }`}
                                                        >
                                                            {opt}
                                                        </span>
                                                        {isCorrect && (
                                                            <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            <ExplanationBlock text={q.explanation} />
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onChange={changePage}
                        total={questions.length}
                        perPage={QUESTIONS_PER_PAGE}
                    />
                )}

                <div className="mt-8 flex gap-3">
                    <button onClick={onBack} className="btn-ghost px-5 py-3">
                        <ChevronLeft className="w-4 h-4" />
                        Generate New
                    </button>
                </div>
            </div>

            {/* ── Sticky sidebar ── */}
            <QuestionSidebar
                questions={questions}
                currentPage={page}
                onJump={changePage}
                type="exam"
            />
        </div>
    );
}

// ─── QUIZ TAKING ──────────────────────────────────────────────────────────────

function QuizTaking({ questions, answers, setAnswers, onSubmit, submitting }) {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(1);

    const isLast = current === questions.length - 1;
    const q = questions[current];
    const selected = answers[current];
    const answeredCount = answers.filter((a) => a !== null).length;
    const allAnswered = answeredCount === questions.length;

    const selectOption = (optText) => {
        const next = [...answers];
        next[current] = optText;
        setAnswers(next);
    };

    const goTo = (idx) => {
        setDirection(idx > current ? 1 : -1);
        setCurrent(idx);
    };

    return (
        <div>
            {/* ── Header strip ── */}
            <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <Zap className="w-4 h-4 text-brand-orange" fill="currentColor" />
                        <span className="text-sm font-semibold text-brand-text">Quiz Mode</span>
                    </div>
                    <p className="text-xs text-brand-muted">
                        {answeredCount} of {questions.length} answered
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-1 max-w-[240px]">
                    <ProgressBar value={answeredCount} max={questions.length} className="flex-1" />
                    <span className="text-xs text-brand-muted whitespace-nowrap tabular-nums">
                        {current + 1}/{questions.length}
                    </span>
                </div>
            </div>

            {/* ── Question slide ── */}
            <div className="relative overflow-hidden" style={{ minHeight: 380 }}>
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={current}
                        custom={direction}
                        initial={(dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 })}
                        animate={{ x: 0, opacity: 1 }}
                        exit={(dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 })}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="card p-6 sm:p-8"
                    >
                        <span className="text-xs font-mono text-brand-mutedDark mb-3 block">
                            QUESTION {current + 1}
                        </span>
                        <h2 className="text-lg sm:text-xl font-semibold text-brand-text leading-relaxed mb-6">
                            {q.question}
                        </h2>

                        <div className="space-y-3">
                            {q.options.map((opt, i) => {
                                const isSelected = selected === opt;
                                return (
                                    <motion.button
                                        key={i}
                                        id={`option-${current}-${i}`}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => selectOption(opt)}
                                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${isSelected
                                            ? 'border-brand-orange/60 bg-brand-orange/10'
                                            : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                                            }`}
                                    >
                                        <span
                                            className={`flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-200 ${isSelected
                                                ? 'bg-brand-orange text-white'
                                                : 'bg-white/10 text-brand-muted'
                                                }`}
                                        >
                                            {OPTION_LABELS[i]}
                                        </span>
                                        <span className="text-sm text-brand-text flex-1">{opt}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── Navigation row ── */}
            <div className="flex items-center justify-between mt-5 gap-4">
                <button
                    onClick={() => goTo(current - 1)}
                    disabled={current === 0}
                    className="btn-ghost px-4 py-2.5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                </button>

                {/* Dot navigator */}
                <div className="flex gap-1.5 flex-wrap justify-center flex-1">
                    {questions.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            aria-label={`Go to question ${i + 1}`}
                            className={`rounded-full transition-all duration-200 ${i === current
                                ? 'w-5 h-2 bg-brand-orange'
                                : answers[i] !== null
                                    ? 'w-2 h-2 bg-brand-orange/50'
                                    : 'w-2 h-2 bg-white/20'
                                }`}
                        />
                    ))}
                </div>

                {isLast ? (
                    <motion.button
                        id="btn-submit-quiz"
                        whileHover={allAnswered && !submitting ? { scale: 1.02 } : {}}
                        whileTap={allAnswered && !submitting ? { scale: 0.98 } : {}}
                        onClick={onSubmit}
                        disabled={!allAnswered || submitting}
                        title={!allAnswered ? `Answer all ${questions.length} questions first` : ''}
                        className="btn-primary px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Submitting…
                            </>
                        ) : (
                            <>
                                Submit Quiz
                                {!allAnswered && <AlertCircle className="w-3.5 h-3.5 opacity-70" />}
                            </>
                        )}
                    </motion.button>
                ) : (
                    <button onClick={() => goTo(current + 1)} className="btn-primary px-4 py-2.5">
                        Next
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>

            {isLast && !allAnswered && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-brand-muted text-center mt-3"
                >
                    {questions.length - answeredCount} question
                    {questions.length - answeredCount !== 1 ? 's' : ''} still unanswered — use the dots above to navigate back.
                </motion.p>
            )}
        </div>
    );
}

// ─── REVIEW CARD ──────────────────────────────────────────────────────────────

function ReviewCard({ item, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            className="card overflow-hidden"
        >
            {/* Question header */}
            <div className="flex items-start gap-3 p-5 pb-4">
                <span
                    className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${item.is_correct
                        ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                        : 'bg-red-500/20 border border-red-500/30 text-red-400'
                        }`}
                >
                    {index + 1}
                </span>
                <p className="flex-1 text-sm text-brand-text font-medium leading-relaxed">
                    {item.question}
                </p>
                {item.is_correct ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                )}
            </div>

            {/* Options */}
            <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-2">
                {item.options.map((opt, i) => {
                    const isCorrectOpt = opt === item.correct_answer;
                    const isUserPick = opt === item.user_answer;
                    const isWrongPick = isUserPick && !isCorrectOpt;

                    let rowCls = 'border-white/[0.06] bg-white/[0.02]';
                    let circleCls = 'bg-white/10 text-brand-muted';
                    let textCls = 'text-brand-muted';

                    if (isCorrectOpt) {
                        rowCls = 'border-green-500/50 bg-green-500/10';
                        circleCls = 'bg-green-500 text-white';
                        textCls = 'text-brand-text';
                    } else if (isWrongPick) {
                        rowCls = 'border-red-500/50 bg-red-500/10';
                        circleCls = 'bg-red-500 text-white';
                    }

                    return (
                        <div
                            key={i}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors duration-300 ${rowCls}`}
                        >
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${circleCls}`}>
                                {OPTION_LABELS[i]}
                            </span>
                            <span className={`text-sm flex-1 leading-relaxed ${textCls}`}>{opt}</span>
                            {isCorrectOpt && (
                                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                            )}
                        </div>
                    );
                })}

                <ExplanationBlock text={item.explanation} />
            </div>
        </motion.div>
    );
}

// ─── AI INSIGHTS ──────────────────────────────────────────────────────────────
// Accepts structured insights object: { weak_topics, improvement_points, strong_topics }
// Falls back gracefully if the API still returns a plain string.

function AIInsights({ insights }) {
    // Legacy: if insights is a plain string, render old single-paragraph style
    const isStructured = insights && typeof insights === 'object';
    const hasContent = insights && (isStructured ? Object.keys(insights).length > 0 : insights.length > 0);
    if (!hasContent) return null;

    const weakTopics = isStructured ? (insights.weak_topics ?? []) : [];
    const improvementPoints = isStructured ? (insights.improvement_points ?? []) : [];
    const strongTopics = isStructured ? (insights.strong_topics ?? []) : [];
    const legacyText = !isStructured ? insights : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-2xl border border-brand-orange/30 bg-brand-orange/[0.06]"
            style={{ boxShadow: '0 0 32px rgba(249,115,22,0.1), 0 0 1px rgba(249,115,22,0.3) inset' }}
        >
            {/* Corner glow */}
            <div
                className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at top right, rgba(249,115,22,0.15) 0%, transparent 70%)' }}
            />

            {/* Header */}
            <div className="relative flex items-center gap-3 px-6 py-4 border-b border-brand-orange/20 bg-brand-orange/[0.04]">
                <div className="w-8 h-8 rounded-lg bg-brand-orange/15 border border-brand-orange/30 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-brand-orange" fill="rgba(249,115,22,0.25)" />
                </div>
                <div>
                    <h3 className="font-bold text-brand-text text-sm leading-none">AI Insights</h3>
                    <p className="text-[11px] text-brand-orange/70 mt-0.5">Personalised feedback on your performance</p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-orange/15 border border-brand-orange/25 text-brand-orange text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
                    AI
                </span>
            </div>

            {/* Body */}
            <div className="relative px-6 py-5 space-y-6">

                {/* ── Legacy plain-text fallback ── */}
                {legacyText && (
                    <p className="text-sm text-brand-muted leading-relaxed">{legacyText}</p>
                )}

                {/* ── Weak Topics ── horizontal bar chart, sorted weakest first */}
                {weakTopics.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                            <span className="text-xs font-bold text-brand-text uppercase tracking-wider">Weak Topics</span>
                        </div>
                        <div className="space-y-3">
                            {weakTopics.map((t, i) => {
                                // shape: { topic, correct, total } or { topic, score_pct }
                                const pct = t.score_pct != null
                                    ? t.score_pct
                                    : t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
                                const label = t.total != null
                                    ? `${t.correct ?? 0}/${t.total} correct`
                                    : `${pct}%`;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.06, duration: 0.3 }}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-brand-text font-medium truncate max-w-[70%]">{t.topic}</span>
                                            <span className="text-xs text-brand-mutedDark tabular-nums">{label}</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full bg-brand-orange"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ delay: i * 0.06 + 0.15, duration: 0.5, ease: 'easeOut' }}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Improvement Points ── bulleted list */}
                {improvementPoints.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <ArrowRightSm className="w-3.5 h-3.5 text-brand-orange" />
                            <span className="text-xs font-bold text-brand-text uppercase tracking-wider">Improvement Points</span>
                        </div>
                        <ul className="space-y-2">
                            {improvementPoints.map((point, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05, duration: 0.28 }}
                                    className="flex items-start gap-2.5"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange flex-shrink-0 mt-1.5" />
                                    <span className="text-sm text-brand-muted leading-relaxed">{point}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* ── Strong Topics ── pill tags, less prominent */}
                {strongTopics.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-xs font-bold text-brand-text uppercase tracking-wider">Strong Topics</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {strongTopics.map((t, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.04, duration: 0.22 }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-medium"
                                >
                                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                    {typeof t === 'string' ? t : t.topic}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
// ─── QUIZ REVIEW (results phase) ─────────────────────────────────────────────

function QuizReview({ result, onRestart, onBack, sessionId }) {
    const { score, total, percentage, graded_questions, ai_insights } = result;
    const [page, setPage] = useState(0);
    const [direction, setDirection] = useState(1);
    const listRef = useRef(null);
    const totalPages = Math.ceil(graded_questions.length / QUESTIONS_PER_PAGE);
    const pageItems = graded_questions.slice(page * QUESTIONS_PER_PAGE, (page + 1) * QUESTIONS_PER_PAGE);
    const pageOffset = page * QUESTIONS_PER_PAGE;

    const changePage = (next) => {
        setDirection(next > page ? 1 : -1);
        setPage(next);
        requestAnimationFrame(() => {
            listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    const grade =
        percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : percentage >= 40 ? 'Fair' : 'Needs Work';
    const gradeColor =
        percentage >= 80 ? 'text-green-400'
            : percentage >= 60 ? 'text-brand-orange'
                : percentage >= 40 ? 'text-yellow-400'
                    : 'text-red-400';

    return (
        <div className="flex gap-8 items-start">
            {/* ── Main content ── */}
            <div className="flex-1 min-w-0">
                {/* Score summary */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="card p-6 sm:p-8 relative overflow-hidden mb-6"
                >
                    <div className="absolute inset-0 bg-orange-radial opacity-50 pointer-events-none" />
                    <div className="relative flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-brand-orange/10 border-2 border-brand-orange/30 flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-9 h-9 text-brand-orange" />
                        </div>
                        <div className="text-center sm:text-left flex-1">
                            <p className={`text-sm font-semibold mb-1 ${gradeColor}`}>{grade}</p>
                            <p className="text-4xl font-black text-gradient mb-1">{score}/{total}</p>
                            <p className="text-brand-muted text-sm">correct — {percentage}% score</p>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
                            {/* PDF download — available after submission, uses session_id */}
                            {sessionId && (
                                <DownloadPdfButton
                                    label="Download PDF"
                                    onDownload={async () => {
                                        const { blob, filename } = await downloadQuizPdf(sessionId);
                                        triggerBlobDownload(blob, filename);
                                    }}
                                />
                            )}
                            <button onClick={onRestart} className="btn-ghost text-xs px-3 py-2">
                                <RotateCcw className="w-3.5 h-3.5" />
                                Retake
                            </button>
                            <button onClick={onBack} className="btn-ghost text-xs px-3 py-2">
                                <ChevronLeft className="w-3.5 h-3.5" />
                                Back
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Review label */}
                <div className="flex items-center gap-3 mb-4" ref={listRef}>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-xs text-brand-mutedDark uppercase tracking-widest font-semibold">
                        Full Review
                    </span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* Paginated review cards */}
                <div className="relative overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={page}
                            custom={direction}
                            initial={(d) => ({ x: d > 0 ? 48 : -48, opacity: 0 })}
                            animate={{ x: 0, opacity: 1 }}
                            exit={(d) => ({ x: d > 0 ? -48 : 48, opacity: 0 })}
                            transition={{ duration: 0.28, ease: 'easeInOut' }}
                            className="space-y-4"
                        >
                            {pageItems.map((gq, i) => (
                                <ReviewCard key={pageOffset + i} item={gq} index={pageOffset + i} />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {totalPages > 1 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onChange={changePage}
                        total={graded_questions.length}
                        perPage={QUESTIONS_PER_PAGE}
                    />
                )}

                {/* AI Insights — shown always below review cards */}
                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-xs text-brand-mutedDark uppercase tracking-widest font-semibold">
                            AI Analysis
                        </span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>
                    <AIInsights insights={ai_insights} />
                </div>
            </div>

            {/* ── Sticky sidebar ── */}
            <QuestionSidebar
                questions={graded_questions}
                currentPage={page}
                onJump={changePage}
                answers={graded_questions}
                type="review"
            />
        </div>
    );
}

// ─── PAGE ROOT ────────────────────────────────────────────────────────────────

export default function Quiz() {
    const navigate = useNavigate();
    const location = useLocation();
    const { apiQuestions, apiMode, sessionId, warning, quizResult, storeQuizResult } = useQuiz();

    const [answers, setAnswers] = useState(() => (apiQuestions ?? []).map(() => null));
    const [phase, setPhase] = useState(quizResult ? 'review' : 'taking');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [showWarning, setShowWarning] = useState(true);

    // Page-refresh recovery: try to fetch already-submitted result
    useEffect(() => {
        async function tryRecover() {
            if (apiMode === 'quiz' && sessionId && !quizResult) {
                try {
                    const result = await getQuizResult(sessionId);
                    storeQuizResult(result);
                    setPhase('review');
                } catch {
                    // 404 — not yet submitted, stay on taking phase
                }
            }
        }
        tryRecover();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setAnswers((apiQuestions ?? []).map(() => null));
    }, [apiQuestions]);

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitError(null);
        try {
            const result = await submitQuiz(sessionId, answers);
            storeQuizResult(result);
            setPhase('review');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            setSubmitError(err.message || 'Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRestart = () => {
        setAnswers((apiQuestions ?? []).map(() => null));
        setPhase('taking');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!apiQuestions || apiQuestions.length === 0) {
        return (
            <PageWrapper>
                <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-brand-muted mb-4">No questions loaded. Generate a quiz first.</p>
                        <button onClick={() => navigate('/generate')} className="btn-primary px-6 py-3">
                            Go to Generate
                        </button>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="pt-24 pb-20 min-h-screen">
                {/* Wider container for quiz/exam pages — max-w-5xl gives breathing room */}
                <div className="section-container max-w-5xl">
                    {/* Back button */}
                    {(phase === 'taking' || apiMode === 'exam') && (
                        <button
                            onClick={() => navigate('/generate')}
                            className="btn-ghost text-xs px-3 py-2 mb-6"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            Back to Setup
                        </button>
                    )}

                    {/* Warning banner */}
                    <AnimatePresence>
                        {showWarning && warning && (
                            <WarningBanner message={warning} onDismiss={() => setShowWarning(false)} />
                        )}
                    </AnimatePresence>

                    {/* Submit error */}
                    <AnimatePresence>
                        {submitError && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95, boxShadow: '0px 0px 0px rgba(239,68,68,0)' }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: [0.95, 1.02, 1],
                                    boxShadow: ['0px 0px 0px rgba(239,68,68,0)', '0px 0px 24px rgba(239,68,68,0.5)', '0px 0px 0px rgba(239,68,68,0)']
                                }}
                                exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } }}
                                transition={{
                                    duration: 0.4,
                                    ease: 'easeOut',
                                    boxShadow: { delay: 0.35, duration: 0.8, ease: 'easeOut' }
                                }}
                                className="mb-4 flex items-start gap-3 p-4 rounded-xl border border-red-500/40 border-l-4 border-l-red-500 bg-red-500/10 text-red-400 text-sm"
                            >
                                <span className="flex-1">{submitError}</span>
                                <button onClick={() => setSubmitError(null)} className="flex-shrink-0 opacity-70 hover:opacity-100">
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── EXAM MODE ── */}
                    {apiMode === 'exam' ? (
                        <ExamAnswerSheet questions={apiQuestions} onBack={() => navigate('/generate')} />
                    ) : (
                        /* ── QUIZ MODE ── */
                        <AnimatePresence mode="wait">
                            {phase === 'taking' ? (
                                <motion.div
                                    key="taking"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    // Keep quiz taking centred and narrow for good UX
                                    className="max-w-2xl mx-auto"
                                >
                                    <QuizTaking
                                        questions={apiQuestions}
                                        answers={answers}
                                        setAnswers={setAnswers}
                                        onSubmit={handleSubmit}
                                        submitting={submitting}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="review"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {quizResult ? (
                                        <QuizReview
                                            result={quizResult}
                                            onRestart={handleRestart}
                                            onBack={() => navigate('/generate')}
                                            sessionId={sessionId}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center py-20">
                                            <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
}
