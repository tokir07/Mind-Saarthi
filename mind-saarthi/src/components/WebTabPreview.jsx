import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Brain, Heart, Sparkles, MessageSquare } from 'lucide-react';

const WebTabPreview = () => {
    const [messages, setMessages] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

    const scenario = [
        { type: 'user', text: "I've been feeling overwhelmed and anxious lately...", delay: 1000 },
        { type: 'ai', text: "I hear you. Let's explore those feelings in a safe space. Can you tell me when they feel strongest?", delay: 2000 },
        { type: 'user', text: "Mostly at night, thinking about work and everything I need to do.", delay: 1500 },
        { type: 'ai', text: "That's a common trigger. Our assessment shows a 'Moderate' stress level. I'll summarize this for your doctor while keeping our session confidential.", delay: 2500 }
    ];

    useEffect(() => {
        if (currentStep < scenario.length) {
            const timer = setTimeout(() => {
                setMessages(prev => [...prev, scenario[currentStep]]);
                setCurrentStep(prev => prev + 1);
            }, scenario[currentStep].delay);
            return () => clearTimeout(timer);
        } else {
            // Restart after a while
            const restartTimer = setTimeout(() => {
                setMessages([]);
                setCurrentStep(0);
            }, 5000);
            return () => clearTimeout(restartTimer);
        }
    }, [currentStep]);

    return (
        <div className="relative group max-w-4xl mx-auto">
            {/* Crazy Neon Glow Background */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            
            {/* The "Mini Web Tab" Container */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative bg-slate-950 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col h-[500px]"
            >
                {/* Browser Header */}
                <div className="h-10 border-b border-white/5 bg-slate-900/50 flex items-center px-6 justify-between shrink-0">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-md text-[10px] text-slate-400 font-mono">
                        <Shield size={10} className="text-emerald-500" />
                        mindsaarthi.ai/secure-session
                    </div>
                    <div className="w-12"></div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Mock Sidebar */}
                    <div className="w-16 md:w-48 border-r border-white/5 bg-slate-900/30 p-4 space-y-6 hidden md:block">
                        <div className="h-8 w-full bg-white/5 rounded-lg animate-pulse"></div>
                        <div className="space-y-3">
                            {[Brain, Heart, Sparkles, MessageSquare].map((Icon, i) => (
                                <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                                    <Icon size={16} className="text-primary-light" />
                                    <div className="h-2 w-16 bg-white/10 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-20">
                            <div className="h-24 w-full bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl border border-white/10 p-3">
                                <div className="h-2 w-1/2 bg-white/20 rounded-full mb-2"></div>
                                <div className="h-2 w-full bg-white/10 rounded-full mb-2"></div>
                                <div className="h-12 w-12 rounded-full bg-white/5 mx-auto mt-2 flex items-center justify-center">
                                    <Sparkles size={16} className="text-yellow-400 animate-spin-slow" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Chat Content */}
                    <div className="flex-1 flex flex-col p-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                        <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                            <AnimatePresence mode="popLayout">
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i + msg.text}
                                        initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20, y: 10 }}
                                        animate={{ opacity: 1, x: 0, y: 0 }}
                                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                                            msg.type === 'user' 
                                            ? 'bg-primary/20 border border-primary/20 text-blue-100 rounded-tr-none' 
                                            : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none ring-1 ring-white/5'
                                        }`}>
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {currentStep < scenario.length && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex gap-2"
                                >
                                    <div className="w-8 h-4 bg-white/5 rounded-full flex items-center justify-center gap-1">
                                        <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                                        <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
                            <div className="flex-1 h-10 bg-white/5 rounded-full border border-white/10 px-4 flex items-center text-slate-500 text-xs italic">
                                Type your reflections...
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                <Sparkles size={16} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Crazy Floating Elements */}
                <div className="absolute top-1/4 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-1/4 -left-20 w-40 h-40 bg-accent/10 rounded-full blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>
            </motion.div>

            {/* Tags / Indicators around the tab */}
            <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-12 -right-8 glass rounded-2xl p-3 border border-white/20 shadow-xl hidden md:block"
            >
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                    <span className="text-[10px] font-bold text-slate-300">PRIVACY VERIFIED</span>
                </div>
            </motion.div>

            <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -bottom-10 -left-12 glass rounded-2xl p-4 border border-white/20 shadow-xl hidden md:block max-w-[200px]"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-yellow-400/20 rounded-lg">
                        <Brain size={16} className="text-yellow-400" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300">EMOTION ANALYSIS</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                        animate={{ width: ["20%", "80%", "40%"] }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="h-full bg-primary"
                    />
                </div>
            </motion.div>
        </div>
    );
};

export default WebTabPreview;
