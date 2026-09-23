import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
    Wand2, ShieldCheck, Loader2, Target, BookOpen,
    Zap, GraduationCap, X, FileText, HelpCircle,
} from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
import FileDropzone from '../components/FileDropzone';
import { useQuiz } from '../context/QuizContext';
import { generateMCQs } from '../api';

// ─── FLOATING AMBIENT ICONS (GSAP, study-themed) ─────────────────────────────

// Minimal SVG paths for ambient floating icons — book, pencil, bulb, mortarboard, question
const AMBIENT_ICONS = [
    {   // Original
        id: 'book',
        viewBox: '0 0 24 24',
        path: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z',
        x: '10%', y: '25%',
    },
    {   // Original
        id: 'pencil',
        viewBox: '0 0 24 24',
        path: 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z',
        x: '82%', y: '18%',
    },
    {   // Original
        id: 'bulb',
        viewBox: '0 0 24 24',
        path: 'M9 21h6M12 3a6 6 0 0 1 4.243 10.243c-.607.606-.95 1.43-.95 2.257H9.707c0-.828-.343-1.65-.95-2.257A6 6 0 0 1 12 3zM10 17h4',
        x: '8%', y: '70%',
    },
    {   // Original
        id: 'cap',
        viewBox: '0 0 24 24',
        path: 'M22 10v6M2 10l10-5 10 5-10 5-10-5zM6 12v5c3 3 9 3 12 0v-5',
        x: '88%', y: '55%',
    },
    {   // Original
        id: 'question',
        viewBox: '0 0 24 24',
        path: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
        x: '78%', y: '82%',
    },
    {   // New 1
        id: 'globe',
        viewBox: '0 0 24 24',
        path: 'M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
        x: '6%', y: '48%',
    },
    {   // New 2
        id: 'code',
        viewBox: '0 0 24 24',
        path: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
        x: '92%', y: '35%',
    },
    {   // New 3
        id: 'target',
        viewBox: '0 0 24 24',
        path: 'M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z M18 12A6 6 0 1 1 12 6a6 6 0 0 1 6 6z M14 12A2 2 0 1 1 12 10a2 2 0 0 1 2 2z',
        x: '11%', y: '88%',
    }
];

function AmbientBackground({ active }) {
    const iconRefs = useRef([]);
    const timelines = useRef([]);
    const prefersReduced = useRef(
        typeof window !== 'undefined'
            ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
            : false
    );

    useEffect(() => {
        if (prefersReduced.current) return;

        // Create timelines only once
        if (timelines.current.length === 0) {
            iconRefs.current.forEach((el, i) => {
                if (!el) return;
                const seed = i * 137.5; // golden-angle spread
                const tl = gsap.timeline({ repeat: -1, yoyo: true });

                // Gentle floating path — no opacity changes here
                tl.to(el, {
                    x: Math.sin((seed + 30) * 0.017) * 28,
                    y: Math.cos((seed + 60) * 0.017) * 22,
                    rotation: Math.sin(seed * 0.04) * 12,
                    duration: 5 + i * 1.2,
                    ease: 'sine.inOut',
                }).to(el, {
                    x: Math.cos((seed + 90) * 0.017) * 20,
                    y: Math.sin((seed + 20) * 0.017) * 30,
                    rotation: Math.cos(seed * 0.03) * -8,
                    duration: 6 + i * 0.9,
                    ease: 'sine.inOut',
                });

                timelines.current.push(tl);
            });
        }

        // Adjust speed based on active
        timelines.current.forEach((tl) => {
            gsap.to(tl, { timeScale: active ? 3.5 : 1, duration: 1, ease: 'sine.inOut' });
        });

    }, [active]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            timelines.current.forEach((tl) => tl.kill());
            timelines.current = [];
        };
    }, []);

    // Always render the container; icons just start invisible & jump to opacity only when active
    return (
        <div
            className="pointer-events-none fixed inset-0 overflow-hidden z-0"
            aria-hidden="true"
        >
            {AMBIENT_ICONS.map((icon, i) => (
                <svg
                    key={icon.id}
                    ref={(el) => (iconRefs.current[i] = el)}
                    viewBox={icon.viewBox}
                    width={48}
                    height={48}
                    fill="none"
                    strokeWidth={1.5}
                    stroke="#f97316"
                    style={{
                        position: 'absolute',
                        left: icon.x,
                        top: icon.y,
                        opacity: prefersReduced.current ? 0 : (active ? 1 : 0.85),
                        transition: 'opacity 0.8s ease',
                        filter: 'drop-shadow(0 0 12px rgba(249,115,22,0.8))',
                        willChange: 'transform, opacity',
                    }}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                </svg>
            ))}
        </div>
    );
}

