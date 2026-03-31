import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Sparkles, ShieldCheck, HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';
import WebTabPreview from './WebTabPreview';
import { useTheme } from '../ThemeContext';
import LogoImg from '../assets/mind-saarthi-logo.png';

const HeroSection = () => {
    const { darkMode } = useTheme();

    return (
        <section className="relative min-h-screen flex items-center justify-center pt-32 pb-24 overflow-hidden transition-colors duration-500">
            {/* Logo Top Left */}
            <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
                <img src={LogoImg} alt="Mind Saarthi" className="h-10 w-auto" />
                {/* <span className="text-lg font-bold tracking-wide">Mind Saarthi</span> */}
            </div>
            {/* Dynamic Background Blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="bg-blob w-[600px] h-[600px] bg-primary -top-40 -left-20 opacity-10 dark:opacity-20 blur-[100px]" />
                <div className="bg-blob w-[500px] h-[500px] bg-accent -bottom-20 -right-20 opacity-10 dark:opacity-20 blur-[100px] delay-2000" />
                <div className="absolute top-[20%] left-[60%] w-[300px] h-[300px] bg-emerald-400 rounded-full opacity-10 blur-[80px] animate-pulse-slow" />
            </div>


            <div className="container mx-auto px-6 relative z-10 max-w-7xl">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Left Column: Content */}
                    <div className="flex-1 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl glass mb-8 border-primary/20"
                        >
                            <Sparkles size={16} className="text-primary animate-float" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Healthcare 2.0 • AI-Powered</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]"
                        >
                            Your Emotional <br />
                            <span className="text-primary animate-shimmer bg-gradient-to-r from-primary via-primary-light to-primary bg-[length:200%_auto] bg-clip-text text-transparent">Guardian</span> Always.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="text-lg md:text-xl opacity-70 mb-10 max-w-2xl lg:mx-0 leading-relaxed font-medium"
                        >
                            Experience MindSaarthi AI—a calming, private space where deep empathy meets next-gen intelligence to support your mental wellness journey.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                        >
                            <Link to="/login" className="btn-primary !py-4 !px-8 flex items-center justify-center gap-3 group shadow-2xl shadow-primary/20">
                                Start Your Journey <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#how-it-works" className="btn-outline !py-4 !px-8 flex items-center justify-center gap-3">
                                <Bot size={20} className="text-primary" /> How it Works
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="mt-12 flex flex-wrap justify-center lg:justify-start items-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500"
                        >
                            <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                                <ShieldCheck size={14} className="text-emerald-500" /> Secure HIPAA
                            </div>
                            <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]">
                                <HeartPulse size={14} className="text-accent" /> Empathetic AI
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Preview */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: 50 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.3, type: "spring", stiffness: 50 }}
                        className="flex-1 w-full lg:max-w-[50%]"
                    >
                        <div className="relative">
                            <div className="absolute -inset-4 bg-primary/20 blur-3xl opacity-30 -z-10 animate-pulse-slow rounded-full" />
                            <WebTabPreview />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
