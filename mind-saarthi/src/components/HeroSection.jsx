import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Sparkles } from 'lucide-react';
import WebTabPreview from './WebTabPreview';

const HeroSection = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-background-light dark:bg-background-dark">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-pulse-slow"></div>
                <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] rounded-full bg-accent/10 dark:bg-accent/5 blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

                {/* Neural Network Lines pattern (subtle) */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDhoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTIwIDIwTDAgMEwyMCAyMEw0MCAwTDIwIDIwdjIweiIgc3Ryb2tlPSJyZ2JhKDIzLCA5MyLCAxOTcsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] opacity-50 dark:opacity-20 mask-image:linear-gradient(to_bottom,white,transparent)"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10 max-w-6xl pt-10">
                <div className="flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light font-medium text-sm mb-6 border border-primary/20"
                    >
                        <Sparkles size={16} />
                        <span>Next-Generation AI Healthcare</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight"
                    >
                        Mind Saarthi: Your <br />
                        <span className="text-secondary dark:text-primary-light">Compass</span> for Mental Wellness
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed"
                    >
                        Empowering emotional resilience through context-aware AI. Private, empathetic, and always here for your journey to better health.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 mb-20"
                    >
                        <button className="px-8 py-4 bg-primary hover:bg-primary-light text-white rounded-full font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 flex items-center justify-center gap-2 group">
                            Get Started Free <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-full font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                            <Bot size={20} className="text-primary" /> Meet the AI
                        </button>
                    </motion.div>

                    {/* Crazy Mini Web Tab Preview */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.7 }}
                        className="w-full relative"
                    >
                        <WebTabPreview />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
