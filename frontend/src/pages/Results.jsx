import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ChevronLeft } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
import { useQuiz } from '../context/QuizContext';

/**
 * /results is kept as a route for backward-compat nav links.
 * The real results UI now lives in Quiz.jsx (review phase).
 * If the user lands here with quiz data → redirect to /quiz.
 * Otherwise show a friendly "nothing here" state.
 */
export default function Results() {
    const navigate = useNavigate();
    const { apiQuestions, quizResult, apiMode } = useQuiz();

    useEffect(() => {
        if (apiQuestions && apiQuestions.length > 0) {
            navigate('/quiz', { replace: true });
        }
    }, [apiQuestions, navigate]);

    return (
        <PageWrapper>
            <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-sm"
                >
                    <div className="w-16 h-16 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mx-auto mb-5">
                        <Sparkles className="w-7 h-7 text-brand-orange" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">No Results Yet</h1>
                    <p className="text-brand-muted text-sm mb-6">
                        Generate a quiz from your document first, then your results will appear here.
                    </p>
                    <button
                        onClick={() => navigate('/generate')}
                        className="btn-primary px-6 py-3 mx-auto"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Go to Generate
                    </button>
                </motion.div>
            </div>
        </PageWrapper>
    );
}
