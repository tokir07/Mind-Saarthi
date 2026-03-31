import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Heart, Sparkles, MessageSquare, Shield, Activity } from 'lucide-react';

const ChatSidebar = ({ user, stats }) => {
    const { risk = 'Low', sentiment = 'Neutral', messagesCount = 0 } = stats;

    const navItems = [
        { icon: Brain, label: 'Risk Level', value: risk, color: risk === 'High' ? 'text-accent' : 'text-primary-light' },
        { icon: Heart, label: 'Mood', value: sentiment, color: 'text-pink-400' },
        { icon: Sparkles, label: 'AI Power', value: 'Active', color: 'text-yellow-400' },
        { icon: MessageSquare, label: 'Sessions', value: messagesCount, color: 'text-blue-400' },
    ];

    return (
        <div className="w-16 md:w-64 border-r border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/30 flex flex-col items-center md:items-start p-4 space-y-8 z-20 transition-colors duration-500">
            {/* User Profile */}
            <div className="w-full flex items-center gap-3 px-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0">
                    <User size={20} />
                </div>
                <div className="hidden md:block overflow-hidden">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.name || 'User'}</h3>
                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                </div>
            </div>

            {/* Sidebar Navigation / Stats */}
            <div className="w-full space-y-3">
                {navItems.map((item, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all cursor-default group"
                    >
                        <item.icon size={18} className={`${item.color} group-hover:scale-110 transition-transform`} />
                        <div className="hidden md:block flex-1">
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{item.label}</p>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Privacy Shield */}
            <div className="mt-auto w-full pt-10 hidden md:block">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-primary/10 border border-slate-200 dark:border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Secure Session</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">Your conversation is HIPAA compliant and end-to-end encrypted.</p>
                </div>
            </div>

            {/* Emotion Pulse Card */}
            <div className="w-full hidden md:block">
                <div className="glass rounded-2xl p-4 border border-slate-200 dark:border-white/10 ring-1 ring-slate-200 dark:ring-white/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-yellow-400/20 rounded-lg">
                            <Activity size={16} className="text-yellow-400 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">LIVE ANALYSIS</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            animate={{ width: ["20%", "80%", "40%", "60%"] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            className="h-full bg-primary"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const User = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);

export default ChatSidebar;
