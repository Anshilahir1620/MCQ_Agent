import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    History as HistoryIcon, Wand2, BookOpen,
} from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

function EmptyState() {
    const navigate = useNavigate();
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
        >
            <div className="w-20 h-20 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-brand-orange opacity-60" />
            </div>
            <h2 className="text-xl font-bold mb-2">No quizzes yet</h2>
            <p className="text-brand-muted text-sm mb-8 max-w-sm">
                Your generated quiz sets will appear here in a future update. For now, create a new quiz to get started.
            </p>
            <button onClick={() => navigate('/generate')} className="btn-primary">
                <Wand2 className="w-4 h-4" />
                Generate Your First Quiz
            </button>
        </motion.div>
    );
}

export default function History() {
    const navigate = useNavigate();

    return (
        <PageWrapper>
            <div className="pt-24 pb-20 min-h-screen">
                <div className="section-container">
                    {/* Header */}
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <span className="badge mb-3">
                                <HistoryIcon className="w-3 h-3" />
                                History
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-bold">My Quizzes</h1>
                            <p className="text-brand-muted mt-1">
                                Session history coming soon
                            </p>
                        </div>
                        <button onClick={() => navigate('/generate')} className="btn-primary hidden sm:inline-flex">
                            <Wand2 className="w-4 h-4" />
                            New Quiz
                        </button>
                    </div>

                    <EmptyState />
                </div>
            </div>
        </PageWrapper>
    );
}
