import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const SignupPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await api.post('/signup', { name, email, password });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[100px] animate-pulse-slow pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }}></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md glass-card bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-800/50 p-8 md:p-10 rounded-3xl shadow-2xl relative z-10 backdrop-blur-xl"
            >
                <div className="flex justify-center mb-6">
                    <Link to="/" className="flex items-center gap-2 border-b-2 border-transparent hover:border-primary/30 transition-all pb-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <Brain size={24} />
                        </div>
                    </Link>
                </div>

                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white text-center mb-2">Create Account</h2>
                <p className="text-slate-600 dark:text-slate-400 text-center mb-8">Join MindSaarthi for a healthier mind</p>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400">
                        <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                        <span className="text-sm font-medium">{error}</span>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-slate-900 dark:text-white shadow-sm"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-slate-900 dark:text-white shadow-sm"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3 pr-12 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-slate-900 dark:text-white shadow-sm"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading || !name || !email || !password}
                            type="submit"
                            className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3.5 rounded-xl shadow-[0_4px_20px_rgba(23,93,197,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Sign Up"}
                        </motion.button>
                    </div>
                </form>

                <p className="mt-8 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                    Already have an account? <Link to="/login" className="text-primary hover:text-primary-light transition-colors font-bold ml-1">Log In</Link>
                </p>
            </motion.div>
        </div>
    );
};

export default SignupPage;
