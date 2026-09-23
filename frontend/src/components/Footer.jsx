import { Link } from 'react-router-dom';
import { Zap, GitBranch, Share2, Mail, ArrowUpRight } from 'lucide-react';

const footerLinks = {
    Product: [
        { label: 'Generate MCQs', href: '/generate' },
        { label: 'History', href: '/history' },
        { label: 'Interactive Quiz', href: '/quiz' },
    ],
    Resources: [
        { label: 'How it Works', href: '/about' },
        { label: 'API Docs', href: '#' },
        { label: 'Changelog', href: '#' },
    ],
    Legal: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Cookie Policy', href: '#' },
    ],
};

export default function Footer() {
    return (
        <footer className="border-t border-white/[0.06] bg-brand-surface/50 mt-auto">
            <div className="section-container py-12">
                {/* Top */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-2">
                        <Link to="/" className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-brand-orange" fill="currentColor" />
                            </div>
                            <span className="font-bold text-lg tracking-tight">
                                Quiz<span className="text-gradient">Forge</span> AI
                            </span>
                        </Link>
                        <p className="text-brand-muted text-sm leading-relaxed max-w-xs">
                            AI-powered MCQ generation from any document. Upload, configure, and export
                            professional quiz sets in seconds.
                        </p>
                        <div className="flex items-center gap-3 mt-5">
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-brand-muted hover:text-brand-text transition-all duration-200"
                                aria-label="Github"
                            >
                                <GitBranch className="w-4 h-4" />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-brand-muted hover:text-brand-text transition-all duration-200"
                                aria-label="Twitter"
                            >
                                <Share2 className="w-4 h-4" />
                            </a>
                            <a
                                href="mailto:hi@quizforge.ai"
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-brand-muted hover:text-brand-text transition-all duration-200"
                                aria-label="Email"
                            >
                                <Mail className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h3 className="text-xs font-semibold text-brand-mutedDark uppercase tracking-wider mb-4">
                                {category}
                            </h3>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.href}
                                            className="text-sm text-brand-muted hover:text-brand-orange transition-colors duration-200 flex items-center gap-1 group"
                                        >
                                            {link.label}
                                            {link.href === '#' && (
                                                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-brand-mutedDark text-xs">
                        © 2026 QuizForge AI. All rights reserved.
                    </p>
                    <p className="text-brand-mutedDark text-xs">
                        Built with{' '}
                        <span className="text-brand-orange">♥</span>{' '}
                        using React + Vite + Tailwind
                    </p>
                </div>
            </div>
        </footer>
    );
}
