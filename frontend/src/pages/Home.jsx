import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Zap, ArrowRight, Upload, Settings2, FileOutput,
    FileText, FileJson, Target, ShieldCheck, TrendingUp,
    Sparkles, ChevronRight, BookOpen, Brain, Layers,
} from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

gsap.registerPlugin(ScrollTrigger);

const statsData = [
    { value: '10,000+', label: 'MCQs Generated' },
    { value: '2,500+', label: 'Active Users' },
    { value: '98%', label: 'Accuracy Rate' },
    { value: '< 10s', label: 'Generation Time' },
];

const steps = [
    {
        icon: Upload,
        title: 'Upload Your Document',
        description: 'Drag & drop any PDF, PPTX, or TXT file. We handle the parsing automatically.',
        step: '01',
    },
    {
        icon: Settings2,
        title: 'Configure Your Quiz',
        description: 'Set question count (3–50), choose full coverage or topic-specific mode.',
        step: '02',
    },
    {
        icon: FileOutput,
        title: 'Get Your MCQs',
        description: 'Receive structured questions with 4 options, correct answers, and explanations.',
        step: '03',
    },
];

const features = [
    {
        icon: FileText,
        title: 'Multi-format Support',
        description: 'Upload PDF, PowerPoint, or plain text — our parser handles them all with high fidelity.',
        color: 'from-orange-500/20 to-red-500/10',
    },
    {
        icon: FileJson,
        title: 'Structured JSON Export',
        description: 'Every quiz exports as clean, schema-validated JSON ready for your LMS or app.',
        color: 'from-blue-500/20 to-cyan-500/10',
    },
    {
        icon: Target,
        title: 'Topic-Focused Generation',
        description: 'Zoom in on a specific chapter or topic instead of the entire document.',
        color: 'from-purple-500/20 to-pink-500/10',
    },
    {
        icon: ShieldCheck,
        title: 'Privacy First',
        description: 'Files are processed in-memory and permanently deleted after generation. Zero retention.',
        color: 'from-green-500/20 to-emerald-500/10',
    },
];

