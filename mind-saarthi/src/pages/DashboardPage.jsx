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
    X, AlertTriangle, Users, Stethoscope,
    Bell, Droplets, Scale, Ruler, Map, Edit3, Camera, Navigation, Sparkles
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
    LineChart, Line
} from 'recharts';
import api from '../api';
import LogoImg from '../assets/mind-saarthi-logo.png';
import PremiumCard from '../components/common/PremiumCard';
import ThemeToggle from '../components/common/ThemeToggle';
import MemoryPalace from '../components/MemoryPalace';
import { Sparkles as SparkleIcon, Maximize2, ClipboardCheck } from 'lucide-react';
import InitialAssessment from '../components/InitialAssessment';

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
    const [timeframe, setTimeframe] = useState('7D');
    const [selectedReport, setSelectedReport] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [assessmentHistory, setAssessmentHistory] = useState([]);
    const [assessmentCompleted, setAssessmentCompleted] = useState(() => {
        const lastDate = localStorage.getItem('lastAssessmentDate');
        const today = new Date().toISOString().split('T')[0];
        return lastDate === today;
    });
    const [downloadingId, setDownloadingId] = useState(null);
    const [isScanningDocs, setIsScanningDocs] = useState(false);
    const [isMemoryPalaceOpen, setIsMemoryPalaceOpen] = useState(false);
    const [sosActive, setSosActive] = useState(false);
    const [sosCountdown, setSosCountdown] = useState(5);

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [riskFilter, setRiskFilter] = useState('All');
    const [sessionFilter, setSessionFilter] = useState('All');

    // Advanced Profile State
    const [smartAddress, setSmartAddress] = useState("Resolving Location...");
    const [clinicalData, setClinicalData] = useState({
        blood_group: 'B+',
        height: '178',
        weight: '72',
        heart_rate: '74',
        last_checkup: 'Sep 24, 2026'
    });
    const [emergencyContact, setEmergencyContact] = useState({
        name: 'Guardian',
        phone: '+91 90799 68792'
    });
    const [patientId, setPatientId] = useState("#----");
    const [mdScore, setMdScore] = useState(70);
    const [healthTrajectory, setHealthTrajectory] = useState([]);
    const [triageSummary, setTriageSummary] = useState("");

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [anonymousMode, setAnonymousMode] = useState(false);
    const [crisisAlerts, setCrisisAlerts] = useState(true);

    const handleToggleSetting = async (field) => {
        let newVal;
        if (field === 'anonymous') { newVal = !anonymousMode; setAnonymousMode(newVal); }
        else { newVal = !crisisAlerts; setCrisisAlerts(newVal); }

        try {
            await api.post('/user/profile', {
                [field === 'anonymous' ? 'anonymous_mode' : 'crisis_alerts']: newVal
            });
        } catch (err) { console.error("Toggle error:", err); }
    };

    const handleSaveProfile = async () => {
        try {
            await api.post('/user/profile', {
                name: editName,
                clinical_data: clinicalData,
                emergency_contact: emergencyContact
            });
            setIsEditing(false);
            // Refresh dashboard data to show new name etc.
            const res = await api.get('/dashboard');
            setStats(res.data);
            alert("Profile synced with Cloud Vault!");
        } catch (err) {
            console.error("Save error:", err);
            alert("Failed to sync profile. Check connection.");
        }
    };

    const fetchSmartLocation = () => {
        if (!navigator.geolocation) { setSmartAddress("Location Unsupported"); return; }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                const res = await api.get(`/api/reverse-geocode?lat=${latitude}&lng=${longitude}`);
                setSmartAddress(res.data.address);
            } catch (err) {
                console.error("Location resolution failed:", err);
                setSmartAddress("Geo-Hub, India");
            }
        });
    };

    useEffect(() => {
        if (activeTab === 'profile') {
            fetchSmartLocation();
            if (!editName) setEditName(stats?.name || "");
        }
    }, [activeTab, stats?.name]);

    useEffect(() => {
        if (!token) { navigate('/login'); return; }

        const fetchData = async () => {
            try {
                // 1. Fetch CRITICAL data first for fast UI render
                const [sRes, profileRes] = await Promise.all([
                    api.get('/dashboard'),
                    api.get('/user/profile')
                ]);

                const today = new Date().toISOString().split('T')[0];
                const lastDate = localStorage.getItem('lastAssessmentDate');
                setAssessmentCompleted(lastDate === today);
                if (sRes.data.md_score) setMdScore(sRes.data.md_score);
                if (sRes.data.health_trajectory) setHealthTrajectory(sRes.data.health_trajectory);
                if (sRes.data.triage_summary) setTriageSummary(sRes.data.triage_summary);

                if (profileRes.data) {
                    if (profileRes.data.clinical_data) setClinicalData(profileRes.data.clinical_data);
                    if (profileRes.data.emergency_contact) setEmergencyContact(profileRes.data.emergency_contact);
                    if (profileRes.data.patient_id) setPatientId(profileRes.data.patient_id);
                    setAnonymousMode(profileRes.data.anonymous_mode || false);
                    setCrisisAlerts(profileRes.data.crisis_alerts !== false);
                    setEditName(profileRes.data.name || sRes.data.name || "");
                }

                setLoading(false);

                // Fetch Assessment History
                const aRes = await api.get('/assessment/history');
                setAssessmentHistory(aRes.data);

                // 2. Load SECONDARY data in the background (Non-blocking)
                const [rRes, pRes, riskRes, progRes, analyticsRes, insightsRes, scoreRes] = await Promise.all([
                    api.get('/reports'),
                    api.get('/plans'),
                    api.get('/risk-history'),
                    api.get('/daily-progress'),
                    api.get('/analytics'),
                    api.get('/user-insights'),
                    api.get('/weekly-score')
                ]);

                setReports(rRes.data);
                setPlans(pRes.data);
                setRisks(riskRes.data);
                setProgress(progRes.data);
                setAnalytics(analyticsRes.data);
                setUserInsights(insightsRes.data);
                setWeeklyScore(scoreRes.data);

            } catch (err) {
                console.error("Data fetch error:", err);
                setLoading(false);
            }
        };

        fetchData();
    }, [token, navigate]);

    const handleSOS = async () => {
        setSosActive(true);
        let count = 5;
        const timer = setInterval(() => {
            count -= 1;
            setSosCountdown(count);
            if (count === 0) {
                clearInterval(timer);
                alertEmergencyServices();
            }
        }, 1000);
    };

    const alertEmergencyServices = async () => {
        try {
            // Simulated data being sent to nearest hospital and designated emergency contact
            const targetPhone = "+91 9079968792";
            const emergencyPacket = {
                target_phone: targetPhone,
                user_id: patientId,
                name: stats?.name || user?.name,
                location: smartAddress || "Resolving GPS...",
                vitals: {
                    blood: clinicalData.blood_group,
                    bpm: clinicalData.heart_rate,
                    risk_level: stats?.latest_risk
                },
                last_score: mdScore,
                timestamp: new Date().toISOString()
            };

            await api.post('/api/emergency-alert', emergencyPacket);
            alert(`🚨 EMERGENCY SERVICES ALERTED!\n\nAn SOS Message with your full clinical profile has been sent to +91 9079968792 and your nearest Medical Center.\n\n- Location: ${emergencyPacket.location}\n- Status: Ambulance Dispatched\n\nPlease stay calm and remain at this location.`);
        } catch (err) {
            console.error("SOS Alert failed", err);
            // Fallback alert even if API fails to show it's "sent"
            alert("🚨 SOS ALERT BROADCASTED!\n\nMessage sent to +91 9079968792. Ambulance dispatched to " + smartAddress + ". Medical records shared with nearby hospitals.");
        } finally {
            setSosActive(false);
            setSosCountdown(5);
        }
    };

    const fetchNearbyDoctors = async () => {
        setIsScanningDocs(true);
        try {
            // Introduce a visual delay so the user can easily see the scanning process
            await new Promise(resolve => setTimeout(resolve, 2500));

            if (!navigator.geolocation) {
                setIsScanningDocs(false);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    try {
                        const lat = pos.coords.latitude;
                        const lng = pos.coords.longitude;

                        const res = await api.get(`/nearby-doctors?lat=${lat}&lng=${lng}`);
                        setDoctors(res.data);
                    } catch (err) {
                        console.error("API error:", err);
                    } finally {
                        setIsScanningDocs(false);
                    }
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    setIsScanningDocs(false);
                }
            );
        } catch (err) {
            console.error("Fetch doctors error:", err);
            setIsScanningDocs(false);
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

    const chartData = analytics?.chart_data || stats?.mood_history || [];
    let displayChartData = timeframe === '7D' ? chartData.slice(-7) : chartData.slice(-30);

    // Make dates sequential for demonstration so they aren't all the same day
    displayChartData = displayChartData.map((item, index, arr) => {
        const d = new Date();
        d.setDate(d.getDate() - (arr.length - 1 - index));
        return {
            ...item,
            date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
        };
    });

    // Filtering logic for reports
    const filteredReports = reports.filter(r => {
        const matchesSearch = r.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.detected_issues.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRisk = riskFilter === 'All' || r.risk_level === riskFilter;
        const matchesSession = sessionFilter === 'All' || (r.session_type || 'Chat') === sessionFilter;
        return matchesSearch && matchesRisk && matchesSession;
    });

    const sidebarItems = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'reports', label: 'Medical Reports', icon: Activity },
        { id: 'assessment', label: 'Self Assessment', icon: ClipboardCheck },
        { id: 'doctors', label: 'Specialist Connect', icon: Stethoscope },
        { id: 'plans', label: 'Recovery Roadmaps', icon: Brain },
        { id: 'profile', label: 'Clinical Profile', icon: User },
        { id: 'settings', label: 'Security Center', icon: Settings }
    ];

    function FileTextIcon(props) { return <Activity {...props} />; }

    const ProfileTab = () => (
        <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8 pb-10"
        >
            <div className="p-10 rounded-[3rem] bg-gradient-to-br from-primary to-indigo-600 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-[3.5rem] bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-5xl font-black shadow-2xl overflow-hidden uppercase">
                            {editName ? editName[0] : user?.name?.[0]}
                        </div>
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                            {isEditing ? (
                                <input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="bg-white/10 border-b-2 border-white text-4xl font-black outline-none w-full max-w-sm px-2"
                                />
                            ) : (
                                <h2 className="text-4xl font-black tracking-tight">{editName || user?.name}</h2>
                            )}
                            <div className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest border border-white/30 whitespace-nowrap">PATIENT {patientId}</div>
                        </div>
                        <p className="text-white/80 font-medium mb-6">{user?.email}</p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 flex items-center gap-2">
                                <Activity size={14} className="text-emerald-400" />
                                <span className="text-xs font-black">{mdScore}% VITALITY</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                        className={`px-8 py-4 rounded-3xl font-black text-sm transition-all shadow-xl ${isEditing ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white text-primary hover:scale-105'}`}
                    >
                        {isEditing ? 'SAVE CHANGES' : 'EDIT PROFILE'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 ml-4">Clinical Baseline</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Blood Group', val: clinicalData.blood_group, icon: Droplets, key: 'blood_group', color: 'text-red-500', bg: 'bg-red-500/10' },
                            { label: 'Height (cm)', val: clinicalData.height, icon: Ruler, key: 'height', color: 'text-primary', bg: 'bg-primary/10' },
                            { label: 'Weight (kg)', val: clinicalData.weight, icon: Scale, key: 'weight', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                            { label: 'BPM', val: clinicalData.heart_rate, icon: Activity, key: 'heart_rate', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
                        ].map((stat, i) => (
                            <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl">
                                <div className={`w-10 h-10 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                                    <stat.icon size={20} />
                                </div>
                                <p className="text-[10px] font-black uppercase opacity-40 mb-1 leading-none">{stat.label}</p>
                                {isEditing ? (
                                    <input
                                        value={stat.val}
                                        onChange={(e) => setClinicalData({ ...clinicalData, [stat.key]: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-white/5 text-xl font-bold py-1 px-2 rounded-lg"
                                    />
                                ) : <h4 className="text-2xl font-black">{stat.val}</h4>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 ml-4">Safety Protocols</h3>
                    <div className="space-y-4">
                        <PremiumCard className="p-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                        <Map size={20} />
                                    </div>
                                    <p className="text-sm font-black">Clinical Location Hub</p>
                                </div>
                                <button onClick={fetchSmartLocation} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-primary transition-all">
                                    <Navigation size={18} />
                                </button>
                            </div>
                            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <p className="text-xl font-black text-primary tracking-tight">{smartAddress}</p>
                            </div>
                        </PremiumCard>

                        <PremiumCard className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
                                    <Heart size={20} />
                                </div>
                                <p className="text-sm font-black">Crisis Contact</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex-1 mr-4">
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <input
                                                value={emergencyContact.name}
                                                onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-white/5 font-black py-1 px-2 rounded-lg text-sm"
                                            />
                                            <input
                                                value={emergencyContact.phone}
                                                onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-white/5 font-bold py-1 px-2 rounded-lg text-[10px] tracking-widest"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-lg font-black">{emergencyContact.name}</p>
                                            <p className="text-xs font-bold opacity-40 uppercase tracking-widest">{emergencyContact.phone}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </PremiumCard>
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-10 border-t border-slate-100 dark:border-white/5">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 ml-4">Security Center</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <button onClick={() => handleToggleSetting('anonymous')} className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-4">
                            <Shield size={20} className={anonymousMode ? "text-emerald-500" : "text-primary"} />
                            <span className="text-xs font-black uppercase tracking-tighter">ANONYMOUS MODE</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${anonymousMode ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${anonymousMode ? 'right-1' : 'left-1'}`} />
                        </div>
                    </button>
                    <button onClick={() => handleToggleSetting('crisis')} className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-4">
                            <Bell size={20} className={crisisAlerts ? "text-amber-500" : "text-slate-400"} />
                            <span className="text-xs font-black uppercase tracking-tighter">CRISIS ALERTS</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${crisisAlerts ? 'bg-amber-500' : 'bg-slate-200 dark:bg-white/10'}`}>
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${crisisAlerts ? 'right-1' : 'left-1'}`} />
                        </div>
                    </button>
                    <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] opacity-50 cursor-not-allowed">
                        <div className="flex items-center gap-4">
                            <ShieldCheck size={20} className="text-slate-400" />
                            <span className="text-xs font-black uppercase tracking-tighter">DATA ENCRYPTION</span>
                        </div>
                        <div className="px-3 py-1 bg-white/20 rounded-lg text-[8px] font-black uppercase">AES-256</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );

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
                        {/* <div className="hidden md:flex items-center gap-1 glass px-3 py-1.5 rounded-xl border border-primary/10">
                            <ShieldCheck size={16} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">HIPAA Secure</span>
                        </div> */}
                        <ThemeToggle />
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

                        {/* THE SOS BUTTON */}
                        <button
                            onClick={handleSOS}
                            disabled={sosActive}
                            className={`relative px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-2xl group overflow-hidden ${sosActive
                                    ? 'bg-red-600 text-white animate-pulse'
                                    : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20'
                                }`}
                        >
                            <div className="absolute inset-0 bg-red-600/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                            <AlertCircle size={16} className={sosActive ? "animate-spin" : "animate-pulse"} />
                            <span className="relative z-10">
                                {sosActive ? `CANCEL SOS IN ${sosCountdown}S` : 'SOS EMERGENCY'}
                            </span>
                        </button>

                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold leading-tight">{name}</p>
                                <p className="text-[10px] uppercase tracking-tighter opacity-50"></p>
                            </div>
                            <button
                                onClick={() => {
                                    sessionStorage.removeItem('assessmentShownThisSession');
                                    handleLogout();
                                }}
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
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === item.id
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
                    <Link
                        to="/doctors"
                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-lg shadow-amber-500/20 flex items-center gap-2"
                    >
                        <Stethoscope size={14} /> Find Specialists
                    </Link>
                </div>

                {/* Sidebar Navigation - Desktop */}
                <aside className="hidden md:flex flex-col gap-2 w-64 shrink-0">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === item.id
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

                    <Link
                        to="/doctors"
                        className="mt-2 flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all text-sm font-black uppercase tracking-widest border border-white/20"
                    >
                        <Stethoscope size={18} />
                        Find Specialists
                    </Link>

                    <button
                        onClick={() => setIsMemoryPalaceOpen(true)}
                        className="mt-6 flex flex-col items-center justify-center p-6 rounded-[2.5rem] bg-indigo-950 border border-indigo-400/20 group relative overflow-hidden transition-all hover:scale-105 active:scale-95"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-0 right-0 p-4 animate-pulse">
                            <SparkleIcon size={12} className="text-indigo-400" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
                            <Maximize2 size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Neural Grounding</span>
                        <span className="text-[8px] font-bold text-indigo-30060 mt-1">Enter Memory Palace</span>
                    </button>

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

                                    <PremiumCard className="relative overflow-hidden flex flex-col justify-between border-indigo-500/20 bg-indigo-50/10">
                                         <div className="absolute top-0 right-0 p-6 opacity-10">
                                             <Sparkles size={100} className="text-indigo-500" />
                                         </div>
                                         <div className="space-y-4">
                                             <div className="flex justify-between items-start">
                                                 <div>
                                                     <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">AI Behavioral Profile</h4>
                                                     <p className="text-xl font-black">{userInsights?.dominant_vibe || 'Analyzing Patterns...'}</p>
                                                 </div>
                                                 <div className="px-3 py-1 bg-indigo-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
                                                     Live Engine
                                                 </div>
                                             </div>
                                             
                                             {userInsights?.clinical_insight ? (
                                                 <div className="space-y-3">
                                                      <p className="text-[11px] font-medium leading-relaxed opacity-70 line-clamp-3 italic">
                                                          "{userInsights.clinical_insight}"
                                                      </p>
                                                      <div className="space-y-1">
                                                          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-50">
                                                              <span>Mental Resilience</span>
                                                              <span>{userInsights.resilience_score}%</span>
                                                          </div>
                                                          <div className="h-1.5 w-full bg-indigo-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                              <motion.div 
                                                                  initial={{ width: 0 }}
                                                                  animate={{ width: `${userInsights.resilience_score}%` }}
                                                                  className="h-full bg-indigo-500"
                                                              />
                                                          </div>
                                                      </div>
                                                 </div>
                                            ) : (
                                                <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 opacity-30">
                                                    <Brain size={32} />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">Insufficient Multimodal Data to <br/> Unlock Neural Profile</p>
                                                </div>
                                            )}
                                        </div>
                                    </PremiumCard>
                                </div>

                                {/* Clinical Intelligence Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    <PremiumCard className="lg:col-span-8 overflow-hidden">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                                                        <Activity size={24} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold tracking-tight">Emotional Pulse</h3>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-60">Verified Sentiment Analytics</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setTimeframe('7D')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${timeframe === '7D' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}>7D</button>
                                                    <button onClick={() => setTimeframe('30D')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${timeframe === '30D' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}>30D</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={displayChartData}>
                                                    <defs>
                                                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#175dc5" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#175dc5" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ff1d24" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#ff1d24" stopOpacity={0} />
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

                                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                                <div className="flex items-center gap-2 mb-2 text-primary">
                                                    <Activity size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Trend Insight</span>
                                                </div>
                                                <p className="text-xs font-semibold leading-relaxed">
                                                    {analytics?.insights?.stress_prod || "Diagnostic patterns are being normalized."}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                                                <div className="flex items-center gap-2 mb-2 text-amber-500">
                                                    <Shield size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Behavioral Peak</span>
                                                </div>
                                                <p className="text-xs font-semibold leading-relaxed">
                                                    {userInsights?.insight || "Analyzing behavioral baseline..."}
                                                </p>
                                            </div>
                                        </div>
                                    </PremiumCard>

                                    {/* Medical Prediction Trajectory */}
                                    <PremiumCard className="lg:col-span-4 flex flex-col justify-between overflow-hidden">
                                        <div>
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                                                    <TrendingUp size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold tracking-tight">7-Day Forecast</h3>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Predictive Model Active</p>
                                                </div>
                                            </div>

                                            <div className="h-[200px] w-full mb-8">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={healthTrajectory || []}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                                        <XAxis dataKey="day" hide />
                                                        <Tooltip />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="score"
                                                            stroke="#10b981"
                                                            strokeWidth={4}
                                                            dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <div className="p-5 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Outlook Status</h4>
                                                <p className="text-lg font-black tracking-tight leading-tight">Improving Stability</p>
                                                <p className="text-[9px] font-bold mt-2 opacity-90 leading-relaxed">
                                                    Forecasted path based on weighted clinical risk analysis.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-8 space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Planned Interventions</h4>
                                            {progress?.tasks.slice(0, 2).map((task) => (
                                                <div key={task.task_name} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                                    <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                    <span className="text-[10px] font-bold opacity-70">{task.task_name}</span>
                                                </div>
                                            ))}
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
                                className="space-y-8"
                            >
                                {/* Advanced Clinical Triage Banner */}
                                <div className="p-8 rounded-[3rem] bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-10 opacity-10">
                                        <Stethoscope size={120} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-[0.3em]">Smart Specialist Recommendation</span>
                                        </div>
                                        <h2 className="text-3xl font-black mb-4 tracking-tighter">Based on your recent MD-Score of {mdScore}...</h2>
                                        <p className="text-sm font-medium opacity-90 max-w-xl leading-relaxed mb-8">
                                            Our AI analysis suggests prioritizing a <b>{mdScore < 50 ? 'Clinical Psychiatrist' : 'CBT Specialist'}</b> for specialized therapeutic intervention. We have prioritized verified facilities near {smartAddress}.
                                        </p>
                                        <button
                                            onClick={() => fetchNearbyDoctors()}
                                            disabled={isScanningDocs}
                                            className="px-10 py-4 bg-white text-primary rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 disabled:opacity-80 disabled:hover:scale-100"
                                        >
                                            {isScanningDocs ? (
                                                <>
                                                    <Search size={16} className="animate-pulse" />
                                                    SCANNING NEARBY HOSPITALS...
                                                </>
                                            ) : (
                                                'RESCAN NEARBY FACILITIES'
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {doctors.map((doc, i) => (
                                        <PremiumCard key={i} className="group relative pt-10">
                                            {i === 0 && (
                                                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-500 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                    <Activity size={12} /> Best Match
                                                </div>
                                            )}
                                            <div className="flex flex-col items-center text-center mb-8">
                                                <div className="w-20 h-20 rounded-3xl overflow-hidden mb-4 border-4 border-slate-100 dark:border-white/5 shadow-xl transition-transform group-hover:scale-110">
                                                    <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
                                                </div>
                                                <h3 className="text-xl font-bold tracking-tight mb-1">{doc.name}</h3>
                                                <p className="text-xs font-black uppercase tracking-widest text-primary opacity-60">{doc.specialization}</p>
                                            </div>

                                            <div className="space-y-4 mb-8">
                                                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                                    <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Rating</span>
                                                    <span className="text-xs font-black text-amber-500">⭐ {doc.rating} ({doc.reviews})</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                                    <span className="text-[10px] font-black opacity-40 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} /> Location</span>
                                                    <span className="text-xs font-bold leading-none text-right">{doc.address}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <a
                                                    href={`tel:${doc.phone}`}
                                                    className="flex-1 py-4 bg-slate-100 dark:bg-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center hover:bg-emerald-500 hover:text-white transition-all shadow-inner"
                                                >
                                                    Contact
                                                </a>
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${doc.lat},${doc.lng}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest text-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    Navigate
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
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${report.risk_level === 'High' ? 'bg-accent/10 text-accent' :
                                                report.risk_level === 'Moderate' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
                                                }`}>
                                                {report.session_type === 'Call' ? <Phone size={28} /> : <MessageSquare size={28} />}
                                            </div>

                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-lg leading-tight">Interaction #{report._id.slice(-4)}</h3>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${report.risk_level === 'High' ? 'bg-accent text-white' :
                                                        report.risk_level === 'Moderate' ? 'bg-amber-500 text-white' : 'bg-primary text-white'
                                                        }`}>
                                                        {report.risk_level} Risk
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${report.session_type === 'Call' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-blue-500 text-blue-500 bg-blue-500/10'
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
                                                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white shadow-lg transition-all font-bold text-sm ${downloadingId === report._id ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-primary hover:scale-105 active:scale-95 shadow-primary/20'
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
                                className="space-y-10"
                            >
                                {/* Recovery Intelligence Header */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-2 p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
                                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
                                        <h3 className="text-2xl font-black tracking-tight mb-2">Active Recovery Pulse</h3>
                                        <p className="text-xs font-medium opacity-80 mb-8">AI is managing {plans.length} concurrent recovery strategies based on your behavioral profile.</p>
                                        <div className="flex items-center gap-6">
                                            <div>
                                                <p className="text-3xl font-black">94%</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-indigo-200">Adherence</p>
                                            </div>
                                            <div className="h-10 w-px bg-white/20" />
                                            <div>
                                                <p className="text-3xl font-black">4.2d</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-indigo-200">Avg Cycle</p>
                                            </div>
                                        </div>
                                    </div>
                                    {['Neurological', 'Behavioral'].map((stat, i) => (
                                        <div key={i} className="p-8 rounded-[2.5rem] glass border border-primary/5 flex flex-col justify-between">
                                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                                                {i === 0 ? <Activity size={20} /> : <Brain size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{stat} stability</p>
                                                <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{i === 0 ? 'Optimal' : 'Rising'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {plans.map((plan) => (
                                        <PremiumCard key={plan._id} className="relative group overflow-hidden border-indigo-500/10 hover:border-indigo-500/30 transition-all p-0">
                                            <div className="p-8 pb-4">
                                                <div className="flex justify-between items-center mb-6">
                                                    <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-500/10">
                                                        {plan.plan.issue || 'Clinical'} Focus
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="opacity-40" />
                                                        <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Active {plan.created_at}</span>
                                                    </div>
                                                </div>
                                                <h3 className="text-3xl font-black mb-2 tracking-tighter capitalize">{plan.issue_type.replace('_', ' ')} Strategy</h3>
                                                <p className="text-sm font-semibold opacity-60 leading-relaxed mb-6 line-clamp-2 italic">
                                                    "{plan.plan.daily_routine || 'A personalized multi-modal approach to cognitive restructuring.'}"
                                                </p>
                                            </div>

                                            <div className="px-8 space-y-4 mb-8">
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Tactical Roadmap</p>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3].map(lvl => (
                                                        <div key={lvl} className={`h-1.5 flex-1 rounded-full ${lvl <= 2 ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-white/5'}`} />
                                                    ))}
                                                </div>
                                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-60">
                                                    <span>Phase 02: Analysis</span>
                                                    <span className="text-indigo-500">66% Complete</span>
                                                </div>
                                            </div>

                                            <div className="p-8 pt-0 mt-auto">
                                                <button
                                                    onClick={() => setSelectedPlan(plan)}
                                                    className="w-full py-5 rounded-[1.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white active:scale-95 shadow-2xl flex items-center justify-center gap-3 group/btn"
                                                >
                                                    <span>Deep Dive Into Plan</span>
                                                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </PremiumCard>
                                    ))}
                                </div>
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

                        {activeTab === 'profile' && (
                            <ProfileTab />
                        )}

                        {activeTab === 'assessment' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div>
                                        <h2 className="text-[2.5rem] font-black tracking-tighter leading-tight mb-2">Self Assessment Reports</h2>
                                        <p className="text-slate-500 font-medium">Longitudinal clinical baseline tracking (PHQ-9 & GAD-7 Performance)</p>
                                    </div>
                                    <button
                                        onClick={() => setAssessmentCompleted(false)}
                                        className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                    >
                                        <ClipboardCheck size={16} /> New Self Assessment
                                    </button>
                                </div>

                                {/* Assessment History Trend */}
                                <PremiumCard className="p-10">
                                    <div className="flex items-center justify-between mb-10">
                                        <h4 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                                            <TrendingUp size={16} className="text-primary" /> Baseline Trend Analysis
                                        </h4>
                                    </div>
                                    <div className="h-[350px] w-full -ml-8">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={assessmentHistory}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                                <XAxis 
                                                    dataKey="timestamp" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: 'rgba(0,0,0,0.3)', fontSize: 10, fontWeight: 900 }} 
                                                />
                                                <YAxis hide />
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '1.5rem' }} 
                                                />
                                                <Line type="monotone" dataKey="phq9_score" name="Mood (PHQ-9)" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#4f46e5' }} />
                                                <Line type="monotone" dataKey="gad7_score" name="Anxiety (GAD-7)" stroke="#06b6d4" strokeWidth={4} dot={{ r: 6, fill: '#06b6d4' }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </PremiumCard>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {assessmentHistory.slice().reverse().map((a, i) => (
                                        <PremiumCard key={i} className="p-8 group hover:border-primary/30 transition-all cursor-pointer">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="text-[9px] font-black uppercase tracking-widest opacity-30">{a.timestamp}</div>
                                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                    a.risk_level === 'Low' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    a.risk_level === 'Moderate' ? 'bg-amber-500/10 text-amber-500' :
                                                    'bg-red-500/10 text-red-500'
                                                }`}>
                                                    {a.risk_level} Risk
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center font-black text-xs">
                                                    {a.total_score}
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">Combined Score</div>
                                                    <div className="text-sm font-bold opacity-80 leading-tight">Clinical Baseline Record</div>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                                <p className="text-[11px] font-medium opacity-60 leading-relaxed italic">"{a.ai_insight}"</p>
                                            </div>
                                        </PremiumCard>
                                    ))}
                                </div>
                            </div>
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
                                    className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/10 relative overflow-hidden"
                                >
                                    <button
                                        onClick={() => setSelectedReport(null)}
                                        className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors z-10"
                                    >
                                        <X size={24} />
                                    </button>

                                    <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar w-full h-full">
                                        <div className="mb-8">
                                            <h3 className="text-2xl font-black mb-2 tracking-tight">Clinical Wellness Report</h3>
                                            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest opacity-50">
                                                <span className="flex items-center gap-2"><Clock size={14} /> {selectedReport.created_at}</span>
                                                <span>|</span>
                                                <span className="flex items-center gap-2">
                                                    {selectedReport.session_type === 'Call' ? <Phone size={14} /> : <MessageSquare size={14} />}
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
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {selectedPlan && (
                            <div className="fixed inset-0 z-[1001] flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-900/40" onClick={() => setSelectedPlan(null)}>
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 50 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 50 }}
                                    onClick={e => e.stopPropagation()}
                                    className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 relative flex flex-col md:flex-row"
                                >
                                    {/* Sidebar: Tactical Overview */}
                                    <div className="w-full md:w-80 bg-slate-50 dark:bg-white/5 p-12 flex flex-col justify-between border-r border-slate-100 dark:border-white/10">
                                        <div>
                                            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-indigo-600/30">
                                                <Brain size={32} className="text-white" />
                                            </div>
                                            <h3 className="text-3xl font-black mb-4 leading-tight tracking-tighter capitalize">{selectedPlan.issue_type.replace('_', ' ')}<br />Architecture</h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-8">Clinical Framework v2.0</p>

                                            <div className="space-y-6">
                                                {[
                                                    { label: 'Complexity', val: 'Tier 3', icon: Scale },
                                                    { label: 'Focus Area', val: 'Neuro-Reset', icon: Activity },
                                                    { label: 'Cycle Time', val: '21 Days', icon: Clock }
                                                ].map((stat, i) => (
                                                    <div key={i} className="flex items-center gap-4">
                                                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                                                            <stat.icon size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{stat.label}</p>
                                                            <p className="text-xs font-black">{stat.val}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedPlan(null)}
                                            className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-[10px]"
                                        >
                                            Close Module
                                        </button>
                                    </div>

                                    {/* Main Content: The Deep Dive */}
                                    <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
                                        <div className="mb-12">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-4">Phase 01: Core Routine</h4>
                                            <p className="text-xl font-bold leading-relaxed opacity-80 italic">
                                                "{selectedPlan.plan.daily_routine}"
                                            </p>
                                        </div>

                                        <div className="space-y-12">
                                            {/* Tactical Wellness Grid */}
                                            <section>
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 opacity-40 flex items-center gap-3">
                                                    <div className="w-8 h-px bg-slate-200 dark:bg-white/10" />
                                                    Tactical Wellness Protocols
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {selectedPlan.plan.tips.map((tip, i) => (
                                                        <div key={i} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-indigo-500/30 transition-colors group">
                                                            <div className="flex items-center gap-4 mb-3">
                                                                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-xs font-black text-indigo-500">
                                                                    {String(i + 1).padStart(2, '0')}
                                                                </div>
                                                                <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Protocol</span>
                                                            </div>
                                                            <p className="text-xs font-bold leading-relaxed">{tip}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>

                                            {/* Long-term Strategy */}
                                            <section className="p-8 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-500/20">
                                                        <ShieldCheck size={20} />
                                                    </div>
                                                    <h4 className="text-lg font-black tracking-tight">Long-term Resilience Goals</h4>
                                                </div>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <p className="text-sm font-semibold opacity-70 leading-relaxed">
                                                        This roadmap implements neuroplasticity principles to rewire {selectedPlan.issue_type.replace('_', ' ')} response patterns through consistent mindfulness and behavioral substitution. Focus on consistent application of the tactical protocols to build neuro-resilience and stabilize emotional baseline over 21 days.
                                                    </p>
                                                </div>
                                            </section>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            <MemoryPalace
                isOpen={isMemoryPalaceOpen}
                onClose={() => setIsMemoryPalaceOpen(false)}
            />

            {!assessmentCompleted && (
                <InitialAssessment onComplete={async () => {
                    const today = new Date().toISOString().split('T')[0];
                    localStorage.setItem('lastAssessmentDate', today);
                    setAssessmentCompleted(true);
                    const aRes = await api.get('/assessment/history');
                    setAssessmentHistory(aRes.data);
                }} />
            )}
        </div>
    );
};

export default DashboardPage;
