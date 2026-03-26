import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Thermometer, Brain, TrendingUp, AlertTriangle } from 'lucide-react';

const DashboardPreview = () => {
    const [activeTab, setActiveTab] = useState('mood');
    const [animatedHeights, setAnimatedHeights] = useState([20, 30, 45, 60, 40, 50, 75]);

    useEffect(() => {
        // Animate bars slightly randomly
        const interval = setInterval(() => {
            setAnimatedHeights(prev => prev.map(h => {
                const diff = Math.floor(Math.random() * 15) - 7;
                const newH = h + diff;
                return newH > 100 ? 100 : newH < 10 ? 10 : newH;
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <section id="dashboard" className="py-24 bg-background-light dark:bg-background-dark relative">
            <div className="absolute top-0 right-0 w-1/3 h-[500px] bg-primary/5 rounded-bl-[100%] blur-3xl pointer-events-none"></div>

            <div className="container mx-auto px-6 max-w-6xl relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Clinical Dashboard Preview
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                        Track your emotional trends and risk indicators over time with our comprehensive analytics.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="glass-card rounded-3xl p-6 md:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-none bg-white/60 dark:bg-slate-900/60"
                >
                    {/* Top Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        {[
                            { title: "Risk Level", value: "Moderate", icon: <AlertTriangle className="text-yellow-500" size={20} />, trend: "+2% from last wk" },
                            { title: "Avg Mood", value: "6.8 / 10", icon: <Activity className="text-primary" size={20} />, trend: "+0.5 points" },
                            { title: "Stress Index", value: "42%", icon: <Thermometer className="text-accent" size={20} />, trend: "-5% from last wk" },
                            { title: "Sessions", value: "14", icon: <Brain className="text-purple-500" size={20} />, trend: "Active weekly" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                                        {stat.icon}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.title}</h4>
                                    <span className="text-2xl font-bold text-slate-900 dark:text-white block mb-1">{stat.value}</span>
                                    <span className="text-xs text-slate-400 dark:text-slate-500">{stat.trend}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Chart Area */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                                <TrendingUp className="text-primary" /> Emotional Trend Analysis
                            </h3>
                            <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-1 flex gap-1">
                                {['mood', 'stress'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bar Chart Simulation */}
                        <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-2 md:px-8 mt-4">
                            {animatedHeights.map((h, i) => (
                                <div key={i} className="flex flex-col items-center gap-3 w-full group">
                                    {/* Tooltip on hover */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg -translate-y-2 whitespace-nowrap hidden md:block">
                                        {days[i]}: {Math.round(h)}%
                                    </div>
                                    {/* Bar */}
                                    <div className="w-full relative h-[200px] bg-slate-100 dark:bg-slate-900 rounded-t-lg overflow-hidden flex items-end">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ duration: 0.5, type: 'spring' }}
                                            className={`w-full rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity ${activeTab === 'mood'
                                                ? 'bg-gradient-to-t from-primary/50 to-primary'
                                                : 'bg-gradient-to-t from-accent/50 to-accent'
                                                }`}
                                        ></motion.div>
                                    </div>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{days[i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default DashboardPreview;
