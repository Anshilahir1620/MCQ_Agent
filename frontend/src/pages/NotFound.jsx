import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Zap, AlertTriangle } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';

export default function NotFound() {
    return (
        <PageWrapper>
            <div className="min-h-screen flex items-center justify-center pt-16">
                <div className="section-container max-w-lg text-center">
                    {/* Glow orb */}
                    <div className="relative inline-block mb-8">
                        <div className="absolute inset-0 bg-brand-orange opacity-10 blur-3xl rounded-full scale-150" />
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className="relative w-24 h-24 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mx-auto"
                        >
                            <AlertTriangle className="w-12 h-12 text-brand-orange" />
                        </motion.div>
                    </div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-8xl font-black text-gradient mb-2"
                    >
                        404
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-bold mb-3"
                    >
                        Page Not Found
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-brand-muted text-base mb-10 max-w-sm mx-auto"
                    >
                        This page doesn&#39;t exist. Maybe it was deleted, or you typed the wrong URL.
                        Let&#39;s get you back on track.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-3 justify-center"
                    >
                        <Link to="/" id="404-home-btn" className="btn-primary">
                            <Home className="w-4 h-4" />
                            Back to Home
                        </Link>
                        <Link to="/generate" className="btn-ghost">
                            <Zap className="w-4 h-4" />
                            Generate MCQs
                        </Link>
                    </motion.div>
                </div>
            </div>
        </PageWrapper>
    );
}
