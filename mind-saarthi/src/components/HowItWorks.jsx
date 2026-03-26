import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ScanSearch, ShieldCheck, ArrowRight } from 'lucide-react';

const HowItWorks = () => {
    const steps = [
        {
            id: 1,
            title: 'User Interaction',
            description: 'Engage with our friendly AI chatbot through voice or text in a safe, judgment-free environment.',
            icon: <MessageSquare className="w-6 h-6 text-primary dark:text-primary-light" />
        },
        {
            id: 2,
            title: 'AI Analysis',
            description: 'Our proprietary NLP engine analyzes tone, sentiment, and emotional patterns in real-time.',
            icon: <ScanSearch className="w-6 h-6 text-accent dark:text-accent-light" />
        },
        {
            id: 3,
            title: 'Risk Assessment',
            description: 'Receive an accurate risk score and actionable insights to guide your mental wellness journey.',
            icon: <ShieldCheck className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.3 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    return (
        <section id="how-it-works" className="py-24 bg-surface-light/50 dark:bg-surface-dark/30">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        How MindSaarthi Works
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                        A seamless three-step flow designed to understand your emotional state and provide personalized care.
                    </p>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="relative grid md:grid-cols-3 gap-8 p-4"
                >
                    {/* Connecting arrow lines hidden on mobile */}
                    <div className="hidden md:block absolute top-[25%] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-primary/30 via-accent/30 to-emerald-500/30 -z-10"></div>

                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            variants={itemVariants}
                            className="relative group h-full"
                        >
                            <div className="h-full glass-card p-8 rounded-2xl flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_-15px_rgba(23,93,197,0.3)] dark:hover:shadow-[0_10px_40px_-15px_rgba(23,93,197,0.2)] dark:hover:border-primary/30 relative bg-white/50 dark:bg-slate-900/50">
                                <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10">
                                    {step.icon}
                                    {/* Glowing background on hover */}
                                    <div className="absolute inset-0 rounded-full bg-current opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300"></div>
                                </div>

                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                    <span className="text-transparent text-stroke opacity-30 group-hover:opacity-100 transition-opacity absolute top-4 left-4 text-4xl font-black">0{step.id}</span>
                                    {step.title}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    {step.description}
                                </p>
                            </div>

                            {/* Connecting ARROW between cards internally for mobile/tablet maybe? But doing via absolute line above is cleaner */}
                            {index < steps.length - 1 && (
                                <div className="md:hidden flex justify-center py-4">
                                    <ArrowRight className="text-slate-300 dark:text-slate-700 rotate-90" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default HowItWorks;
