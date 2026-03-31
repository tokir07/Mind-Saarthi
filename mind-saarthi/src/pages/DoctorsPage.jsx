import React, { useEffect, useState, useMemo } from "react";
import api from "../api";
import { 
    Phone, 
    MapPin, 
    Star, 
    Search, 
    Filter, 
    Calendar, 
    ArrowRight, 
    Heart, 
    ShieldCheck,
    Navigation,
    Award,
    Stethoscope,
    ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const DoctorsPage = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSpecialty, setSelectedSpecialty] = useState("All");
    const [hoveredDoctor, setHoveredDoctor] = useState(null);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/doctors");
            setDoctors(res.data);
        } catch (err) {
            console.error("Error fetching doctors:", err);
        } finally {
            setLoading(false);
        }
    };

    const specialties = ["All", ...new Set(doctors.map(d => d.specialization))];

    const filteredDoctors = useMemo(() => {
        return doctors.filter(doc => {
            const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                doc.specialization.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSpecialty = selectedSpecialty === "All" || doc.specialization === selectedSpecialty;
            return matchesSearch && matchesSpecialty;
        });
    }, [doctors, searchQuery, selectedSpecialty]);

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i) => ({
            opacity: 1, 
            y: 0,
            transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
        })
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Back Button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate('/dashboard')}
                className="fixed top-8 left-8 z-50 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 dark:bg-slate-900/40 backdrop-blur-md border border-white/30 text-white font-bold text-xs hover:bg-white hover:text-slate-900 transition-all shadow-2xl"
            >
                <ChevronLeft size={16} />
                BACK TO DASHBOARD
            </motion.button>

            {/* Premium Header Section */}
            <div className="relative h-[400px] overflow-hidden bg-slate-900 flex items-center justify-center px-6">
                <div className="absolute inset-0 opacity-40">
                    <img 
                        src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&auto=format&fit=crop" 
                        alt="Background" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900 to-slate-50 dark:to-slate-950"></div>
                </div>

                <div className="relative z-10 text-center max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary-light text-xs font-bold mb-6 backdrop-blur-md"
                    >
                        <ShieldCheck size={14} />
                        VERIFIED BY MINDSAARTHI EXPERTS
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight"
                    >
                        Find Your Path to <span className="text-primary-light">Wellness</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto font-medium"
                    >
                        Connect with top-rated mental health specialists specifically curated for the MindSaarthi community.
                    </motion.p>

                    {/* Smart Search Bar */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="relative max-w-2xl mx-auto"
                    >
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400">
                            <Search size={20} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search by name, specialty, or condition..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-16 pl-16 pr-32 rounded-3xl bg-white dark:bg-slate-900 border-none shadow-2xl text-slate-800 dark:text-white text-lg font-medium focus:ring-4 focus:ring-primary/20 transition-all outline-none"
                        />
                        <div className="absolute inset-y-2 right-2 flex items-center">
                            <button className="h-12 px-8 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark transition-all flex items-center gap-2">
                                <Filter size={18} />
                                <span className="hidden md:inline">Advanced Filters</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Specialty Filters */}
            <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
                <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
                    {specialties.map((spec) => (
                        <button
                            key={spec}
                            onClick={() => setSelectedSpecialty(spec)}
                            className={`px-6 py-3 rounded-2xl whitespace-nowrap font-bold text-sm transition-all border-2 ${
                                selectedSpecialty === spec 
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 scale-105' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                            }`}
                        >
                            {spec}
                        </button>
                    ))}
                </div>
            </div>

            {/* Doctors Grid */}
            <div className="max-w-7xl mx-auto px-6 mt-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                            Available Specialists
                        </h2>
                        <p className="text-slate-500 text-sm font-medium">{filteredDoctors.length} results found in your area</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-[500px] rounded-[2.5rem] bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {filteredDoctors.map((doc, i) => (
                                <motion.div
                                    key={doc.id}
                                    custom={i}
                                    initial="hidden"
                                    animate="visible"
                                    variants={cardVariants}
                                    onMouseEnter={() => setHoveredDoctor(doc.id)}
                                    onMouseLeave={() => setHoveredDoctor(null)}
                                    className="group bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2"
                                >
                                    {/* Image Section */}
                                    <div className="relative h-64 overflow-hidden">
                                        <img 
                                            src={doc.image || 'https://via.placeholder.com/400x300'} 
                                            alt={doc.name} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                                        
                                        <div className="absolute top-6 left-6">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-black uppercase tracking-widest">
                                                <Award size={12} className="text-yellow-400" />
                                                Recommended
                                            </div>
                                        </div>

                                        <button className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-900/40 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-red-500 transition-all">
                                            <Heart size={18} />
                                        </button>

                                        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{doc.specialization}</p>
                                                <h3 className="text-xl font-black leading-tight">{doc.name}</h3>
                                            </div>
                                            <div className="bg-primary px-3 py-1.5 rounded-2xl text-[10px] font-black">
                                                {doc.fee || '₹1000'} / session
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Section */}
                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-black text-xs">
                                                <Star size={14} className="fill-current" />
                                                {doc.rating}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                {doc.reviews} Trusted Reviews
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                                <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                                                <span className="text-sm font-medium">{doc.address}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                                <Stethoscope size={18} className="text-primary shrink-0" />
                                                <span className="text-sm font-medium">10+ Years Experience</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                                <Calendar size={18} className="text-primary shrink-0" />
                                                <span className="text-sm font-bold text-green-500">Available Tomorrow</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                                            <a 
                                                href={`tel:${doc.phone}`}
                                                className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/10 hover:text-primary transition-all"
                                            >
                                                <Phone size={16} />
                                                Call
                                            </a>
                                            <button 
                                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${doc.lat},${doc.lng}`, '_blank')}
                                                className="h-12 rounded-2xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all"
                                            >
                                                <Navigation size={16} />
                                                Navigate
                                            </button>
                                        </div>
                                        
                                        <motion.button
                                            animate={{ x: hoveredDoctor === doc.id ? 5 : 0 }}
                                            className="w-full mt-4 h-12 flex items-center justify-center gap-2 text-primary font-black text-xs uppercase tracking-widest hover:underline"
                                        >
                                            View Full Profile <ArrowRight size={14} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
                
                {/* Empty State */}
                {!loading && filteredDoctors.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-32 text-center"
                    >
                        <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                            <Search size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">No Specialists Found</h3>
                        <p className="text-slate-500">Try adjusting your filters or search keywords.</p>
                        <button 
                            onClick={() => { setSearchQuery(""); setSelectedSpecialty("All"); }}
                            className="mt-8 px-8 py-3 rounded-2xl bg-primary text-white font-bold"
                        >
                            Clear All Filters
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Smart Contact Banner */}
            <div className="max-w-7xl mx-auto px-6 mt-20">
                <div className="p-12 rounded-[3.5rem] bg-gradient-to-br from-primary to-indigo-600 text-white relative overflow-hidden shadow-2xl shadow-primary/30">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32 blur-2xl"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="max-w-xl">
                            <h2 className="text-4xl font-black mb-4">Can't decide on a specialist?</h2>
                            <p className="text-white/80 text-lg font-medium">Use our AI-powered matching system to find the perfect therapeutic partner based on your personality profile.</p>
                        </div>
                        <button className="px-12 h-16 rounded-[2rem] bg-white text-primary font-black text-lg hover:scale-105 transition-all shadow-xl">
                            Match with AI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorsPage;