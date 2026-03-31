import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Info, Cpu, Briefcase, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import LogoImg from '../assets/mind-saarthi-logo.png';
import ThemeToggle from './common/ThemeToggle';

const Navbar = () => {
    const { darkMode } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'How it Works', icon: <Info size={16} />, href: '#how-it-works' },
        { name: 'Features', icon: <Cpu size={16} />, href: '#features' },
        { name: 'Dashboard', icon: <Briefcase size={16} />, href: '#dashboard' },
        { name: 'Impact', icon: <Award size={16} />, href: '#impact' },
    ];

    return (
        <>
            {/* Main Navigation Wrapper */}
            <div className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center transition-all duration-500">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-shrink-0"
                >
                    {/* <Link to="/" className="flex items-center gap-2 group">
                        <img
                            src={LogoImg}
                            alt="Mind Saarthi"
                            className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
                        />
                    </Link> */}
                </motion.div>

                {/* Desktop Nav Pill */}
                <motion.nav
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`hidden lg:flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all duration-500 backdrop-blur-xl ${
                        isScrolled
                        ? 'glass shadow-2xl border-white/20'
                        : 'bg-white/10 dark:bg-black/10 border-transparent'
                    }`}
                >
                    <ul className="flex items-center gap-1">
                        {navLinks.map((link) => (
                            <li key={link.name}>
                                <a
                                    href={link.href}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-white transition-all rounded-xl hover:bg-primary/5 active:scale-95 duration-200"
                                >
                                    {link.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </motion.nav>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                    <div className={`${isScrolled ? 'glass' : 'bg-white/10 dark:bg-black/10'} p-1 rounded-2xl border border-transparent transition-all duration-500 flex items-center gap-2`}>
                        <ThemeToggle />
                        <Link
                            to="/login"
                            className="hidden lg:flex btn-primary !rounded-xl !py-2 !px-5 text-sm"
                        >
                            Get Started
                        </Link>
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[45] lg:hidden bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-2xl flex items-center justify-center p-6"
                    >
                        <div className="w-full max-w-sm space-y-8">
                            <div className="flex flex-col gap-4">
                                {navLinks.map((link, idx) => (
                                    <motion.a
                                        key={link.name}
                                        href={link.href}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-4 p-5 text-xl font-bold text-slate-800 dark:text-slate-200 hover:text-primary bg-slate-100 dark:bg-slate-800/50 rounded-2xl transition-all"
                                    >
                                        <span className="text-primary">{link.icon}</span>
                                        {link.name}
                                    </motion.a>
                                ))}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="btn-primary w-full !py-5 !text-lg !rounded-2xl"
                                    >
                                        Start Free Session
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