// ─── PULSING GLOW (behind generate button) ────────────────────────────────────

function ButtonGlow({ active }) {
    if (!active) return null;
    return (
        <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.04, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
                background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.35) 0%, transparent 70%)',
                filter: 'blur(8px)',
            }}
        />
    );
}

// ─── FORM VARIANTS (Framer Motion exit) ──────────────────────────────────────

const formVariants = {
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: {
        opacity: 0,
        y: -24,
        scale: 0.97,
        transition: { duration: 0.32, ease: 'easeInOut' },
    },
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Generate() {
    const navigate = useNavigate();
    const { practiceMode, setPracticeMode, storeGenerateResponse } = useQuiz();

    const [file, setFile] = useState(null);
    const [count, setCount] = useState(10);
    const [genMode, setGenMode] = useState('full'); // 'full' | 'topic'
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // 'form' | 'exiting'  — drives AnimatePresence exit before navigate
    const [viewState, setViewState] = useState('form');

    // Slider background fill
    const sliderPct = ((count - 3) / (50 - 3)) * 100;
    const sliderBg = `linear-gradient(to right, #f97316 0%, #f97316 ${sliderPct}%, rgba(255,255,255,0.1) ${sliderPct}%, rgba(255,255,255,0.1) 100%)`;

    const canGenerate = !!file && !loading;

    const handleGenerate = async () => {
        if (!file) {
            setError('Please upload a file to generate questions.');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const data = await generateMCQs({
                file,
                totalQuestions: count,
                mode: practiceMode,
                topic: genMode === 'topic' ? topic : '',
            });

            storeGenerateResponse(data, file);

            // Trigger exit animation, then navigate after it completes
            setViewState('exiting');
            setTimeout(() => {
                if (data.mode === 'exam') {
                    navigate('/quiz', { state: { mode: 'exam' } });
                } else {
                    navigate('/quiz', { state: { mode: 'quiz', session_id: data.session_id } });
                }
            }, 340); // matches exit duration
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
            setLoading(false);
        }
        // Note: setLoading(false) is NOT called on success — the page navigates away
    };

    return (
        <PageWrapper>
            {/* ── Ambient GSAP background — only active while loading ── */}
            <AmbientBackground active={loading} />

            <div className="relative z-10 pt-24 pb-20 min-h-screen">
                {/* max-w-6xl grid: main column takes all spare space, sidebar is fixed 320px */}
                <div className="section-container max-w-6xl">
                    <AnimatePresence mode="wait">
                        {viewState === 'form' && (
                            <motion.div
                                key="generate-form"
                                variants={formVariants}
                                initial="visible"
                                animate="visible"
                                exit="exit"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
                                    {/* ── Main form column ── */}
                                    <div className="min-w-0">
                                        {/* Header */}
                                        <div className="mb-8">
                                            <span className="badge mb-3">
                                                <Wand2 className="w-3 h-3" />
                                                Generate
                                            </span>
                                            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Create Your MCQ Set</h1>
                                            <p className="text-brand-muted">
                                                Upload a document and configure how your quiz should be generated.
                                            </p>
                                        </div>

                                        {/* Error banner */}
                                        <AnimatePresence>
                                            {error && (
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
                                                    <span className="flex-1">{error}</span>
                                                    <button
                                                        onClick={() => setError(null)}
                                                        className="flex-shrink-0 opacity-70 hover:opacity-100"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="space-y-5">
                                            {/* Step 1 — File upload */}
                                            <motion.div
                                                className="card p-6"
                                                animate={loading ? { opacity: 0.6 } : { opacity: 1 }}
                                                transition={{ duration: 0.25 }}
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center">
                                                        1
                                                    </span>
                                                    <h2 className="font-semibold text-brand-text">Upload Document</h2>
                                                </div>
                                                <FileDropzone
                                                    file={file}
                                                    onFileChange={setFile}
                                                    disabled={loading}
                                                />
                                                <p className="text-xs text-brand-mutedDark mt-3 text-center">
                                                    Supported formats: PDF, PPTX, TXT, DOCX
                                                </p>
                                            </motion.div>

                                            {/* Step 2 — Question count */}
                                            <motion.div
                                                className="card p-6"
                                                animate={loading ? { opacity: 0.6 } : { opacity: 1 }}
                                                transition={{ duration: 0.25 }}
                                            >
                                                <div className="flex items-center gap-3 mb-5">
                                                    <span className="w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center">
                                                        2
                                                    </span>
                                                    <h2 className="font-semibold text-brand-text">Number of Questions</h2>
                                                    <span className="ml-auto text-2xl font-extrabold text-brand-orange tabular-nums">
                                                        {count}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs text-brand-muted w-4 text-center">3</span>
                                                    <input
                                                        id="question-slider"
                                                        type="range"
                                                        min={3}
                                                        max={50}
                                                        value={count}
                                                        onChange={(e) => !loading && setCount(Number(e.target.value))}
                                                        disabled={loading}
                                                        className={`quiz-slider flex-1 ${loading ? 'cursor-not-allowed' : ''}`}
                                                        style={{ background: sliderBg }}
                                                        aria-label="Number of questions"
                                                    />
                                                    <span className="text-xs text-brand-muted w-6 text-center">50</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-brand-mutedDark mt-2 px-6">
                                                    <span>Quick review</span>
                                                    <span>Comprehensive</span>
                                                </div>
                                            </motion.div>

                                            {/* Step 3 — Generation mode */}
                                            <motion.div
                                                className="card p-6"
                                                animate={loading ? { opacity: 0.6 } : { opacity: 1 }}
                                                transition={{ duration: 0.25 }}
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center">
                                                        3
                                                    </span>
                                                    <h2 className="font-semibold text-brand-text">Generation Mode</h2>
                                                </div>

                                                <div className={`grid grid-cols-2 gap-3 ${loading ? 'pointer-events-none' : ''}`}>
                                                    {[
                                                        { value: 'full', label: 'Full Coverage', icon: BookOpen, desc: 'Questions spread across the entire document' },
                                                        { value: 'topic', label: 'Topic-Specific', icon: Target, desc: 'Focus on a specific subject or chapter' },
                                                    ].map((opt) => {
                                                        const Icon = opt.icon;
                                                        const active = genMode === opt.value;
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                id={`mode-${opt.value}`}
                                                                onClick={() => !loading && setGenMode(opt.value)}
                                                                disabled={loading}
                                                                className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-200 disabled:cursor-not-allowed ${active
                                                                    ? 'border-brand-orange/50 bg-brand-orange/10 text-brand-text'
                                                                    : 'border-white/[0.08] bg-white/[0.02] text-brand-muted hover:border-white/20'
                                                                    }`}
                                                            >
                                                                <Icon className={`w-5 h-5 ${active ? 'text-brand-orange' : ''}`} />
                                                                <span className="font-medium text-sm">{opt.label}</span>
                                                                <span className={`text-xs leading-relaxed ${active ? 'text-brand-muted' : 'text-brand-mutedDark'}`}>
                                                                    {opt.desc}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Topic input */}
                                                <AnimatePresence>
                                                    {genMode === 'topic' && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0, y: -10 }}
                                                            animate={{ height: 'auto', opacity: 1, y: 0 }}
                                                            exit={{ height: 0, opacity: 0, y: -10 }}
                                                            transition={{ duration: 0.25, ease: 'easeOut' }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="mt-4">
                                                                <input
                                                                    id="topic-input"
                                                                    type="text"
                                                                    placeholder="e.g. Transformer architecture, Gradient descent..."
                                                                    value={topic}
                                                                    onChange={(e) => !loading && setTopic(e.target.value)}
                                                                    disabled={loading}
                                                                    className="input-base disabled:cursor-not-allowed disabled:opacity-60"
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>

                                            {/* Step 4 — Practice Experience */}
                                            <motion.div
                                                className="card p-6"
                                                animate={loading ? { opacity: 0.6 } : { opacity: 1 }}
                                                transition={{ duration: 0.25 }}
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="w-6 h-6 rounded-full bg-brand-orange text-white text-xs font-bold flex items-center justify-center">
                                                        4
                                                    </span>
                                                    <h2 className="font-semibold text-brand-text">Practice Experience</h2>
                                                </div>

                                                <div className={`grid grid-cols-2 gap-3 ${loading ? 'pointer-events-none' : ''}`}>
                                                    {[
                                                        {
                                                            value: 'quiz',
                                                            label: 'Quiz Mode',
                                                            icon: Zap,
                                                            desc: 'Answer questions, then submit for grading & AI insights',
                                                        },
                                                        {
                                                            value: 'exam',
                                                            label: 'Exam Mode',
                                                            icon: GraduationCap,
                                                            desc: 'Instant answer key with explanations — no submission needed',
                                                        },
                                                    ].map((opt) => {
                                                        const Icon = opt.icon;
                                                        const active = practiceMode === opt.value;
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                id={`practice-${opt.value}`}
                                                                onClick={() => !loading && setPracticeMode(opt.value)}
                                                                disabled={loading}
                                                                className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-200 disabled:cursor-not-allowed ${active
                                                                    ? 'border-brand-orange/50 bg-brand-orange/10 text-brand-text'
                                                                    : 'border-white/[0.08] bg-white/[0.02] text-brand-muted hover:border-white/20'
                                                                    }`}
                                                            >
                                                                <Icon className={`w-5 h-5 ${active ? 'text-brand-orange' : ''}`} />
                                                                <span className="font-medium text-sm">{opt.label}</span>
                                                                <span className={`text-xs leading-relaxed ${active ? 'text-brand-muted' : 'text-brand-mutedDark'}`}>
                                                                    {opt.desc}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>

                                            {/* Security note */}
                                            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                                <ShieldCheck className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-brand-muted leading-relaxed">
                                                    Your file is processed securely in an isolated environment and automatically deleted
                                                    after question generation. We never store your documents.
                                                </p>
                                            </div>

                                            {/* Generate button */}
                                            <div className="relative">
                                                <ButtonGlow active={loading} />
                                                <motion.button
                                                    id="generate-btn"
                                                    whileHover={canGenerate ? { scale: 1.01 } : {}}
                                                    whileTap={canGenerate ? { scale: 0.98 } : {}}
                                                    onClick={handleGenerate}
                                                    disabled={!canGenerate}
                                                    className="relative btn-primary w-full py-4 text-base justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loading ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Generating your quiz…
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Wand2 className="w-5 h-5" />
                                                            {file ? `Generate ${count} Questions` : 'Upload a file to continue'}
                                                        </>
                                                    )}
                                                </motion.button>
                                            </div>

                                            {loading && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-center text-xs text-brand-muted"
                                                >
                                                    This may take up to 60 seconds for larger documents. Please wait…
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>{/* end main form column */}

                                    {/* ── Sticky summary sidebar (shows at lg+) ── */}
                                    <aside className="hidden lg:flex sticky top-28 self-start">
                                        <div className="card p-5 space-y-4 w-full">
                                            <p className="text-xs font-semibold text-brand-mutedDark uppercase tracking-wider">Summary</p>

                                            {/* File */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="w-3.5 h-3.5 text-brand-muted" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] text-brand-mutedDark uppercase tracking-wider mb-0.5">Document</p>
                                                    <p className="text-xs text-brand-text font-medium truncate">
                                                        {file ? file.name : <span className="text-brand-mutedDark italic">No file selected</span>}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Question count */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0">
                                                    <HelpCircle className="w-3.5 h-3.5 text-brand-muted" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-brand-mutedDark uppercase tracking-wider mb-0.5">Questions</p>
                                                    <p className="text-xs text-brand-text font-medium">{count}</p>
                                                </div>
                                            </div>

                                            {/* Scope */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0">
                                                    <BookOpen className="w-3.5 h-3.5 text-brand-muted" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-brand-mutedDark uppercase tracking-wider mb-0.5">Scope</p>
                                                    <p className="text-xs text-brand-text font-medium">
                                                        {genMode === 'topic'
                                                            ? topic ? `Topic: ${topic.slice(0, 22)}${topic.length > 22 ? '…' : ''}` : 'Topic-Specific'
                                                            : 'Full Coverage'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Mode */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0">
                                                    {practiceMode === 'exam'
                                                        ? <GraduationCap className="w-3.5 h-3.5 text-brand-muted" />
                                                        : <Zap className="w-3.5 h-3.5 text-brand-muted" />}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-brand-mutedDark uppercase tracking-wider mb-0.5">Mode</p>
                                                    <p className="text-xs text-brand-text font-medium">
                                                        {practiceMode === 'exam' ? 'Exam Mode' : 'Quiz Mode'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="h-px bg-white/[0.06]" />

                                            {/* Condensed generate button */}
                                            <div className="relative">
                                                <ButtonGlow active={loading} />
                                                <button
                                                    onClick={handleGenerate}
                                                    disabled={!canGenerate}
                                                    className="relative btn-primary w-full py-2.5 text-sm justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loading ? (
                                                        <><Loader2 className="w-4 h-4 animate-spin" />Generating…</>
                                                    ) : (
                                                        <><Wand2 className="w-4 h-4" />Generate</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </aside>

                                </div>{/* end grid row */}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>{/* end section-container */}
            </div>{/* end pt-24 wrapper */}
        </PageWrapper>
    );
}
