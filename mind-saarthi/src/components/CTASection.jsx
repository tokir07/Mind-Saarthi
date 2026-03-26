import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

const CTASection = () => {
    return (
        <section className="py-24 relative overflow-hidden bg-background-light dark:bg-background-dark">
            {/* Background glowing effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-primary/30 to-accent/30 rounded-[100%] blur-[100px] -z-10 animate-pulse-slow"></div>

            <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="glass-card rounded-3xl p-10 md:p-16 border border-white/40 dark:border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl"
                >
                    {/* Inner subtle glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent dark:from-white/5 pointer-events-none"></div>

                    <Sparkles className="mx-auto w-12 h-12 text-primary dark:text-primary-light mb-6 opacity-80" />

                    <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
                        Start Your Mental <br className="hidden md:block" /> Health Journey Today
                    </h2>

                    <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Join thousands of users who have found a safe space to understand their emotions and build resilience.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button className="group relative w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-full font-bold text-lg shadow-[0_0_40px_-5px_rgba(23,93,197,0.6)] hover:shadow-[0_0_60px_-5px_rgba(23,93,197,0.8)] transition-all duration-300 hover:-translate-y-1 overflow-hidden flex items-center justify-center gap-2">
                            <span className="relative z-10 flex items-center gap-2">
                                Start Screening Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                            {/* Pulse animation ring */}
                            <div className="absolute inset-0 border-[3px] border-white/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-light to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 sm:mt-0 sm:ml-4 font-medium">
                            100% Free & Confidential
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CTASection;
