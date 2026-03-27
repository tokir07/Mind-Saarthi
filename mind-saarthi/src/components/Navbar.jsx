
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Menu, X, Info, Cpu, Briefcase, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import LogoImg from '../assets/mind-saarthi-logo.png';

const Navbar = ({ darkMode, toggleTheme }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
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
            {/* Logo Section - Absolute position so it scrolls away */}
            <div className="absolute top-4 left-6 z-20 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="pointer-events-auto"
                >
                    <Link to="/">
                        <img
                            src={LogoImg}
                            alt="Mind Saarthi Logo"
                            className="h-44 md:h-60 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
                        />
                    </Link>
                </motion.div>
            </div>

            {/* Floating Pill Navbar */}
            <div className="fixed top-6 left-0 w-full flex justify-center z-50 px-4 pointer-events-none">
                <motion.nav
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`pointer-events-auto flex items-center gap-2 pl-6 pr-2 py-2 rounded-full border shadow-2xl transition-all duration-500 backdrop-blur-xl ${isScrolled
                        ? 'bg-white/70 dark:bg-slate-900/80 border-black/5 dark:border-white/20'
                        : 'bg-white/30 dark:bg-black/40 border-black/5 dark:border-white/10'
                        }`}
                >
                    {/* Desktop Nav Links */}
                    <ul className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <li key={link.name}>
                                <a
                                    href={link.href}
                                    className="flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-white transition-all rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 duration-200 whitespace-nowrap"
                                >
                                    {link.icon}
                                    {link.name}
                                </a>
                            </li>
                        ))}
                    </ul>

                    {/* Divider and Actions */}
                    <div className="hidden lg:block w-px h-6 bg-black/10 dark:bg-white/10 mx-2" />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 transition-all text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white active:rotate-12 duration-300"
                            aria-label="Toggle Theme"
                        >
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <Link
                            to="/login"
                            className="hidden lg:flex bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-full text-[13px] font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 duration-200 whitespace-nowrap"
                        >
                            Start Screening
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden text-slate-700 dark:text-white p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </motion.nav>
            </div>

            {/* Mobile Nav Overlay (Floating Style) */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[55] lg:hidden"
                    >
                        <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-black/5 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/20">
                            <div className="flex flex-col gap-3">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-4 px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-black/5 dark:hover:border-white/5"
                                    >
                                        <span className="text-primary dark:text-primary-light">{link.icon}</span>
                                        {link.name}
                                    </a>
                                ))}
                                <Link
                                    to="/login"
                                    className="mt-4 w-full bg-primary hover:bg-primary-light text-white font-bold py-4 rounded-2xl text-center shadow-lg shadow-primary/20 transition-all active:scale-95"
                                >
                                    Start Screening
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