export default function Home() {
    const heroRef = useRef(null);
    const stepsRef = useRef(null);
    const featuresRef = useRef(null);
    const statsRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Steps section reveal
            gsap.fromTo(
                '.step-card',
                { opacity: 0, y: 60 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    stagger: 0.15,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: stepsRef.current,
                        start: 'top 75%',
                        end: 'bottom 20%',
                        toggleActions: 'play none none reverse',
                    },
                }
            );

            // Features section
            gsap.fromTo(
                '.feature-card',
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: featuresRef.current,
                        start: 'top 75%',
                        toggleActions: 'play none none reverse',
                    },
                }
            );

            // Stats strip
            gsap.fromTo(
                '.stat-item',
                { opacity: 0, scale: 0.8 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: 'back.out(1.4)',
                    scrollTrigger: {
                        trigger: statsRef.current,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse',
                    },
                }
            );

            // Section headings
            gsap.utils.toArray('.section-heading').forEach((el) => {
                gsap.fromTo(
                    el,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.6,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 80%',
                            toggleActions: 'play none none reverse',
                        },
                    }
                );
            });
        });

        return () => ctx.revert();
    }, []);

    return (
        <PageWrapper>
            {/* ── HERO ───────────────────────────────────────── */}
            <section
                ref={heroRef}
                className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16"
            >
                {/* Background glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-orange opacity-[0.07] blur-[120px] rounded-full" />
                    <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-orange-600 opacity-[0.04] blur-[80px] rounded-full" />
                    {/* Grid overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(249,115,22,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.4) 1px, transparent 1px)',
                            backgroundSize: '60px 60px',
                        }}
                    />
                </div>

                <div className="section-container relative text-center">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="inline-flex mb-6"
                    >
                        <span className="badge">
                            <Sparkles className="w-3 h-3" />
                            AI-Powered MCQ Generation
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6"
                    >
                        Generate MCQs from
                        <br />
                        <span className="text-gradient">Any Document</span>
                        <br />
                        <span className="text-brand-muted font-semibold">in Seconds</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.35 }}
                        className="text-brand-muted text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
                    >
                        Upload a PDF, PPTX, or TXT file — QuizForge AI reads it, understands it,
                        and returns perfectly structured multiple-choice questions with explanations.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link to="/generate" id="hero-cta-primary" className="btn-primary text-base px-8 py-3.5">
                            <Zap className="w-4 h-4" />
                            Generate MCQs Free
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link to="/about" id="hero-cta-secondary" className="btn-ghost text-base px-8 py-3.5">
                            <BookOpen className="w-4 h-4" />
                            See How It Works
                        </Link>
                    </motion.div>

                    {/* Trust text */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                        className="mt-8 text-brand-mutedDark text-xs flex items-center justify-center gap-2"
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-orange" />
                        No signup required &nbsp;·&nbsp; Files deleted after generation &nbsp;·&nbsp; Free to use
                    </motion.p>

                    {/* Demo visual */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.6 }}
                        className="mt-16 relative max-w-3xl mx-auto"
                    >
                        <div className="card p-6 text-left">
                            {/* Fake terminal header */}
                            <div className="flex items-center gap-2 mb-5">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                </div>
                                <span className="text-brand-mutedDark text-xs font-mono ml-2">quizforge.ai — output.json</span>
                            </div>
                            {/* Fake JSON preview */}
                            <pre className="text-xs font-mono overflow-x-auto leading-relaxed">
                                <code><span className="text-brand-muted">{'{'}</span>
                                    <span className="text-blue-400">"question"</span><span className="text-brand-muted">: </span><span className="text-green-400">"What is the primary function of a transformer?"</span><span className="text-brand-muted">,</span>
                                    <span className="text-blue-400">"options"</span><span className="text-brand-muted">: [</span>
                                    <span className="text-green-400">"Image classification"</span><span className="text-brand-muted">,</span>
                                    <span className="text-brand-orange font-semibold">"Sequential data processing"</span><span className="text-brand-muted">,</span>   <span className="text-brand-orange text-[10px]">← correct</span>
                                    <span className="text-green-400">"Data compression"</span><span className="text-brand-muted">,</span>
                                    <span className="text-green-400">"Feature engineering"</span>
                                    <span className="text-brand-muted">],</span>
                                    <span className="text-blue-400">"correct_index"</span><span className="text-brand-muted">: </span><span className="text-purple-400">1</span>
                                    <span className="text-brand-muted">{'}'}</span></code>
                            </pre>
                        </div>
                        {/* Glow underneath */}
                        <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-brand-orange/30 to-transparent" />
                    </motion.div>
                </div>
            </section>

            {/* ── STATS STRIP ────────────────────────────────── */}
            <section ref={statsRef} className="py-10 border-y border-white/[0.06] bg-brand-surface/30">
                <div className="section-container">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {statsData.map((s) => (
                            <div key={s.label} className="stat-item text-center">
                                <p className="text-3xl font-extrabold text-gradient mb-1">{s.value}</p>
                                <p className="text-brand-muted text-sm">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ───────────────────────────────── */}
            <section ref={stepsRef} className="py-24">
                <div className="section-container">
                    <div className="text-center mb-16 section-heading">
                        <span className="badge mb-4">
                            <Layers className="w-3 h-3" />
                            Process
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Three steps to your quiz
                        </h2>
                        <p className="text-brand-muted text-lg max-w-xl mx-auto">
                            No complex setup. Upload, configure, download. That&apos;s it.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 relative">
                        {/* Connector lines (desktop) */}
                        <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-brand-orange/20 to-transparent" />

                        {steps.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <div key={i} className="step-card card p-6 relative">
                                    <div className="absolute top-4 right-4 text-3xl font-black text-white/5 font-mono select-none">
                                        {step.step}
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-5">
                                        <Icon className="w-6 h-6 text-brand-orange" />
                                    </div>
                                    {i < steps.length - 1 && (
                                        <ChevronRight className="hidden md:block absolute -right-3 top-12 w-6 h-6 text-brand-orange/30 z-10" />
                                    )}
                                    <h3 className="text-brand-text font-semibold text-lg mb-2">{step.title}</h3>
                                    <p className="text-brand-muted text-sm leading-relaxed">{step.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ───────────────────────────────────── */}
            <section ref={featuresRef} className="py-24 bg-brand-surface/20">
                <div className="section-container">
                    <div className="text-center mb-16 section-heading">
                        <span className="badge mb-4">
                            <Brain className="w-3 h-3" />
                            Capabilities
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Built for serious learners
                        </h2>
                        <p className="text-brand-muted text-lg max-w-xl mx-auto">
                            Everything you need to create, practice, and export professional quizzes.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                        {features.map((f, i) => {
                            const Icon = f.icon;
                            return (
                                <div
                                    key={i}
                                    className={`feature-card card p-6 relative overflow-hidden group hover:border-white/15 transition-all duration-300`}
                                >
                                    {/* Background gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                                    <div className="relative">
                                        <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:border-brand-orange/30 group-hover:bg-brand-orange/10 transition-all duration-300">
                                            <Icon className="w-5 h-5 text-brand-muted group-hover:text-brand-orange transition-colors duration-300" />
                                        </div>
                                        <h3 className="text-brand-text font-semibold mb-2">{f.title}</h3>
                                        <p className="text-brand-muted text-sm leading-relaxed">{f.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ─────────────────────────────────── */}
            <section className="py-24 section-heading">
                <div className="section-container">
                    <div className="relative card p-10 sm:p-14 text-center overflow-hidden">
                        {/* Glow */}
                        <div className="absolute inset-0 bg-orange-radial opacity-60 pointer-events-none" />
                        <div className="relative">
                            <span className="badge mb-5">
                                <Zap className="w-3 h-3" fill="currentColor" />
                                Start Free
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
                                Ready to forge your first quiz?
                            </h2>
                            <p className="text-brand-muted text-lg max-w-lg mx-auto mb-8">
                                No account needed. Upload your document and get AI-generated MCQs instantly.
                            </p>
                            <Link to="/generate" id="cta-section-btn" className="btn-primary text-base px-10 py-4">
                                <Zap className="w-5 h-5" fill="currentColor" />
                                Generate MCQs Now
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </PageWrapper>
    );
}
