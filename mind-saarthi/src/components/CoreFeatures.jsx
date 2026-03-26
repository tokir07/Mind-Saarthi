import React from 'react';
import { motion } from 'framer-motion';
import { Bot, HeartPulse, ShieldAlert, Lock, Zap, BarChart } from 'lucide-react';

const CoreFeatures = () => {
    const features = [
        {
            id: 1,
            name: 'AI Chatbot',
            description: 'Engage in natural, empathetic conversations backed by cutting-edge NLP technology.',
            icon: <Bot className="w-8 h-8 group-hover:text-white transition-colors" />
        },
        {
            id: 2,
            name: 'Emotion Detection',
            description: 'Real-time analysis of text patterns and tone to detect underlying emotional states.',
            icon: <HeartPulse className="w-8 h-8 group-hover:text-white transition-colors" />
        },
        {
            id: 3,
            name: 'Risk Scoring',
            description: 'Proprietary algorithms that assign stress and depression risk scores accurately.',
            icon: <ShieldAlert className="w-8 h-8 group-hover:text-white transition-colors" />
        },
        {
            id: 4,
            name: 'Privacy First',
            description: 'End-to-end encryption ensuring your mental health data is visible only to you.',
            icon: <Lock className="w-8 h-8 group-hover:text-white transition-colors" />
        },
        {
            id: 5,
            name: 'Instant Insights',
            description: 'Get immediate feedback and coping strategies tailored to your current emotional state.',
            icon: <Zap className="w-8 h-8 group-hover:text-white transition-colors" />
        },
        {
            id: 6,
            name: 'Clinical Dashboard',
            description: 'Export actionable reports and trends to share with your healthcare provider.',
            icon: <BarChart className="w-8 h-8 group-hover:text-white transition-colors" />
        }
    ];

    return (
        <section id="features" className="py-24 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Core Features
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                        Empowered by advanced machine learning to provide accurate, empathetic, and secure mental health support.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ scale: 1.03 }}
                            className="group relative h-full glass-card rounded-2xl p-6 overflow-hidden cursor-pointer"
                        >
                            {/* Hover background effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-14 h-14 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-300">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-white transition-colors">
                                    {feature.name}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 group-hover:text-white/80 transition-colors flex-grow">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CoreFeatures;
