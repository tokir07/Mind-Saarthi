import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Activity, Moon, Sun, Brain } from 'lucide-react';
import api from '../api';
import LogoImg from '../assets/mind-saarthi-logo.png';

const DashboardPage = ({ darkMode, toggleTheme }) => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchDashboard = async () => {
            try {
                const res = await api.get('/dashboard');
                setDashboardData(res.data);
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [token, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    const { name, latest_risk, mood_history } = dashboardData || { name: user?.name, latest_risk: 'Low', mood_history: [] };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white pb-20">
            {/* Header */}
            <header className="glass shadow-sm py-4 sticky top-0 z-50">
                <div className="container mx-auto px-6 max-w-6xl flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={LogoImg} alt="Mind Saarthi Logo" className="h-10 w-auto object-contain" />
                    </Link>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 py-1.5 px-3 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                            <span className="text-sm font-semibold truncate max-w-[100px] sm:max-w-none">{name}</span>
                            <button onClick={handleLogout} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-full transition-colors cursor-pointer" aria-label="Logout">
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 max-w-6xl mt-12">
                <div className="mb-10 animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-extrabold mb-2 tracking-tight">Welcome back, {name?.split(' ')[0]} 👋</h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400">Here's your emotional wellness overview.</p>
                    </div>
                    <Link to="/chat">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-primary hover:bg-primary-light text-white font-bold py-3.5 px-8 rounded-xl shadow-[0_4px_20px_rgba(23,93,197,0.4)] transition-all flex items-center justify-center gap-2"
                        >
                            <Brain size={20} />
                            Start New Session
                        </motion.button>
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Current Status Card */}
                    <div className="md:col-span-1 glass-card p-6 rounded-3xl relative overflow-hidden flex flex-col h-full bg-white dark:bg-slate-900">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <Activity size={100} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-2 z-10">
                            Current Risk Assessment
                        </h3>
                        <div className="flex-1 flex flex-col items-center justify-center py-6 z-10">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className={`w-32 h-32 rounded-full flex items-center justify-center border-8 shadow-xl mb-4 ${latest_risk === 'High' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600' :
                                        latest_risk === 'Moderate' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600' :
                                            'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                                    }`}
                            >
                                <span className="text-2xl font-black uppercase tracking-wider">{latest_risk}</span>
                            </motion.div>
                            <p className="text-center text-slate-600 dark:text-slate-400 font-medium px-4">
                                {latest_risk === 'High' ? 'We recommend speaking to a professional.' :
                                    latest_risk === 'Moderate' ? 'You seem to be experiencing some stress.' :
                                        'Your emotional state appears stable.'}
                            </p>
                        </div>
                    </div>

                    {/* Basic Mood History Chart */}
                    <div className="md:col-span-2 glass-card p-6 rounded-3xl flex flex-col h-full bg-white dark:bg-slate-900">
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-2">
                            Recent Chat History
                        </h3>
                        <div className="flex-1 overflow-x-auto pb-4">
                            {mood_history && mood_history.length > 0 ? (
                                <div className="min-w-[400px] h-full flex items-end justify-between gap-4 px-4 pt-10">
                                    {mood_history.slice(-10).map((record, index) => {
                                        // simple bar height calculation
                                        const height = record.risk === 'High' ? '90%' : record.risk === 'Moderate' ? '60%' : '30%';
                                        const color = record.risk === 'High' ? 'bg-red-500' : record.risk === 'Moderate' ? 'bg-orange-500' : 'bg-emerald-500';

                                        return (
                                            <div key={index} className="flex flex-col items-center gap-3 w-full group relative">
                                                {/* Tooltip */}
                                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none">
                                                    {record.sentiment} ({record.risk})
                                                </div>
                                                {/* Bar */}
                                                <div className="w-full max-w-[40px] h-[150px] bg-slate-100 dark:bg-slate-800 rounded-t-lg overflow-hidden flex items-end justify-center">
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height }}
                                                        transition={{ duration: 0.5, delay: index * 0.05 }}
                                                        className={`w-full rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity ${color}`}
                                                    ></motion.div>
                                                </div>
                                                <span className="text-[10px] font-medium text-slate-500 truncate w-full text-center">{record.timestamp}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 min-h-[200px]">
                                    <Activity size={48} className="opacity-20" />
                                    <p>No chat history available. Start a new session!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
