import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, BrainCircuit, AlertTriangle } from 'lucide-react';

const DemoSection = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: "Hi there! I'm MindSaarthi. This is a safe space to share how you've been feeling today. What's on your mind?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [apiError, setApiError] = useState(null);
    const scrollRef = useRef(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isTyping) return;

        // Reset error state
        setApiError(null);

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const userMsg = { id: Date.now(), type: 'user', text: inputValue, timestamp };
        setMessages(prev => [...prev, userMsg]);
        const userText = inputValue;
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userText }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: data.reply || "I'm sorry, I didn't quite understand that.",
                risk: data.risk,
                sentiment: data.sentiment,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error("Chat API error:", error);
            setApiError("Failed to connect to AI server. Please ensure the Flask backend is running on port 5000.");

            // Add fallback message so UI doesn't break
            const fallbackMsg = {
                id: Date.now() + 2,
                type: 'bot',
                text: "I'm having trouble connecting to my neural network right now. Are you sure the backend server is running?",
                isError: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <section id="demo" className="py-24 bg-surface-light dark:bg-surface-dark overflow-hidden">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Left Text content */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 dark:bg-accent/20 text-accent dark:text-accent-light font-medium text-sm border border-accent/20">
                            <BrainCircuit size={16} />
                            <span>Live AI Chatbot Demo</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
                            Experience the power of Empathetic AI
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Our full-stack chatbot connects to a Live NLP backend. Try typing a message below to see how MindSaarthi interprets emotions and safely categorizes risk levels.
                        </p>

                        <div className="flex gap-4 items-center pt-4">
                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <span className="text-primary font-bold">1</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white">Share your thoughts</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Type naturally about how you feel.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                                <span className="text-accent font-bold">2</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white">Live Sentiment Analysis</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Detects keywords and returns a dynamic Risk Score.</p>
                            </div>
                        </div>

                        {apiError && (
                            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400">
                                <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                                <p className="text-sm">{apiError}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Demo UI */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        {/* Soft background glow */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur-xl opacity-20 dark:opacity-30"></div>

                        <div className="relative bg-[#f0f2f5] dark:bg-[#0b141a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[550px]">
                            {/* Header (WhatsApp style) */}
                            <div className="px-5 py-3 border-b flex items-center gap-3 bg-[#f0f2f5] dark:bg-[#202c33] border-slate-200 dark:border-slate-800 z-10 shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white shadow-md relative">
                                    <Bot size={20} />
                                    <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-[#f0f2f5] dark:border-[#202c33] rounded-full bg-green-500"></span>
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight">MindSaarthi Assistant</h3>
                                    <span className="text-[13px] text-slate-500 dark:text-slate-400">
                                        {isTyping ? <span className="text-primary dark:text-primary-light">typing...</span> : "Online"}
                                    </span>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div
                                ref={scrollRef}
                                className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 scroll-smooth custom-scrollbar bg-[#efeae2] dark:bg-[#0b141a] bg-opacity-50 dark:bg-opacity-100"
                                style={{
                                    backgroundImage: "url('https://transparenttextures.com/patterns/cubes.png')",
                                    backgroundBlendMode: "overlay"
                                }}
                            >
                                <div className="flex justify-center mb-4">
                                    <span className="bg-white/80 dark:bg-[#182229]/80 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 shadow-sm">
                                        Today
                                    </span>
                                </div>

                                <AnimatePresence initial={false}>
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                            whileHover={{ scale: 1.01 }}
                                            className={`flex gap-2 max-w-[85%] ${msg.type === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                                        >
                                            {/* Avatar only for bot */}
                                            {msg.type === 'bot' && (
                                                <div className="w-8 h-8 mt-1 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary dark:text-primary-light shadow-sm">
                                                    <Bot size={16} />
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-1">
                                                <div className={`px-4 py-2.5 rounded-2xl text-[15px] shadow-sm relative leading-relaxed ${msg.type === 'user'
                                                        ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-sm'
                                                        : msg.isError
                                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-tl-sm'
                                                            : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-sm'
                                                    }`}
                                                >
                                                    {/* Markdown-style simple bolding could be added here if needed, keeping simple text for now */}
                                                    {msg.text}

                                                    {/* Risk Level Badge for bot responses */}
                                                    {msg.risk && (
                                                        <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 flex items-center gap-1.5">
                                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${msg.risk === 'High' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                                                                    msg.risk === 'Moderate' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' :
                                                                        'bg-green-100 text-green-600 dark:bg-green-900/30'
                                                                }`}>
                                                                {msg.risk} Risk
                                                            </span>
                                                            {msg.sentiment && (
                                                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                                                                    {msg.sentiment}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className={`text-[10px] mt-1 text-right float-right ml-4 ${msg.type === 'user' ? 'text-[#667781] dark:text-[#8696a0]' : 'text-[#667781] dark:text-[#8696a0]'
                                                        }`}>
                                                        {msg.timestamp}
                                                        {msg.type === 'user' && (
                                                            <svg viewBox="0 0 16 11" width="16" height="11" className="inline-block ml-1 opacity-80" fill="currentColor">
                                                                <path d="M11.851 1.053l1.06 1.06-4.966 4.965-1.06-1.06 4.966-4.965zm-6.273 0l6.026 6.026v.001l.001.001-1.06 1.059-4.966-4.965-2.122 2.122-1.06-1.06 3.181-3.184zM15.034 1.053l1.06 1.06-7.087 7.088-3.181-3.182 1.06-1.06 2.121 2.121 6.027-6.027z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex gap-2 max-w-[85%] self-start"
                                    >
                                        <div className="w-8 h-8 mt-1 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary shadow-sm">
                                            <Bot size={16} />
                                        </div>
                                        <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-white dark:bg-[#202c33] shadow-sm flex items-center gap-1.5 h-[40px]">
                                            <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSend} className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 flex items-end gap-2 z-10">
                                <div className="flex-1 relative bg-white dark:bg-[#2a3942] rounded-xl shadow-sm border border-transparent focus-within:border-primary/50 transition-colors">
                                    <textarea
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend(e);
                                            }
                                        }}
                                        placeholder="Type a message..."
                                        className="w-full bg-transparent py-3 pl-4 pr-12 outline-none text-[15px] resize-none max-h-[120px] text-slate-800 dark:text-[#e9edef] dark:placeholder-slate-500 custom-scrollbar"
                                        rows="1"
                                        style={{ minHeight: '44px', paddingRight: '12px' }}
                                    />
                                </div>
                                <motion.button
                                    type="submit"
                                    disabled={!inputValue.trim() || isTyping}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-3 bg-primary hover:bg-primary-light text-white rounded-full transition-colors disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 shadow-md flex items-center justify-center shrink-0 mb-0.5"
                                >
                                    <Send size={20} className="ml-0.5" />
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default DemoSection;
