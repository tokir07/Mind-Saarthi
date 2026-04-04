import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Shield, CheckCheck, Smile, ThumbsUp, Heart, Sparkles } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const ChatMessages = ({ messages, isTyping, scrollRef, hasActivity }) => {
    const { darkMode } = useTheme();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const messageVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 25 }
        }
    };

    return (
        <div
            ref={scrollRef}
            className="flex-1 p-6 md:p-10 overflow-y-auto flex flex-col gap-8 scroll-smooth custom-scrollbar relative z-10"
        >
            <div className="flex justify-center mb-4">
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-5 py-2.5 glass-card rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest"
                >
                    <Shield size={14} className="text-emerald-500" />
                    End-to-End Encrypted Session
                </motion.div>
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-8"
            >
                <AnimatePresence mode="popLayout">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={msg.id || i}
                            variants={messageVariants}
                            layout
                            className={`flex gap-4 max-w-[92%] md:max-w-[80%] ${msg.type === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                        >
                            {/* Avatar for bot */}
                            {msg.type === 'bot' && (
                                <div className="w-10 h-10 mt-1 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 text-primary shadow-inner">
                                    <Bot size={22} />
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5 group">
                                <div className={`relative px-5 py-3.5 rounded-3xl shadow-sm transition-all duration-300 ${
                                    msg.type === 'user'
                                        ? 'bg-gradient-to-br from-primary via-primary to-indigo-600 text-white rounded-tr-none shadow-lg shadow-primary/20'
                                        : 'glass-card border-primary/10 dark:border-primary/5 rounded-tl-none bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm'
                                }`}>
                                    <p className="text-[15px] leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
 
                                     {/* Smart Coping Suggestion */}
                                     {msg.type === 'bot' && msg.suggestion && (
                                         <motion.div 
                                             initial={{ opacity: 0, scale: 0.95 }}
                                             animate={{ opacity: 1, scale: 1 }}
                                             whileHover={{ scale: 1.02 }}
                                             className="mt-4 p-4 bg-primary/5 dark:bg-white/5 border border-primary/20 dark:border-white/10 rounded-2xl flex items-start gap-4 shadow-sm"
                                         >
                                             <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
                                                 <Heart size={16} fill="currentColor" className="opacity-80" />
                                             </div>
                                             <div className="flex-1">
                                                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1.5 flex items-center gap-2">
                                                     <Sparkles size={12} /> MindSaarthi Recommendation
                                                 </h4>
                                                 <p className="text-[13px] font-bold leading-relaxed text-slate-700 dark:text-slate-200">
                                                     {msg.suggestion}
                                                 </p>
                                             </div>
                                         </motion.div>
                                     )}
 
                                     {/* Risk/Sentiment Badges for Bot */}
                                     {msg.type === 'bot' && (msg.risk || msg.sentiment) && (
                                         <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                                             {msg.risk && (
                                                 <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                                                     msg.risk === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                     msg.risk === 'Moderate' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                     'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                 }`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current inline-block mr-1.5 animate-pulse" />
                                                     {msg.risk} Priority
                                                 </span>
                                             )}
                                             {msg.sentiment && (
                                                 <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-transparent">
                                                     Analyzed: {msg.sentiment}
                                                 </span>
                                             )}
                                         </div>
                                     )}

                                    {/* Action Buttons (Visible on hover) */}
                                    <div className={`absolute -bottom-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.type === 'user' ? 'right-0' : 'left-0'}`}>
                                        <button className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                                            <ThumbsUp size={12} />
                                        </button>
                                        <button className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                                            <Heart size={12} />
                                        </button>
                                        <button className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                                            <Smile size={12} />
                                        </button>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-wider ${msg.type === 'user' ? 'justify-end text-primary/60' : 'text-slate-400'}`}>
                                    {msg.timestamp}
                                    {msg.type === 'user' && <CheckCheck size={14} className="text-primary" />}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Fixed Spacer for floating input (More generous) */}
                <div className="h-[160px] shrink-0" />
                
                {/* Dynamic Spacer for active exercises/scans */}
                {hasActivity && (
                    <motion.div 
                        initial={{ height: 0 }} 
                        animate={{ height: 260 }} 
                        className="shrink-0"
                    />
                )}
            </motion.div>

            {isTyping && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex gap-4 self-start"
                >
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 text-primary">
                        <Bot size={22} />
                    </div>
                    <div className="glass-card px-5 py-4 rounded-3xl rounded-tl-none flex items-center gap-2 h-12 shadow-inner">
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 bg-primary rounded-full"></motion.div>
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-primary rounded-full"></motion.div>
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-primary rounded-full"></motion.div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default ChatMessages;
