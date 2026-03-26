import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, User, Send, ChevronLeft, AlertTriangle, Mic, MicOff, Volume2, VolumeX, Download } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const ChatPage = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: `Hi ${user?.name ? user.name.split(' ')[0] : 'there'}! I'm MindSaarthi. This is a safe space for you. How are you feeling today?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Voice Features State
    const [isListening, setIsListening] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false); // TTS Toggle

    const scrollRef = useRef(null);

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Setup Speech Recognition
    useEffect(() => {
        if (recognition) {
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);

            recognition.onresult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setInputValue(currentTranscript);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognition) {
            alert("Speech recognition is not supported in this browser. Please use Google Chrome.");
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };

    const speakText = (text) => {
        if (!voiceEnabled || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    };

    const handleDownloadReport = () => {
        const doc = new jsPDF();
        const primaryColor = [23, 93, 197]; // #175dc5
        const dangerColor = [255, 29, 36]; // #ff1d24

        // 1. Header
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.text("MindSaarthi AI", 20, 20);
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Secure Mental Health Screening Report", 20, 28);

        // 2. User Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.text(`Patient: ${user?.name || 'Anonymous User'}`, 20, 50);
        doc.text(`Email: ${user?.email || 'Not Provided'}`, 20, 56);
        doc.text(`Date of Session: ${new Date().toLocaleDateString()}`, 20, 62);

        // Analytics Extraction
        const botMessages = messages.filter(m => m.type === 'bot' && m.risk);
        const totalMsgs = messages.length;
        const latestRisk = botMessages.length > 0 ? botMessages[botMessages.length - 1].risk : "Low";
        const riskColor = latestRisk === 'High' ? dangerColor : latestRisk === 'Moderate' ? [234, 150, 23] : [34, 197, 94];

        // 3. Risk Assessment Badge
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Clinical Risk Assessment:", 20, 80);
        doc.setFillColor(...riskColor);
        doc.rect(85, 73, 35, 9, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text(latestRisk.toUpperCase(), 90, 79);

        // 4. Summary & Insights
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`Total Interactions: ${totalMsgs}`, 20, 95);

        // 5. Recommendations
        doc.setFont("helvetica", "bold");
        doc.text("Recommendations:", 20, 110);
        doc.setFont("helvetica", "normal");

        let recommendation = "";
        if (latestRisk === 'High') {
            recommendation = "• Urgent: Please reach out to a professional or a crisis helpline immediately.\n• We are here for you, but immediate clinical support is highly recommended.\n• Talk to a trusted friend or family member if possible.";
        } else if (latestRisk === 'Moderate') {
            recommendation = "• Consider scheduling a brief session with a therapist.\n• Practice mindfulness and breathing exercises (e.g., 4-7-8 method).\n• Ensure you're getting enough sleep and taking breaks from work.";
        } else {
            recommendation = "• Continue maintaining healthy mental habits.\n• Regular physical exercise and social interaction are great for your mind.\n• Keep using MindSaarthi for periodic check-ins whenever you desire.";
        }

        doc.text(recommendation, 20, 118, { maxWidth: 170 });

        // 6. Chat Transcript Log
        doc.setFont("helvetica", "bold");
        doc.text("Session Transcript Extract:", 20, 145);

        const tableData = messages.slice(1).map(m => [
            m.timestamp,
            m.type === 'user' ? 'Client' : 'AI Bot',
            m.text
        ]);

        autoTable(doc, {
            startY: 150,
            head: [['Time', 'Speaker', 'Message']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: primaryColor },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 20 },
                2: { cellWidth: 145 }
            },
            styles: { fontSize: 9 }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text("MindSaarthi AI - AI Generated Report. Not an official medical diagnosis.", 20, 290);
        }

        // Save
        doc.save(`MindSaarthi_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();

        // Stop listening if sending
        if (isListening && recognition) recognition.stop();

        if (!inputValue.trim() || isTyping) return;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const userMsg = { id: Date.now(), type: 'user', text: inputValue, timestamp };

        setMessages(prev => [...prev, userMsg]);
        const userText = inputValue;
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await axios.post('http://localhost:5000/chat',
                { message: userText },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = response.data;
            const replyText = data.reply || "I didn't quite catch that. Could you repeat it?";

            const botMsg = {
                id: Date.now() + 1,
                type: 'bot',
                text: replyText,
                risk: data.risk,
                sentiment: data.sentiment,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, botMsg]);

            // Trigger TTS
            speakText(replyText);

        } catch (error) {
            console.error("Chat API error:", error);
            const fallbackMsg = {
                id: Date.now() + 2,
                type: 'bot',
                text: "I'm having trouble connecting to my server right now. Let's try again in a moment.",
                isError: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, fallbackMsg]);
            speakText(fallbackMsg.text);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
            {/* Header */}
            <header className="glass shadow-sm py-4 sticky top-0 z-50">
                <div className="container mx-auto px-6 max-w-4xl flex justify-between items-center">
                    <Link to="/dashboard" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-light transition-colors group z-10 w-1/4 md:w-1/3">
                        <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium hidden sm:block">Back to Dashboard</span>
                    </Link>

                    <div className="flex items-center justify-center gap-3 w-2/4 md:w-1/3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white shadow-inner relative shrink-0">
                            <Bot size={20} />
                            <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-[#0f1526] rounded-full bg-green-500"></span>
                        </div>
                        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight">MindSaarthi AI</h3>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {isTyping ? <span className="text-primary dark:text-primary-light font-medium animate-pulse">thinking...</span> : "Always Online"}
                            </span>
                        </div>
                    </div>

                    <div className="w-1/4 md:w-1/3 flex justify-end gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDownloadReport}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border shadow-sm bg-white text-slate-700 border-slate-200 hover:bg-primary hover:text-white hover:border-primary dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-primary`}
                            title="Download Session Report"
                        >
                            <Download size={16} />
                            <span className="hidden sm:inline">Report</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setVoiceEnabled(!voiceEnabled);
                                if (voiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border shadow-sm ${voiceEnabled
                                ? 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-light dark:border-primary/30'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                                }`}
                        >
                            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            <span className="hidden sm:inline">{voiceEnabled ? 'Voice ON' : 'Voice OFF'}</span>
                        </motion.button>
                    </div>
                </div>
            </header>

            {/* Chat Container */}
            <main className="flex-1 container mx-auto px-4 sm:px-6 max-w-4xl flex flex-col pt-6 pb-6 w-full">
                <div className="flex-1 glass-card rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden bg-white dark:bg-[#0b141a]">

                    {/* Chat Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col gap-6 scroll-smooth custom-scrollbar bg-[#efeae2] dark:bg-[#0b141a] bg-opacity-50 dark:bg-opacity-100"
                        style={{
                            backgroundImage: "url('https://transparenttextures.com/patterns/cubes.png')",
                            backgroundBlendMode: "overlay"
                        }}
                    >
                        <div className="flex justify-center mb-4">
                            <span className="bg-white/90 dark:bg-[#182229]/90 backdrop-blur-sm px-4 py-1.5 rounded-lg text-[13px] font-medium text-slate-500 dark:text-slate-400 shadow-sm border border-black/5 dark:border-white/5 uppercase tracking-wide">
                                HIPAA Compliant Secure Session • Today
                            </span>
                        </div>

                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    whileHover={{ y: -2 }}
                                    className={`flex gap-3 max-w-[90%] md:max-w-[75%] transition-transform duration-200 ${msg.type === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                                >
                                    {msg.type === 'bot' && (
                                        <div className="w-10 h-10 mt-1 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-primary dark:text-primary-light shadow-sm">
                                            <Bot size={20} />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                                        <div className={`px-5 py-3.5 rounded-3xl shadow-md relative leading-relaxed text-[15px] backdrop-blur-sm ${msg.type === 'user'
                                            ? 'bg-primary text-white rounded-tr-sm'
                                            : msg.isError
                                                ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-tl-sm border border-red-100 dark:border-red-900/50'
                                                : 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-white/50 dark:border-white/5'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap">{msg.text}</p>

                                            {/* Advanced Output Badges */}
                                            {msg.risk && (
                                                <div className={`mt-3 pt-3 border-t flex flex-wrap items-center gap-2 ${msg.type === 'user' ? 'border-white/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                                    <span className={`text-[11px] uppercase font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm ${msg.risk === 'High' ? 'bg-[#ff1d24]/10 text-[#ff1d24] dark:bg-[#ff1d24]/20 border border-[#ff1d24]/20' :
                                                        msg.risk === 'Moderate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border border-yellow-200/50' :
                                                            'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200/50'
                                                        }`}>
                                                        {msg.risk === 'High' && <AlertTriangle size={12} />}
                                                        {msg.risk} Risk
                                                    </span>
                                                    {msg.sentiment && (
                                                        <span className={`text-[11px] uppercase font-bold px-2 py-1 rounded-full ${msg.type === 'user' ? 'bg-white/10 text-white border border-white/20' : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                                                            }`}>
                                                            {msg.sentiment}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className={`text-[11px] mt-2 flex items-center justify-end gap-1 font-medium ${msg.type === 'user' ? 'text-primary-light/80' : 'text-slate-400 dark:text-slate-500'
                                                }`}>
                                                {msg.timestamp}
                                                {msg.type === 'user' && (
                                                    <svg viewBox="0 0 16 11" width="16" height="11" className="opacity-100 ml-0.5" fill="currentColor">
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
                                className="flex gap-3 max-w-[85%] self-start"
                            >
                                <div className="w-10 h-10 mt-1 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-primary shadow-sm">
                                    <Bot size={20} />
                                </div>
                                <div className="px-5 py-4 rounded-3xl rounded-tl-sm bg-slate-100/90 dark:bg-slate-800/90 shadow-sm border border-white/50 dark:border-white/5 flex items-center gap-2 h-[48px] backdrop-blur-sm">
                                    <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="w-2 h-2 bg-primary/60 rounded-full"></motion.span>
                                    <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.15 }} className="w-2 h-2 bg-primary/60 rounded-full"></motion.span>
                                    <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }} className="w-2 h-2 bg-primary/60 rounded-full"></motion.span>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Listening Indicator */}
                    <AnimatePresence>
                        {isListening && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-[#f0f2f5] dark:bg-[#1a2329] border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 px-6 py-3"
                            >
                                <div className="flex items-center gap-1 h-4">
                                    <motion.span animate={{ height: ["40%", "100%", "40%"] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }} className="w-1 bg-[#ff1d24] rounded-full"></motion.span>
                                    <motion.span animate={{ height: ["20%", "80%", "20%"] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.1 }} className="w-1 bg-[#ff1d24] rounded-full"></motion.span>
                                    <motion.span animate={{ height: ["60%", "100%", "60%"] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.2 }} className="w-1 bg-[#ff1d24] rounded-full"></motion.span>
                                    <motion.span animate={{ height: ["30%", "70%", "30%"] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.3 }} className="w-1 bg-[#ff1d24] rounded-full"></motion.span>
                                </div>
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 italic">Listening to your voice...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 bg-white dark:bg-[#0b141a] border-t border-slate-100 dark:border-slate-800 flex items-end gap-3 z-10 w-full shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">

                        <motion.button
                            type="button"
                            onClick={toggleListening}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center shrink-0 mb-1 z-10 ${isListening
                                ? 'bg-[#ff1d24]/10 border-[#ff1d24] text-[#ff1d24] shadow-[0_0_15px_rgba(255,29,36,0.3)] animate-pulse'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary hover:border-primary/50 dark:hover:border-primary/50'
                                }`}
                        >
                            {isListening ? <Mic size={20} /> : <MicOff size={20} />}
                        </motion.button>

                        <motion.div
                            className="flex-1 relative bg-slate-50 dark:bg-[#1a2329] rounded-2xl border-2 border-slate-100 dark:border-slate-800 focus-within:border-primary/50 focus-within:shadow-[0_0_15px_rgba(23,93,197,0.15)] transition-all duration-300 ease-out"
                        >
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                                placeholder={isListening ? "Listening..." : "Share your thoughts honestly..."}
                                className="w-full bg-transparent py-3 pl-4 pr-4 outline-none text-[16px] resize-none max-h-[150px] text-slate-800 dark:text-[#e9edef] dark:placeholder-slate-400 custom-scrollbar"
                                rows="1"
                                style={{ minHeight: '52px' }}
                            />
                        </motion.div>

                        <motion.button
                            type="submit"
                            disabled={!inputValue.trim() || isTyping}
                            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(23,93,197,0.5)" }}
                            whileTap={{ scale: 0.95 }}
                            className="w-14 h-14 bg-primary text-white rounded-full transition-colors disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 shadow-[0_4px_15px_rgba(23,93,197,0.3)] flex items-center justify-center shrink-0 mb-0.5"
                        >
                            <Send size={22} className="ml-1" />
                        </motion.button>
                    </form>

                </div>
            </main>
        </div>
    );
};

export default ChatPage;
