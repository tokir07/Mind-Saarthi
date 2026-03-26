import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Stethoscope, Clock, ShieldCheck, Heart, Activity } from 'lucide-react';

const AnimatedCounter = ({ end, duration = 2, suffix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const incrementTime = (duration * 1000) / end;

        // We create a fast apparent counter
        const timer = setInterval(() => {
            start += Math.ceil(end / 40); // smooth steps
            if (start > end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, 50);

        return () => clearInterval(timer);
    }, [end, duration]);

    return <span className="font-bold">{count}{suffix}</span>;
}

const Impact = () => {
    return (
        <section id="impact" className="py-24 bg-surface-light/50 dark:bg-surface-dark/30">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Transforming Healthcare
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                        Bridging the gap between mental health needs and accessible clinical care.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">

                    {/* Patients Column */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="glass-card rounded-3xl p-8 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Users size={120} />
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white shadow-lg">
                                <Users size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">For Patients</h3>
                        </div>

                        <ul className="space-y-6">
                            {[
                                { icon: <Clock />, text: "24/7 immediate access to emotional support" },
                                { icon: <ShieldCheck />, text: "Anonymous and stigma-free environment" },
                                { icon: <Heart />, text: "Personalized coping strategies in real-time" }
                            ].map((item, i) => (
                                <li key={i} className="flex gap-4">
                                    <div className="mt-1 text-primary dark:text-primary-light">
                                        {item.icon}
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 text-lg">{item.text}</p>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="text-4xl font-extrabold text-primary mb-2">
                                <AnimatedCounter end={85} suffix="%" />
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                Reduction in anxiety symptoms after 4 weeks of use
                            </p>
                        </div>
                    </motion.div>

                    {/* Doctors Column */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="glass-card rounded-3xl p-8 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Stethoscope size={120} />
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-red-500 flex items-center justify-center text-white shadow-lg">
                                <Stethoscope size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">For Healthcare Providers</h3>
                        </div>

                        <ul className="space-y-6">
                            {[
                                { icon: <Activity />, text: "Continuous monitoring between scheduled sessions" },
                                { icon: <ShieldCheck />, text: "Early warning system for high-risk individuals" },
                                { icon: <Heart />, text: "Data-driven insights to tailor treatment plans" }
                            ].map((item, i) => (
                                <li key={i} className="flex gap-4">
                                    <div className="mt-1 text-accent dark:text-accent-light">
                                        {item.icon}
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 text-lg">{item.text}</p>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="text-4xl font-extrabold text-accent mb-2">
                                <AnimatedCounter end={3} suffix="x" />
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                Faster clinical assessment using AI-generated reports
                            </p>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default Impact;
