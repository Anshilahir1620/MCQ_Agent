import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    FileText, Scissors, Database, Cpu, FileOutput, ArrowRight,
    Info, Zap, Brain,
} from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

gsap.registerPlugin(ScrollTrigger);

const pipeline = [
    {
        step: '01',
        icon: FileText,
        title: 'Document Loading',
        description:
            'Your PDF, PPTX, or TXT file is parsed by specialized loaders that extract clean, structured text while preserving semantic context and paragraph boundaries.',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
        step: '02',
        icon: Scissors,
        title: 'Intelligent Chunking',
        description:
            'The document is split into overlapping semantic chunks using recursive character splitting, ensuring no context is lost between boundaries.',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10 border-purple-500/20',
    },
    {
        step: '03',
        icon: Database,
        title: 'Embedding & Indexing',
        description:
            'Each chunk is converted into high-dimensional vector embeddings and stored in a temporary in-memory vector store for fast semantic retrieval.',
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
        step: '04',
        icon: Brain,
        title: 'Contextual Retrieval',
        description:
            'The most semantically relevant chunks are retrieved based on your topic or coverage preference, forming the context window for generation.',
        color: 'text-pink-400',
        bg: 'bg-pink-500/10 border-pink-500/20',
    },
    {
        step: '05',
        icon: Cpu,
        title: 'LLM Generation',
        description:
            'A structured prompt instructs the LLM to generate well-formed MCQs: 4 options, 1 correct answer, and a clear explanation — all grounded in your document.',
        color: 'text-brand-orange',
        bg: 'bg-brand-orange/10 border-brand-orange/20',
    },
    {
        step: '06',
        icon: FileOutput,
        title: 'Structured Output',
        description:
            'The response is parsed and validated into a clean JSON schema. Your file is deleted from memory. Results are ready for export, practice, or integration.',
        color: 'text-green-400',
        bg: 'bg-green-500/10 border-green-500/20',
    },
];

export default function About() {
    const timelineRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                '.pipeline-step',
                { opacity: 0, x: -40 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.6,
                    stagger: 0.12,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: timelineRef.current,
                        start: 'top 70%',
                        toggleActions: 'play none none reverse',
                    },
                }
            );
        });
        return () => ctx.revert();
    }, []);

    return (
        <PageWrapper>
            <div className="pt-24 pb-20 min-h-screen">
                <div className="section-container max-w-3xl">
                    {/* Header */}
                    <div className="mb-12">
                        <span className="badge mb-4">
                            <Info className="w-3 h-3" />
                            How It Works
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
                            The pipeline behind
                            <br />
                            <span className="text-gradient">QuizForge AI</span>
                        </h1>
                        <p className="text-brand-muted text-lg leading-relaxed max-w-xl">
                            Under the hood, QuizForge combines document intelligence, vector search, and
                            LLM generation in a precise pipeline — not a simple "summarize and ask" approach.
                        </p>
                    </div>

                    {/* Pipeline timeline */}
                    <div ref={timelineRef} className="relative">
                        {/* Connector line */}
                        <div className="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-blue-500/30 via-brand-orange/30 to-green-500/30 hidden sm:block" />

                        <div className="space-y-6">
                            {pipeline.map((step, i) => {
                                const Icon = step.icon;
                                return (
                                    <div key={i} className="pipeline-step flex gap-6 relative">
                                        {/* Step icon */}
                                        <div className="flex-shrink-0 relative z-10">
                                            <div
                                                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${step.bg}`}
                                            >
                                                <Icon className={`w-5 h-5 ${step.color}`} />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 card p-5 sm:p-6 group hover:border-white/15 transition-all duration-300">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h3 className="font-semibold text-brand-text text-lg">{step.title}</h3>
                                                <span className={`text-xs font-mono font-bold ${step.color} opacity-60`}>
                                                    {step.step}
                                                </span>
                                            </div>
                                            <p className="text-brand-muted text-sm leading-relaxed">{step.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Why it matters */}
                    <div className="mt-16 card p-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-orange-radial opacity-50 pointer-events-none" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-brand-orange" fill="currentColor" />
                                </div>
                                <h2 className="text-xl font-bold">Why RAG-powered generation?</h2>
                            </div>
                            <p className="text-brand-muted leading-relaxed mb-4">
                                Generic MCQ generators hallucinate details or produce questions unrelated to your
                                specific material. QuizForge uses your document as the single source of truth — every
                                question is grounded in what you uploaded.
                            </p>
                            <p className="text-brand-muted leading-relaxed">
                                The vector retrieval step ensures topic-specific queries zoom into the right sections,
                                while full-coverage mode ensures balanced representation across all chapters.
                            </p>

                            <div className="mt-6">
                                <Link to="/generate" className="btn-primary">
                                    <Zap className="w-4 h-4" fill="currentColor" />
                                    Try It Now
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}
