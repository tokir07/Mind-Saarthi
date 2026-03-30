import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bot, Send, ChevronLeft, AlertTriangle, Mic, MicOff, 
  Volume2, VolumeX, Download, ArrowRight, Sparkles,
  Command, Smile, Paperclip, MoreHorizontal
} from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import RecoveryPlan from '../components/RecoveryPlan';
import ChatSidebar from '../components/ChatSidebar';
import ChatMessages from '../components/ChatMessages';
import ThemeToggle from '../components/common/ThemeToggle';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const ChatPage = () => {
    const { token, user } = useAuth();
    const { darkMode } = useTheme();
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

    // Crisis Management State
    const [showConsent, setShowConsent] = useState(false);
    const [crisisData, setCrisisData] = useState(null); 
    const [isEmergencyLoading, setIsEmergencyLoading] = useState(false);
    
    // Recovery Plan State
    const [activePlan, setActivePlan] = useState(null);
    const [isPlanLoading, setIsPlanLoading] = useState(false);

    // Voice Features State
    const [isListening, setIsListening] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false); 

    const scrollRef = useRef(null);
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '52px';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = Math.min(scrollHeight, 150) + 'px';
        }
    }, [inputValue]);

    useEffect(() => {
        if (!token) navigate('/login');
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
            const onStart = () => setIsListening(true);
            const onEnd = () => setIsListening(false);
            const onResult = (event) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setInputValue(currentTranscript);
            };
            const onError = (event) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
            };
            recognition.addEventListener('start', onStart);
            recognition.addEventListener('end', onEnd);
            recognition.addEventListener('result', onResult);
            recognition.addEventListener('error', onError);
            return () => {
                recognition.removeEventListener('start', onStart);
                recognition.removeEventListener('end', onEnd);
                recognition.removeEventListener('result', onResult);
                recognition.removeEventListener('error', onError);
                recognition.stop();
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognition) { alert("Speech recognition is not supported."); return; }
        isListening ? recognition.stop() : recognition.start();
    };

    const speakText = (text) => {
        if (!voiceEnabled || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    const handleDownloadReport = () => {
        const doc = new jsPDF();
        const primaryColor = [23, 93, 197];
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text("MindSaarthi AI", 20, 20);
        doc.save(`MindSaarthi_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handleEmergencyConfirm = async () => {
        setIsEmergencyLoading(true);
        try {
            const pos = await new Promise((res, rej) => 
                navigator.geolocation.getCurrentPosition(p => res({lat:p.coords.latitude, lng:p.coords.longitude}), rej)
            );
            const response = await axios.post('http://localhost:5000/emergency-confirm', pos, {headers:{Authorization:`Bearer ${token}`}});
            setCrisisData(response.data);
            setShowConsent(false);
            setMessages(prev => [...prev, {
                id: Date.now(), type: 'bot', 
                text: "Notified help. Nearest clinics identified below.", risk: "High", 
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch (e) {
            alert("Location error. Help resources shown.");
            setShowConsent(false);
            setCrisisData({doctors:[{name:"Emergency Help", address:"Call 112 or 988"}]});
        } finally { setIsEmergencyLoading(false); }
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (isListening && recognition) recognition.stop();
        if (!inputValue.trim() || isTyping) return;

        const userMsg = { 
            id: Date.now(), 
            type: 'user', 
            text: inputValue, 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        };
        setMessages(prev => [...prev, userMsg]);
        const userText = inputValue;
        setInputValue('');
        setIsTyping(true);

        try {
            const resp = await axios.post('http://localhost:5000/chat', {message:userText}, {headers:{Authorization:`Bearer ${token}`}});
            const botMsg = { 
                id: Date.now()+1, 
                type:'bot', 
                text:resp.data.reply, 
                risk:resp.data.risk, 
                sentiment:resp.data.sentiment, 
                suggestion: resp.data.suggestion,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            };
            setMessages(prev => [...prev, botMsg]);
            if (resp.data.ask_consent) setShowConsent(true);
            speakText(resp.data.reply);
        } catch (error) {
            setMessages(prev => [...prev, { id:Date.now(), type:'bot', text:"Trouble connecting. I'm here though.", timestamp: new Date().toLocaleTimeString() }]);
        } finally { setIsTyping(false); }
    };

    // Derived Stats
    const latestBotMsg = [...messages].reverse().find(m => m.type === 'bot');
    const stats = { risk: latestBotMsg?.risk || 'Low', sentiment: latestBotMsg?.sentiment ||'Neutral', messagesCount: messages.length };

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-background-dark text-slate-200' : 'bg-background-light text-slate-800'}`}>
            {/* Left Sidebar */}
            <div className="hidden lg:block w-80 shrink-0 border-r border-slate-200 dark:border-slate-800">
                <ChatSidebar user={user} stats={stats} />
            </div>

            {/* Main Chat Content */}
            <div className="flex-1 flex flex-col relative overflow-hidden h-full">
                {/* Header */}
                <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center px-6 justify-between shrink-0 z-20 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="p-2 h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <ChevronLeft size={20} />
                        </Link>
                        <div className="flex flex-col">
                            <h2 className="text-sm font-bold tracking-tight">MindSaarthi AI</h2>
                            <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Secure Session Active
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <motion.button 
                            whileHover={{scale:1.05}} 
                            whileTap={{scale:0.95}} 
                            onClick={handleDownloadReport} 
                            className="p-2 h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light transition-all"
                            title="Download Report"
                        >
                            <Download size={18} />
                        </motion.button>
                        <motion.button 
                            whileHover={{scale:1.05}} 
                            whileTap={{scale:0.95}} 
                            onClick={()=>{setVoiceEnabled(!voiceEnabled); if(voiceEnabled)window.speechSynthesis.cancel();}} 
                            className={`p-2 h-10 w-10 flex items-center justify-center rounded-xl transition-all ${voiceEnabled ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                            title={voiceEnabled ? "Voice Enabled" : "Voice Disabled"}
                        >
                            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        </motion.button>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>
                        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} className="p-2 h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hidden sm:flex">
                           <MoreHorizontal size={18} />
                        </motion.button>
                    </div>
                </header>

                {/* Messages Feed */}
                <ChatMessages messages={messages} isTyping={isTyping} scrollRef={scrollRef} />

                {/* Input Section */}
                <div className="p-6 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light dark:via-background-dark to-transparent relative z-20">
                    <div className="max-w-4xl mx-auto">
                        <AnimatePresence>
                            {isTyping && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="px-4 py-2 text-xs font-semibold text-primary dark:text-primary-light flex items-center gap-2 mb-2"
                                >
                                    <Sparkles size={12} className="animate-pulse" />
                                    MindSaarthi is thinking...
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSend} className="relative group">
                            <div className="glass shadow-2xl shadow-primary/5 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-500">
                                <div className="flex items-end p-2 gap-2">
                                     <motion.button 
                                        type="button" 
                                        onClick={toggleListening} 
                                        whileHover={{scale:1.1}} 
                                        whileTap={{scale:0.9}} 
                                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${isListening ? 'bg-accent text-white shadow-lg shadow-accent/40 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                    >
                                        {isListening ? <Mic size={20} /> : <MicOff size={20} />}
                                    </motion.button>

                                    <textarea
                                        ref={textareaRef} 
                                        value={inputValue} 
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                                        placeholder={isListening ? "Listening..." : "Share what's on your mind..."}
                                        className="flex-1 bg-transparent py-3.5 px-4 outline-none text-[15px] resize-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 custom-scrollbar"
                                        rows="1" 
                                        style={{ minHeight: '52px', maxHeight: '150px' }}
                                    />

                                    <div className="flex items-center gap-1.5 p-1 mb-1 pr-1.5">
                                        <button type="button" className="p-2.5 text-slate-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-full">
                                            <Smile size={20} />
                                        </button>
                                        <button type="button" className="p-2.5 text-slate-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-full">
                                            <Paperclip size={20} />
                                        </button>
                                        <motion.button 
                                            type="submit" 
                                            disabled={!inputValue.trim() || isTyping} 
                                            whileHover={inputValue.trim() ? {scale:1.05} : {}} 
                                            whileTap={inputValue.trim() ? {scale:0.95} : {}} 
                                            className="w-11 h-11 bg-primary text-white rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:grayscale transition-all"
                                        >
                                            <Send size={18} className="translate-x-0.5" />
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </form>
                        
                        <div className="flex justify-center mt-4">
                            <p className="text-[10px] items-center gap-1 text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest hidden sm:flex">
                                <Command size={10} /> + Enter to send fast
                            </p>
                        </div>
                    </div>
                </div>

                {/* Crisis Control (if needed) */}
                <AnimatePresence>
                    {crisisData && (
                        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, scale:0.9}} className="fixed top-20 right-6 w-80 p-5 glass border-2 border-accent/20 rounded-3xl z-50 overflow-hidden shadow-2xl">
                             <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-accent animate-pulse" />
                                    <h4 className="text-xs font-black uppercase text-accent">Urgent Support</h4>
                                </div>
                                <button onClick={() => setCrisisData(null)} className="text-slate-400 hover:text-slate-600"><ArrowRight size={14} /></button>
                             </div>
                             <div className="space-y-3">
                                {crisisData.doctors.slice(0, 2).map((doc, i) => (
                                    <div key={i} className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <p className="text-[11px] font-bold mb-1">{doc.name}</p>
                                        <p className="text-[10px] text-slate-500 mb-2 truncate">{doc.address}</p>
                                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${doc.name}`} target="_blank" className="block w-full py-1.5 bg-accent text-white text-[10px] font-bold rounded-lg text-center">Help Now</a>
                                    </div>
                                ))}
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Emergency Modal */}
            <AnimatePresence>
                {showConsent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
                        <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="glass border border-white/20 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl">
                            <div className="w-16 h-16 bg-accent/20 rounded-[1.5rem] flex items-center justify-center text-accent mb-6 mx-auto">
                                <AlertTriangle size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-center mb-3 tracking-tight">Need Urgent Support?</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-center text-sm mb-8 leading-relaxed">I'm concerned. Can I notify help and find medical support nearby?</p>
                            <div className="flex flex-col gap-3">
                                <button onClick={handleEmergencyConfirm} disabled={isEmergencyLoading} className="btn-primary bg-accent hover:bg-accent-dark py-4 text-white shadow-lg shadow-accent/20">{isEmergencyLoading ? "Locating Help..." : "Yes, please help me"}</button>
                                <button onClick={() => setShowConsent(false)} className="py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors">Not right now</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
            {/* Background Blobs (Low Opacity) */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-30 dark:opacity-20">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-blob"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] animate-blob delay-1000"></div>
            </div>
        </div>
    );
};

export default ChatPage;
