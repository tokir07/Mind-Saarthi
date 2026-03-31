import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogOut, Activity, Brain, TrendingUp, Calendar, 
  MessageSquare, ShieldAlert, Heart, ChevronRight,
  LayoutDashboard, Settings, User, Download, Eye,
  CheckCircle2, Circle, AlertCircle, MapPin, Phone,
  Search, Filter, ArrowUpRight, Clock, ShieldCheck, Shield,
  X, AlertTriangle, Users
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import api from '../api';
import LogoImg from '../assets/mind-saarthi-logo.png';
import PremiumCard from '../components/common/PremiumCard';
import ThemeToggle from '../components/common/ThemeToggle';

const DashboardPage = () => {
    const { user, token, logout } = useAuth();
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    
    // Core Dashboard State
    const [doctors, setDoctors] = useState([]);
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [plans, setPlans] = useState([]);
    const [risks, setRisks] = useState([]);
    const [progress, setProgress] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [userInsights, setUserInsights] = useState(null);
    const [weeklyScore, setWeeklyScore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedReport, setSelectedReport] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    
    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState('All');
    const [sessionFilter, setSessionFilter] = useState('All');

    useEffect(() => {
        if (!token) { navigate('/login'); return; }

        const fetchData = async () => {
            try {
                const [sRes, rRes, pRes, riskRes, progRes, analyticsRes, insightsRes, scoreRes] = await Promise.all([
                    api.get('/dashboard'),
                    api.get('/reports'),
                    api.get('/plans'),
                    api.get('/risk-history'),
                    api.get('/daily-progress'),
                    api.get('/analytics'),
                    api.get('/user-insights'),
                    api.get('/weekly-score')
                ]);
                
                setStats(sRes.data);
                setReports(rRes.data);
                setPlans(pRes.data);
                setRisks(riskRes.data);
                setProgress(progRes.data);
                setAnalytics(analyticsRes.data);
                setUserInsights(insightsRes.data);
                setWeeklyScore(scoreRes.data);
            } catch (err) {
                console.error("Data fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, navigate]);

    const fetchNearbyDoctors = async () => {
    try {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            const res = await api.get(`/nearby-doctors?lat=${lat}&lng=${lng}`);
            setDoctors(res.data);
        });
    } catch (err) {
        console.error(err);
    }
};

    const handleLogout = () => { logout(); navigate('/'); };

    const handleMarkTask = async (taskName, currentStatus) => {
        try {
            await api.post('/mark-task', { task_name: taskName, completed: !currentStatus });
            // Refresh progress
            const res = await api.get('/daily-progress');
            setProgress(res.data);
        } catch (err) { console.error(err); }
    };

    const downloadPDF = async (reportId) => {
        setDownloadingId(reportId);
        try {
            const response = await api.get(`/download-report/${reportId}`, { responseType: 'blob' });
            
            // Check if it's an error formatted as a blob (fallback check)
            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                throw new Error("Backend error: " + text);
            }
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `MindSaarthi_Report_${reportId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { 
            console.error("PDF Download error:", err); 
            alert("Failed to download PDF. The backend service may be down or the report is invalid.");
        } finally {
            setDownloadingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <motion.div 
                   animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                   className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full"
                />
            </div>
        );
    }

    const name = stats?.name || user?.name || "User";
    const mentalHealthScore = weeklyScore?.score || 72; 
    const moodStatus = weeklyScore?.status || "Analyzing";

    // Filtering logic for reports
    const filteredReports = reports.filter(r => {
        const matchesSearch = r.summary.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              r.detected_issues.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRisk = riskFilter === 'All' || r.risk_level === riskFilter;
        const matchesSession = sessionFilter === 'All' || (r.session_type || 'Chat') === sessionFilter;
        return matchesSearch && matchesRisk && matchesSession;
    });

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'group', label: 'Group Chat', icon: Users },
        { id: 'reports', label: 'Session Reports', icon: FileTextIcon },
        { id: 'plans', label: 'Recovery Plans', icon: Brain },
        { id: 'risk', label: 'Risk History', icon: ShieldAlert },
        { id: 'doctors', label: 'Doctors', icon: MapPin },
        { id: 'profile', label: 'Profile Settings', icon: User },
    ];

    function FileTextIcon(props) { return <Activity {...props} />; }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-white transition-colors duration-500 flex flex-col">
            {/* Background Blobs */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="bg-blob w-[800px] h-[800px] bg-primary/5 -top-40 -left-40 blur-[150px]" />
                <div className="bg-blob w-[600px] h-[600px] bg-accent/5 -bottom-20 -right-20 blur-[120px] delay-1000" />
            </div>

            {/* Header */}
            <header className="glass shadow-sm py-4 sticky top-0 z-50 border-b border-white/10">
                <div className="container mx-auto px-6 max-w-7xl flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 hover:scale-105 transition-transform">
                        <img src={LogoImg} alt="Mind Saarthi" className="h-10 w-auto" />
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-1 glass px-3 py-1.5 rounded-xl border border-primary/10">
                            <ShieldCheck size={16} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">HIPAA Secure</span>
                        </div>
                        <ThemeToggle />
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold leading-tight">{name}</p>
                                <p className="text-[10px] uppercase tracking-tighter opacity-50">Premium Member</p>
                            </div>
                            <button 
                                onClick={handleLogout} 
                                className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all active:scale-90"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 max-w-7xl py-12 flex-1 flex flex-col md:flex-row gap-8">
                {/* Mobile Tab switcher */}
                <div className="md:hidden flex overflow-x-auto gap-2 pb-4 scrollbar-hide">
                   {sidebarItems.map((item) => (
                       <button
                           key={item.id}
                           onClick={() => setActiveTab(item.id)}
                           className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                               activeTab === item.id 
                               ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                               : 'bg-white/50 dark:bg-white/5 border border-white/10'
                           }`}
                       >
                           {item.label}
                       </button>
                   ))}
                   <Link
                       to="/chat"
                       className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg shadow-primary/20 flex items-center gap-2"
                   >
                       <MessageSquare size={14} /> Start Chat
                   </Link>
                   <Link
                       to="/group-chat"
                       className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                   >
                       <Users size={14} /> Group Chat
                   </Link>
                   <Link
                       to="/call"
                       className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                   >
                       <Phone size={14} className="animate-pulse" /> Voice Call
                   </Link>
                </div>

                {/* Sidebar Navigation - Desktop */}
                <aside className="hidden md:flex flex-col gap-2 w-64 shrink-0">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                                activeTab === item.id 
                                ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' 
                                : 'hover:bg-primary/5 text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            <item.icon size={20} />
                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                        </button>
                    ))}

                    <Link
                        to="/chat"
                        className="mt-2 flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-primary to-blue-500 text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-sm font-black uppercase tracking-widest border border-white/20"
                    >
                        <MessageSquare size={18} />
                        Talk to Saarthi
                    </Link>

                    <Link
                        to="/group-chat"
                        className="mt-2 flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all text-sm font-black uppercase tracking-widest border border-white/20"
                    >
                        <Users size={18} />
                        Join Group Chat
                    </Link>

                    <Link
                        to="/call"
                        className="mt-2 flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all text-sm font-black uppercase tracking-widest border border-white/20"
                    >
                        <Phone size={18} className="animate-pulse" />
                        Live Voice Call
                    </Link>

                    <div className="mt-8 p-6 glass rounded-3xl border border-primary/10 relative overflow-hidden group">
                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <Brain size={32} className="text-primary mb-3" />
                        <h4 className="font-bold text-xs uppercase tracking-widest mb-1">Session Left</h4>
                        <p className="text-2xl font-black">Unlimited</p>
                        <p className="text-[10px] opacity-60 mt-2">Professional AI assistance active</p>
                    </div>
                </aside>

                {/* Main Dashboard Content */}
                <main className="flex-1 overflow-hidden min-h-[70vh]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                {/* Top Hero Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <PremiumCard className="relative overflow-hidden flex flex-col justify-between">
                                        <div className="absolute top-0 right-0 p-6 opacity-10">
                                            <Activity size={100} className="text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Mental Health Score</h4>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-black text-primary">{mentalHealthScore}</span>
                                                <span className="text-sm font-bold opacity-40">/ 100</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-500">
                                            <TrendingUp size={14} />
                                            <span>{moodStatus}</span>
                                        </div>
                                    </PremiumCard>

                                    <PremiumCard className="relative overflow-hidden flex flex-col justify-between">
                                        <div className="absolute top-0 right-0 p-6 opacity-10">
                                            <ShieldAlert size={100} className="text-accent" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Current Risk Level</h4>
                                            <p className={`text-4xl font-black uppercase ${stats?.latest_risk === 'High' ? 'text-accent' : stats?.latest_risk === 'Moderate' ? 'text-amber-500' : 'text-primary'}`}>
                                                {stats?.latest_risk || 'Low'}
                                            </p>
                                        </div>
                                        <p className="mt-4 text-[10px] font-medium opacity-60">Based on analysis of 12 patterns</p>
                                    </PremiumCard>

                                    <PremiumCard className="relative overflow-hidden flex flex-wrap justify-between gap-4">
                                        <div className="flex-1">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Daily Checklist</h4>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-black">{Math.round(progress?.progress || 0)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full mt-3 overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress?.progress}%` }}
                                                    className="h-full bg-gradient-to-r from-primary to-blue-400"
                                                />
                                            </div>
                                        </div>
                                        <Link to="/chat" className="p-3 bg-primary text-white rounded-2xl self-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-90 transition-all">
                                            <ArrowUpRight size={24} />
                                        </Link>
                                    </PremiumCard>
                                </div>

                                {/* Mood ChartSection */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <PremiumCard className="lg:col-span-2 min-h-[400px]">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h3 className="text-xl font-bold">Emotional Pulse</h3>
                                                <p className="text-xs text-slate-500">Weekly sentiment intensity overview</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">7D</button>
                                                <button className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-xs font-bold">30D</button>
                                            </div>
                                        </div>
                                        
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={analytics?.chart_data || stats?.mood_history || []}>
                                                    <defs>
                                                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#175dc5" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#175dc5" stopOpacity={0}/>
                                                        </linearGradient>
                                                        <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ff1d24" stopOpacity={0.2}/>
                                                            <stop offset="95%" stopColor="#ff1d24" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                                    <XAxis 
                                                        dataKey="date" 
                                                        axisLine={false} 
                                                        tickLine={false} 
                                                        tick={{ fontSize: 10, fontWeight: 700, fill: darkMode ? '#64748b' : '#94a3b8' }}
                                                    />
                                                    <YAxis hide domain={[0, 100]} />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: darkMode ? '#1e293b' : '#fff', 
                                                            border: 'none', 
                                                            borderRadius: '16px', 
                                                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' 
                                                        }}
                                                        itemStyle={{ fontSize: '10px', fontWeight: 800 }}
                                                    />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="mood" 
                                                        name="Mood"
                                                        stroke="#175dc5" 
                                                        strokeWidth={4}
                                                        fillOpacity={1} 
                                                        fill="url(#colorMood)" 
                                                    />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="stress" 
                                                        name="Stress"
                                                        stroke="#ff1d24" 
                                                        strokeWidth={2}
                                                        strokeDasharray="5 5"
                                                        fillOpacity={1} 
                                                        fill="url(#colorStress)" 
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Dynamic Behavioral Insights Card */}
                                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                                <div className="flex items-center gap-2 mb-2 text-primary">
                                                    <Activity size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Stress Observation</span>
                                                </div>
                                                <p className="text-xs font-semibold leading-relaxed">
                                                    {analytics?.insights?.stress_prod || "Not enough data yet. Keep chatting to surface patterns."}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                                <div className="flex items-center gap-2 mb-2 text-[#ff1d24]">
                                                    <Shield size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Behavioral Pattern</span>
                                                </div>
                                                <p className="text-xs font-semibold leading-relaxed">
                                                    {userInsights?.insight || "Analyzing your behavioral trends..."}
                                                </p>
                                            </div>
                                        </div>
                                    </PremiumCard>

                                    {/* Daily Tracker Sidebar */}
                                    <PremiumCard className="flex flex-col gap-6">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="text-primary" size={24} />
                                            <h3 className="text-xl font-bold">Today's Plan</h3>
                                        </div>
                                        
                                        <div className="space-y-4 flex-1">
                                            {progress?.tasks.map((task) => (
                                                <button
                                                    key={task.task_name}
                                                    onClick={() => handleMarkTask(task.task_name, task.completed)}
                                                    className="w-full flex items-center gap-4 p-4 rounded-2xl glass-card text-left transition-all hover:translate-x-1 group"
                                                >
                                                    {task.completed ? 
                                                        <CheckCircle2 className="text-emerald-500 shrink-0" size={20} /> : 
                                                        <Circle className="text-slate-300 dark:text-white/10 shrink-0" size={20} />
                                                    }
                                                    <span className={`text-sm font-bold tracking-tight ${task.completed ? 'opacity-40 line-through' : ''}`}>
                                                        {task.task_name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-2">Consistency Streak</p>
                                            <div className="flex gap-2">
                                                {[1,2,3,4,5,6,7].map(d => (
                                                    <div key={d} className={`h-2 flex-1 rounded-full ${d <= 4 ? 'bg-primary' : 'bg-slate-200 dark:bg-white/10'}`} />
                                                ))}
                                            </div>
                                        </div>
                                    </PremiumCard>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'doctors' && (
                            <motion.div
                                key="doctors"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-3xl font-black">Nearby Doctors</h2>

                                    <button
                                        onClick={() => fetchNearbyDoctors()}
                                        className="px-5 py-3 bg-primary text-white rounded-xl font-bold"
                                    >
                                        Use My Location
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {doctors.map((doc, i) => (
                                        <PremiumCard key={i} className="p-6 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-bold">{doc.name}</h3>
                                                    <p className="text-sm opacity-60">{doc.specialization}</p>
                                                </div>
                                                <span className="text-yellow-500 font-bold">⭐ {doc.rating}</span>
                                            </div>

                                            <div className="text-sm opacity-70 flex items-center gap-2">
                                                <MapPin size={16} /> {doc.address}
                                            </div>

                                            <div className="flex gap-3 mt-4">
                                                <a
                                                    href={`tel:${doc.phone}`}
                                                    className="flex-1 text-center py-2 bg-emerald-500 text-white rounded-lg font-bold"
                                                >
                                                    Call
                                                </a>

                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${doc.lat},${doc.lng}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 text-center py-2 bg-blue-500 text-white rounded-lg font-bold"
                                                >
                                                    Map
                                                </a>
                                            </div>
                                        </PremiumCard>
                                    ))}
                                </div>
                            </motion.div>
                        )}                       

                        {activeTab === 'reports' && (
                            <motion.div
                                key="reports"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
                                    <h2 className="text-3xl font-black tracking-tight">Session History</h2>
                                    <div className="flex gap-4 w-full md:w-auto">
                                        <div className="relative flex-1 md:w-64">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input 
                                                type="text" 
                                                placeholder="Search session insights..." 
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 rounded-2xl glass border-white/10 focus:ring-2 ring-primary/20 outline-none font-bold text-sm"
                                            />
                                        </div>
                                        <select 
                                            value={sessionFilter}
                                            onChange={(e) => setSessionFilter(e.target.value)}
                                            className="px-4 py-3 rounded-2xl glass border-white/10 outline-none font-bold text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="All">All Types</option>
                                            <option value="Call">Voice Calls</option>
                                            <option value="Chat">Text Chats</option>
                                        </select>
                                        <select 
                                            value={riskFilter}
                                            onChange={(e) => setRiskFilter(e.target.value)}
                                            className="px-4 py-3 rounded-2xl glass border-white/10 outline-none font-bold text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="All">All Risks</option>
                                            <option value="High">High Only</option>
                                            <option value="Moderate">Moderate</option>
                                            <option value="Low">Low</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {filteredReports.map((report) => (
                                        <motion.div
                                            key={report._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="group glass-card p-6 flex flex-col md:flex-row items-center gap-6 border-white/10 hover:border-primary/30 transition-all"
                                        >
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                                                report.risk_level === 'High' ? 'bg-accent/10 text-accent' : 
                                                report.risk_level === 'Moderate' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
                                            }`}>
                                                {report.session_type === 'Call' ? <Phone size={28} /> : <MessageSquare size={28} />}
                                            </div>

                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-lg leading-tight">Interaction #{report._id.slice(-4)}</h3>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                        report.risk_level === 'High' ? 'bg-accent text-white' : 
                                                        report.risk_level === 'Moderate' ? 'bg-amber-500 text-white' : 'bg-primary text-white'
                                                    }`}>
                                                        {report.risk_level} Risk
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                        report.session_type === 'Call' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-blue-500 text-blue-500 bg-blue-500/10'
                                                    }`}>
                                                        {report.session_type || 'Chat'}
                                                    </span>
                                                </div>
                                                <p className="text-sm opacity-60 font-medium line-clamp-1">{report.summary}</p>
                                                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-40">
                                                    <span className="flex items-center gap-1.5"><Clock size={12} /> {report.created_at}</span>
                                                    <span className="flex items-center gap-1.5"><Shield size={12} /> {report.detected_issues}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                                                <button 
                                                    onClick={() => setSelectedReport(report)}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-primary/10 hover:text-primary transition-all font-bold text-sm"
                                                >
                                                    <Eye size={18} /> View
                                                </button>
                                                <button 
                                                    onClick={() => downloadPDF(report._id)}
                                                    disabled={downloadingId === report._id}
                                                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white shadow-lg transition-all font-bold text-sm ${
                                                        downloadingId === report._id ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-primary hover:scale-105 active:scale-95 shadow-primary/20'
                                                    }`}
                                                >
                                                    <Download size={18} className={downloadingId === report._id ? "animate-bounce" : ""} /> 
                                                    {downloadingId === report._id ? 'Downloading...' : 'PDF'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {filteredReports.length === 0 && (
                                        <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                                            <FileTextIcon size={64} strokeWidth={1} />
                                            <p className="font-bold uppercase tracking-widest">No matching reports found</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'plans' && (
                            <motion.div
                                key="plans"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {plans.map((plan) => (
                                    <PremiumCard key={plan._id} className="relative group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                                                <Brain size={24} />
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                plan.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {plan.status}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 capitalize">{plan.issue_type.replace('_', ' ')} Strategy</h3>
                                        <p className="text-sm opacity-60 mb-6 font-medium line-clamp-2">{plan.plan.daily_routine}</p>
                                        
                                        <div className="space-y-3 mb-8">
                                            {plan.plan.tips.slice(0, 3).map((tip, i) => (
                                                <div key={i} className="flex items-center gap-3 text-xs font-bold opacity-70">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    {tip}
                                                </div>
                                            ))}
                                        </div>

                                        <button className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-white/5 font-black uppercase tracking-widest text-xs hover:bg-primary/10 hover:text-primary transition-all">
                                            Deep Dive into Plan
                                        </button>
                                    </PremiumCard>
                                ))}
                            </motion.div>
                        )}

                        {activeTab === 'risk' && (
                            <motion.div
                                key="risk"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="max-w-4xl mx-auto"
                            >
                                <div className="space-y-8 relative">
                                    <div className="absolute left-8 top-4 bottom-4 w-px bg-slate-200 dark:bg-white/10" />
                                    
                                    {risks.map((risk, index) => (
                                        <div key={risk._id} className="relative pl-20 group">
                                            <div className="absolute left-6 top-1 w-4 h-4 rounded-full bg-red-500 shadow-xl shadow-red-500/50 z-10 group-hover:scale-150 transition-transform" />
                                            
                                            <div className="glass-card p-8 border-red-500/20 group-hover:border-red-500/40 transition-all">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-xs font-black uppercase tracking-widest opacity-40">{risk.timestamp}</span>
                                                    <div className="flex gap-2">
                                                        {risk.alert_sent && <span className="p-1 px-2 rounded-md bg-accent/10 text-accent text-[8px] font-bold uppercase tracking-tighter">SMS Alert Sent</span>}
                                                        {risk.location_shared && <span className="p-1 px-2 rounded-md bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-tighter">Loc Shared</span>}
                                                    </div>
                                                </div>
                                                <p className="text-lg font-bold mb-6 text-slate-800 dark:text-red-100 italic">"{risk.user_message}"</p>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-white/10">
                                                    <div className="flex items-center gap-3 text-sm font-medium">
                                                        <MapPin size={18} className="text-blue-500" />
                                                        <span>{risk.hospital_suggested || 'Nearest Medical Center Logged'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm font-medium">
                                                        <Phone size={18} className="text-emerald-500" />
                                                        <span>{risk.doctor_contact || 'On-Call Counselor Alerted'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {risks.length === 0 && (
                                        <div className="py-20 text-center glass rounded-[2.5rem] border border-emerald-500/10 p-20 flex flex-col items-center gap-6">
                                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <ShieldCheck size={40} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black mb-2">Secure & Stable</h3>
                                                <p className="opacity-60 max-w-sm mx-auto font-medium">No high-risk events detected on your account. Your emotional guardian is continuously monitoring for safety.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        
                        {/* Profile tab ... */}
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="max-w-2xl mx-auto space-y-6"
                            >
                                <PremiumCard className="p-10 space-y-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-[2rem] bg-primary flex items-center justify-center text-white text-4xl font-black shadow-2xl">
                                            {name[0]}
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black tracking-tight">{name}</h2>
                                            <p className="opacity-60 font-medium">{user?.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-6 pt-8 border-t border-white/5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Default Location</label>
                                            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-white/10">
                                                <MapPin size={20} className="text-primary" />
                                                <span className="font-bold">New Delhi, India (Home)</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Primary Emergency Contact</label>
                                            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-white/10">
                                                <Heart size={20} className="text-accent" />
                                                <span className="font-bold">+91 999 000 1234 (Guardian)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button className="flex-1 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">Save Profile</button>
                                        <button className="flex-1 py-4 rounded-2xl border border-primary/20 text-primary font-black uppercase tracking-widest text-xs">Manage Security</button>
                                    </div>
                                </PremiumCard>
                            </motion.div>
                        )}

                        {activeTab === 'group' && (
                            <motion.div
                                key="group"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-20 text-center"
                            >
                                <div className="w-24 h-24 bg-indigo-500/10 text-indigo-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/10">
                                    <Users size={48} />
                                </div>
                                <h2 className="text-4xl font-black mb-4 tracking-tight">Community Healing</h2>
                                <p className="text-slate-500 max-w-md mx-auto mb-10 font-medium leading-relaxed">
                                    Join an anonymous peer support group matched to your current mental state. 
                                    Safety is prioritized with 24/7 AI moderation.
                                </p>
                                <Link 
                                    to="/group-chat" 
                                    className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
                                >
                                    Enter The Circle
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Report View Modal Overlay */}
                    <AnimatePresence>
                        {selectedReport && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                                onClick={() => setSelectedReport(null)}
                            >
                                <motion.div 
                                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                    onClick={e => e.stopPropagation()}
                                    className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/10 p-8 md:p-10 relative"
                                >
                                    <button 
                                        onClick={() => setSelectedReport(null)}
                                        className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>

                                    <div className="mb-8">
                                        <h3 className="text-2xl font-black mb-2 tracking-tight">Clinical Wellness Report</h3>
                                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest opacity-50">
                                            <span className="flex items-center gap-2"><Clock size={14} /> {selectedReport.created_at}</span>
                                            <span>|</span>
                                            <span className="flex items-center gap-2">
                                                {selectedReport.session_type === 'Call' ? <Phone size={14}/> : <MessageSquare size={14}/>} 
                                                {selectedReport.session_type || 'Chat'} Session
                                            </span>
                                            <span>|</span>
                                            <span className="flex items-center gap-2"><User size={14} /> ID #{selectedReport._id.slice(-6)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        {/* Executive Summary */}
                                        <div className="space-y-3">
                                            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2">
                                                <Activity size={16} /> Executive Summary
                                            </h4>
                                            <p className="text-sm font-medium leading-relaxed opacity-80 pl-2">
                                                {selectedReport.summary}
                                            </p>
                                        </div>

                                        {/* Clinical Assessment */}
                                        <div className="space-y-3">
                                            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2">
                                                <Brain size={16} /> Clinical Assessment
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4 pl-2">
                                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Risk Status</p>
                                                    <p className={`font-black text-lg ${selectedReport.risk_level === 'High' ? 'text-accent' : 'text-primary'}`}>
                                                        {selectedReport.risk_level}
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Detected Issue</p>
                                                    <p className="font-bold text-sm capitalize">
                                                        {selectedReport.detected_issues.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recommendations */}
                                        <div className="space-y-3">
                                            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2">
                                                <ShieldAlert size={16} /> AI-Driven Recommendations
                                            </h4>
                                            <div className="pl-2 space-y-3 opacity-80">
                                                {selectedReport.recommendations.split('\n').map((line, idx) => (
                                                    line.trim() ? (
                                                        <div key={idx} className="flex gap-3 text-sm font-medium">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                                            <p className="leading-relaxed">{line.replace(/^- /, '')}</p>
                                                        </div>
                                                    ) : null
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-10 pt-6 border-t border-slate-100 dark:border-white/10 flex justify-between items-center">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 text-center w-full">CONFIDENTIAL MINDSAARTHI RECORD</p>
                                        <button 
                                            onClick={() => { downloadPDF(selectedReport._id); setSelectedReport(null); }}
                                            className="px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shrink-0 ml-4 flex items-center gap-2"
                                        >
                                            <Download size={14} /> Export PDF
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default DashboardPage;
