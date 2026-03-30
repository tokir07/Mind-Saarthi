import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    Users, Send, ChevronLeft, AlertTriangle, Mic, MicOff,
    Heart, Stars, Shield, LayoutDashboard, MessageCircle,
    MoreHorizontal, Sparkles, Smile, Filter, Activity
} from 'lucide-react';
import io from 'socket.io-client';
import ThemeToggle from '../components/common/ThemeToggle';

// src/pages/GroupChatPage.jsx
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    transports: ['websocket', 'polling'],
    withCredentials: true
});


const stickers = [
    { id: 's1', emoji: '🐼', label: 'Peaceful Panda', color: 'bg-slate-100' },
    { id: 's2', emoji: '🐱', label: 'Zen Cat', color: 'bg-orange-100' },
    { id: 's3', emoji: '🧸', label: 'Hugging Bear', color: 'bg-amber-100' },
    { id: 's4', emoji: '🦁', label: 'Brave Lion', color: 'bg-yellow-100' },
    { id: 's5', emoji: '🐨', label: 'Calm Koala', color: 'bg-gray-100' },
    { id: 's6', emoji: '☀️', label: 'Joyful Sun', color: 'bg-yellow-100' },
    { id: 's7', emoji: '🌈', label: 'Rainbow Hope', color: 'bg-blue-100' },
    { id: 's8', emoji: '🦋', label: 'Growth Bird', color: 'bg-purple-100' },
];

