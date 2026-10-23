import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X, GitBranch, History, Info, Home, Wand2 } from 'lucide-react';

const navLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Generate', href: '/generate', icon: Wand2 },
    { label: 'History', href: '/history', icon: History },
    { label: 'About', href: '/about', icon: Info },
];

export default function Navbar() {
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    return (
        <>
            <motion.header
                initial={{ y: -80 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-brand-bg/90 backdrop-blur-xl border-b border-white/[0.06]'
                    : 'bg-transparent'
                    }`}
            >
                <nav className="section-container h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-2.5 group"
                        id="nav-logo"
                    >
                        <div className="relative">
                            <div className="w-8 h-8 rounded-xl bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center group-hover:shadow-orange-glow transition-all duration-300">
                                <Zap className="w-4 h-4 text-brand-orange" fill="currentColor" />
                            </div>
                        </div>
                        <span className="font-bold text-lg tracking-tight">
                            Quiz<span className="text-gradient">Forge</span>
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const active = location.pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    to={link.href}
                                    id={`nav-${link.label.toLowerCase()}`}
                                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active
                                        ? 'text-brand-orange'
                                        : 'text-brand-muted hover:text-brand-text'
                                        }`}
                                >
                                    {active && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className="absolute inset-0 bg-brand-orange/10 rounded-lg border border-brand-orange/20"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                                        />
                                    )}
                                    <span className="relative">{link.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* CTA + mobile toggle */}
                    <div className="flex items-center gap-3">
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noreferrer"
                            id="nav-github"
                            className="hidden md:flex items-center gap-2 text-brand-muted hover:text-brand-text transition-colors duration-200"
                            aria-label="GitHub"
                        >
                            <GitBranch className="w-5 h-5" />
                        </a>
                        <Link
                            to="/generate"
                            id="nav-cta"
                            className="btn-primary hidden md:inline-flex text-xs px-4 py-2"
                        >
                            <Wand2 className="w-3.5 h-3.5" />
                            Generate
                        </Link>
                        <button
                            id="nav-mobile-toggle"
                            className="md:hidden p-2 rounded-lg text-brand-muted hover:text-brand-text transition-colors duration-200"
                            onClick={() => setMobileOpen((v) => !v)}
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </nav>
            </motion.header>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        id="mobile-menu"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-16 left-0 right-0 z-40 bg-brand-surface/95 backdrop-blur-xl border-b border-white/[0.06] md:hidden"
                    >
                        <div className="section-container py-4 flex flex-col gap-1">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                const active = location.pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        to={link.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                            ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                                            : 'text-brand-muted hover:text-brand-text hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {link.label}
                                    </Link>
                                );
                            })}
                            <div className="pt-2 mt-2 border-t border-white/[0.06] flex gap-3">
                                <Link to="/generate" className="btn-primary flex-1 text-xs py-2.5">
                                    <Wand2 className="w-3.5 h-3.5" />
                                    Generate Now
                                </Link>
                                <a
                                    href="https://github.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-ghost px-4 py-2.5"
                                >
                                    <GitBranch className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
