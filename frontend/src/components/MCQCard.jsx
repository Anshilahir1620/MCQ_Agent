import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle } from 'lucide-react';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function MCQCard({ question, index, showAnswers = true }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            className="card overflow-hidden"
        >
            {/* Header */}
            <div
                className="flex items-start gap-4 p-5 cursor-pointer group"
                onClick={() => setExpanded((v) => !v)}
            >
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-xs font-bold text-brand-orange">
                    {index + 1}
                </span>
                <p className="flex-1 text-sm text-brand-text font-medium leading-relaxed">
                    {question.question}
                </p>
                <motion.div
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 text-brand-muted group-hover:text-brand-orange transition-colors duration-200"
                >
                    <ChevronDown className="w-4 h-4" />
                </motion.div>
            </div>

            {/* Options + explanation */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-2">
                            {question.options.map((option, i) => {
                                const isCorrect = showAnswers && i === question.correct;
                                return (
                                    <div
                                        key={i}
                                        className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isCorrect
                                                ? 'bg-brand-orange/10 border border-brand-orange/30'
                                                : 'bg-white/[0.03] border border-white/[0.06]'
                                            }`}
                                    >
                                        <span
                                            className={`flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${isCorrect
                                                    ? 'bg-brand-orange text-white'
                                                    : 'bg-white/10 text-brand-muted'
                                                }`}
                                        >
                                            {OPTION_LABELS[i]}
                                        </span>
                                        <span
                                            className={`text-sm leading-relaxed ${isCorrect ? 'text-brand-text' : 'text-brand-muted'
                                                }`}
                                        >
                                            {option}
                                        </span>
                                        {isCorrect && (
                                            <CheckCircle className="w-4 h-4 text-brand-orange flex-shrink-0 mt-0.5 ml-auto" />
                                        )}
                                    </div>
                                );
                            })}

                            {/* Explanation */}
                            {question.explanation && (
                                <div className="mt-4 p-4 rounded-xl bg-brand-surface border border-white/[0.06]">
                                    <p className="text-xs text-brand-mutedDark font-semibold uppercase tracking-wider mb-1.5">
                                        Explanation
                                    </p>
                                    <p className="text-sm text-brand-muted leading-relaxed">
                                        {question.explanation}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
