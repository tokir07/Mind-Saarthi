import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Sparkles } from 'lucide-react';

const HeroSection = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-background-light dark:bg-background-dark">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-pulse-slow"></div>
                <div className="absolute top-[30%] -right-[10%] w-[40%] h-[40%] rounded-full bg-accent/10 dark:bg-accent/5 blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

                {/* Neural Network Lines pattern (subtle) */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTIwIDIwTDAgMEwyMCAyMEw0MCAwTDIwIDIwdjIweiIgc3Ryb2tlPSJyZ2JhKDIzLCA5MyLCAxOTcsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz4KPC9zdmc+')] opacity-50 dark:opacity-20 mask-image:linear-gradient(to_bottom,white,transparent)"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10 max-w-6xl">
                <div className="flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light font-medium text-sm mb-8 border border-primary/20"
                    >
                        <Sparkles size={16} />
                        <span>Next-Generation AI Healthcare</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight max-w-4xl"
                    >
                        AI-Powered <br className="hidden md:block" />
                        <span className="text-gradient">Mental Health</span> Screening
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mb-10 leading-relaxed"
                    >
                        Early detection of stress, anxiety & depression using advanced conversational AI and emotion analysis. A safe space for your mind.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                    >
                        <button className="group relative px-8 py-4 bg-primary text-white rounded-full font-semibold text-lg shadow-[0_0_40px_-10px_rgba(23,93,197,0.5)] hover:shadow-[0_0_60px_-10px_rgba(23,93,197,0.7)] transition-all duration-300 hover:-translate-y-1 overflow-hidden flex items-center justify-center gap-2">
                            <span className="relative z-10 flex items-center gap-2">
                                Start Screening <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-light to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>
                        <button className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-full font-semibold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2">
                            <Bot size={20} className="text-primary dark:text-primary-light" />
                            Learn More
                        </button>
                    </motion.div>
                </div>

                {/* Dashboard/Chatbot Floating mock preview abstract */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-16 sm:mt-24 relative mx-auto w-full max-w-4xl"
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-30 dark:opacity-50 animate-pulse-slow"></div>
                    <div className="relative glass-card rounded-2xl p-2 sm:p-4 aspect-video overflow-hidden border border-white/20 dark:border-white/10 flex items-end justify-center">
                        {/* Fake UI Skeleton */}
                        <div className="w-full h-full bg-slate-50 dark:bg-[#0B1120] rounded-xl flex shadow-inner border border-slate-200/50 dark:border-slate-800 overflow-hidden">
                            <div className="w-1/4 sm:w-1/5 border-r border-slate-200 dark:border-slate-800 hidden sm:flex flex-col gap-3 p-4">
                                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-4"></div>
                                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-lg w-full"></div>)}
                            </div>
                            <div className="flex-1 p-6 flex flex-col justify-end gap-4 relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 dark:to-[#0B1120]/80 z-10"></div>
                                <div className="flex gap-3 items-end w-3/4 self-end flex-row-reverse z-0">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 shrink-0"></div>
                                    <div className="h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl rounded-tr-none w-full max-w-sm"></div>
                                </div>
                                <div className="flex gap-3 items-end w-3/4 z-0">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></div>
                                    <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none w-full max-w-md"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