const GroupChatPage = () => {
    const { token, user } = useAuth();
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [roomInfo, setRoomInfo] = useState({ name: 'Matching...', id: '' });
    const [anonymous, setAnonymous] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [showStickers, setShowStickers] = useState(false);
    const [groupStats, setGroupStats] = useState({ mood: 72, stress: 30 });
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!token) navigate('/login');

        // Fetch user profile for anonymous status
        fetch('http://localhost:5000/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => setAnonymous(data.anonymous_mode))
            .catch(err => console.error(err));

        // Join group
        socket.emit('join_group', { user_id: user?.id });

        socket.on('status', (data) => {
            setRoomInfo({ name: data.room_name, id: data.room_id });
            setMessages(prev => [...prev, { id: 'status-' + Date.now(), type: 'status', text: data.msg }]);
        });

        socket.on('new_message', (msg) => {
            setMessages(prev => [...prev, { ...msg, type: msg.is_bot ? 'bot' : 'user' }]);
        });

        socket.on('moderation_alert', (data) => {
            alert(data.msg);
        });

        socket.on('crisis_alert', (data) => {
            setMessages(prev => [...prev, {
                id: 'crisis-' + Date.now(),
                type: 'alert',
                text: data.msg,
                helpline: data.helpline
            }]);
        });

        socket.on('new_reaction', (data) => {
            setMessages(prev => prev.map(m =>
                m.id === data.msg_id
                    ? { ...m, reactions: { ...(m.reactions || {}), [data.type]: (m.reactions?.[data.type] || 0) + 1 } }
                    : m
            ));
        });

        return () => {
            socket.off('status');
            socket.off('new_message');
            socket.off('moderation_alert');
            socket.off('crisis_alert');
            socket.off('new_reaction');
        };
    }, [token, navigate, user?.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e) => {
        if (e) e.preventDefault();
        if (!inputValue.trim()) return;

        socket.emit('send_group_message', {
            room: roomInfo.id,
            user_id: user?.id,
            message: inputValue
        });
        setInputValue('');
        setShowStickers(false);
    };

    const handleSendSticker = (sticker) => {
        socket.emit('send_group_message', {
            room: roomInfo.id,
            user_id: user?.id,
            message: sticker.id,
            is_sticker: true
        });
        setShowStickers(false);
    };

    const handleReaction = (msgId, type) => {
        socket.emit('send_reaction', {
            room: roomInfo.id,
            msg_id: msgId,
            type: type
        });
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);
            
            recorder.ondataavailable = (e) => {
                const reader = new FileReader();
                reader.readAsDataURL(e.data);
                reader.onloadend = () => {
                    const base64data = reader.result.split(',')[1];
                    socket.emit('voice_chunk', {
                        room: roomInfo.id,
                        user_id: user?.id,
                        audio: base64data
                    });
                };
            };
            
            recorder.start(500); // 500ms chunks
            setIsRecording(true);
        } catch (err) {
            console.error("Camera/Mic access denied", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            setMediaRecorder(null);
        }
        setIsRecording(false);
    };

    const toggleAnonymous = async () => {
        const newVal = !anonymous;
        setAnonymous(newVal);
        await fetch('http://localhost:5000/user/profile', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ anonymous_mode: newVal })
        });
    };

    const renderMessage = (msg) => {
        if (msg.type === 'status') {
            return (
                <div key={msg.id} className="flex justify-center my-4">
                    <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                        {msg.text}
                    </span>
                </div>
            );
        }

        if (msg.type === 'alert') {
            return (
                <div key={msg.id} className="flex justify-center my-6">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-accent/10 border-2 border-accent/20 rounded-3xl p-6 max-w-md text-center shadow-xl shadow-accent/5 backdrop-blur-sm"
                    >
                        <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent mx-auto mb-4 animate-pulse">
                            <AlertTriangle size={24} />
                        </div>
                        <p className="text-sm font-bold text-accent mb-2">Health & Safety Alert</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">{msg.text}</p>
                        <a href={`tel:${msg.helpline}`} className="inline-block px-6 py-2.5 bg-accent text-white text-xs font-bold rounded-xl shadow-lg shadow-accent/20 hover:scale-105 transition-transform">
                            Call Helpline ({msg.helpline})
                        </a>
                    </motion.div>
                </div>
            );
        }

        const isMe = msg.user_id === user?.id;
        const isBot = msg.is_bot;

        return (
            <div key={msg.id} className={`flex flex-col mb-6 ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${isBot ? 'bg-primary text-white' :
                            isMe ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                        {isBot ? <Sparkles size={18} /> : msg.user[0].toUpperCase()}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        {!isMe && (
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1 uppercase tracking-wider flex items-center gap-1.5">
                                {msg.user}
                                {isBot && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[8px]">AI BOT</span>}
                                {msg.risk === 'High' && <Shield size={10} className="text-accent" />}
                            </span>
                        )}

                        <div className={`p-4 rounded-3xl text-[14px] leading-relaxed shadow-sm ${msg.is_sticker ? 'bg-transparent border-none shadow-none p-0' :
                                isMe ? 'bg-primary text-white rounded-tr-none' :
                                    isBot ? 'bg-white dark:bg-slate-900 border-2 border-primary/20 text-slate-800 dark:text-slate-100 rounded-tl-none' :
                                        'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-800'
                            }`}>
                            {msg.is_sticker ? (
                                <div className="relative group/sticker">
                                    <div className="absolute -inset-2 bg-white/20 dark:bg-white/10 rounded-full blur-xl scale-0 group-hover/sticker:scale-110 transition-transform"></div>
                                    <span className="text-7xl drop-shadow-2xl filter saturate-150 animate-bounce-subtle block transform hover:scale-110 transition-transform cursor-pointer">
                                        {stickers.find(s => s.id === msg.message)?.emoji || '✨'}
                                    </span>
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover/sticker:opacity-100 transition-opacity">
                                        <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-widest">
                                            {stickers.find(s => s.id === msg.message)?.label || 'Sticker'}
                                        </span>
                                    </div>
                                </div>
                            ) : msg.message}
                        </div>

                        {/* Reactions Bar */}
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {['support', 'hug', 'relate'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleReaction(msg.id, type)}
                                    className={`px-2 py-1 rounded-full text-[10px] flex items-center gap-1 transition-all ${msg.reactions?.[type]
                                            ? 'bg-primary/20 text-primary border border-primary/20'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {type === 'support' && <Heart size={10} />}
                                    {type === 'hug' && <Smile size={10} />}
                                    {type === 'relate' && <Stars size={10} />}
                                    {msg.reactions?.[type] || 0}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-background-dark text-slate-200' : 'bg-background-light text-slate-800'}`}>
            {/* Left Sidebar - Group Info */}
            <div className="hidden lg:flex w-80 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl">
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">{roomInfo.name}</h2>
                            <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                14 SOULS ONLINE
                            </p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-4">Group Analytics</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-slate-200/50 dark:border-slate-700/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-bold text-slate-500">Group Mood</span>
                                        <Activity size={12} className="text-emerald-500" />
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${groupStats.mood}%` }}
                                            className="h-full bg-emerald-500"
                                        />
                                    </div>
                                    <p className="mt-2 text-[10px] font-bold text-emerald-500">OPTIMISTIC • {groupStats.mood}%</p>
                                </div>

                                <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-slate-200/50 dark:border-slate-700/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-bold text-slate-500">Stress Balance</span>
                                        <Filter size={12} className="text-primary" />
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${groupStats.stress}%` }}
                                            className="h-full bg-primary"
                                        />
                                    </div>
                                    <p className="mt-2 text-[10px] font-bold text-primary">STABLE • {groupStats.stress}%</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-4">Settings</h3>
                            <button
                                onClick={toggleAnonymous}
                                className={`w-full p-4 rounded-3xl border-2 transition-all flex items-center justify-between group ${anonymous
                                        ? 'bg-primary/10 border-primary/20 text-primary'
                                        : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Shield size={18} className={anonymous ? 'text-primary' : 'text-slate-400'} />
                                    <span className="text-xs font-bold font-mono">ANONYMOUS</span>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${anonymous ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                    <motion.div
                                        animate={{ x: anonymous ? 16 : 0 }}
                                        className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full"
                                    />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-auto p-8 pt-0">
                    <Link to="/dashboard" className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-3xl hover:bg-slate-800 transition-colors shadow-xl shadow-slate-900/20">
                        <LayoutDashboard size={18} />
                        <span className="text-sm font-bold">Back to Dashboard</span>
                    </Link>
                </div>
            </div>

            {/* Main Chat Content */}
            <div className="flex-1 flex flex-col relative overflow-hidden h-full">
                {/* Header */}
                <header className="h-20 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 flex items-center px-8 justify-between shrink-0 z-30 backdrop-blur-2xl">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="lg:hidden p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                            <ChevronLeft size={20} />
                        </Link>
                        <div>
                            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                                {roomInfo.name}
                                <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-1.5 py-0.5 rounded tracking-[0.2em]">ENCRYPTED</span>
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Community Space</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                                +11
                            </div>
                        </div>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                        <ThemeToggle />
                        <button className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                </header>

                {/* Messages Feed */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-8 custom-scrollbar relative"
                >
                    <div className="max-w-3xl mx-auto py-10">
                        <div className="text-center mb-12">
                            <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/10">
                                <MessageCircle size={36} />
                            </div>
                            <h3 className="text-2xl font-black mb-2 tracking-tight">Welcome to the Circle</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">This is a zero-judgment zone. Your identity is protected, and your feelings are valid.</p>
                        </div>

                        {messages.map(renderMessage)}
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-8 pt-0 relative z-30">
                    <div className="max-w-3xl mx-auto">
                        <form onSubmit={handleSend} className="relative group">
                            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-2 border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] p-3 shadow-2xl shadow-primary/5 focus-within:border-primary/30 transition-all duration-500">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onMouseDown={startRecording}
                                        onMouseUp={stopRecording}
                                        onMouseLeave={stopRecording}
                                        className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all ${isRecording
                                                ? 'bg-accent text-white shadow-lg shadow-accent/40 animate-pulse scale-110'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                                            }`}
                                    >
                                        {isRecording ? <Mic size={24} /> : <MicOff size={24} />}
                                    </button>

                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Share your thoughts with the group..."
                                        className="flex-1 bg-transparent py-4 outline-none text-[15px] font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    />

                                    <div className="flex items-center gap-2 pr-2">
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setShowStickers(!showStickers)}
                                                className={`p-3 rounded-2xl transition-all ${showStickers ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:text-primary hover:bg-primary/5'}`}
                                            >
                                                <Smile size={22} />
                                            </button>

                                            <AnimatePresence>
                                                {showStickers && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                                        className="absolute bottom-20 right-0 w-72 p-4 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-3 z-50"
                                                    >
                                                        {stickers.map(sticker => (
                                                            <button
                                                                key={sticker.id}
                                                                type="button"
                                                                onClick={() => handleSendSticker(sticker)}
                                                                className={`h-14 flex items-center justify-center text-3xl rounded-2xl transition-all hover:scale-110 active:scale-95 ${sticker.color} dark:bg-slate-800`}
                                                                title={sticker.label}
                                                            >
                                                                {sticker.emoji}
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <motion.button
                                            type="submit"
                                            disabled={!inputValue.trim()}
                                            whileHover={inputValue.trim() ? { scale: 1.05 } : {}}
                                            whileTap={inputValue.trim() ? { scale: 0.95 } : {}}
                                            className="w-14 h-14 bg-primary text-white rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 disabled:opacity-50 disabled:grayscale transition-all"
                                        >
                                            <Send size={22} />
                                        </motion.button>
                                    </div>
                                </div>
                            </div>

                            {/* Push to Talk Hint */}
                            <AnimatePresence>
                                {isRecording && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute bottom-20 left-4 text-[10px] font-black text-accent bg-accent/10 px-4 py-2 rounded-full border border-accent/20 flex items-center gap-2"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-accent animate-ping"></div>
                                        AUDIO LISTENING... HOLD TO SPEAK
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </div>
                </div>
            </div>

            {/* Background Blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-30 dark:opacity-20">
                <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-blob delay-1000"></div>
            </div>
        </div>
    );
};

export default GroupChatPage;
