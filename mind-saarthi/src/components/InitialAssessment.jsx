import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, CheckCircle2, ChevronRight, Activity, 
    AlertTriangle, ShieldCheck, Heart, Sparkles 
} from 'lucide-react';
import api from '../api';

const InitialAssessment = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [consent, setConsent] = useState(false);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await api.get('/assessment/questions');
                setQuestions(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch questions", err);
            }
        };
        fetchQuestions();
    }, []);

    const handleAnswer = (questionId, value) => {
        const newResponses = [...responses];
        const existingIdx = newResponses.findIndex(r => r.questionId === questionId);
        if (existingIdx > -1) newResponses[existingIdx].value = value;
        else newResponses.push({ questionId, value });
        setResponses(newResponses);

        if (step < questions.length) {
            setTimeout(() => setStep(step + 1), 300);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const res = await api.post('/assessment/submit', { responses });
            setResult(res.data);
        } catch (err) {
            console.error("Submission failed", err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;

    if (step === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-6"
            >
                <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[3rem] p-12 shadow-2xl border border-white/10 text-center">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <ShieldCheck size={40} />
                    </div>
                    <h2 className="text-4xl font-black mb-6 tracking-tight">Smart Initial Assessment</h2>
                    <p className="text-slate-500 mb-10 leading-relaxed font-medium">
                        Welcome to MindSaarthi. To provide you with the most accurate clinical support, we need to establish your mental health baseline. This assessment uses globally accepted PHQ-9 and GAD-7 standards.
                    </p>
                    
                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 mb-10 text-left border border-slate-100 dark:border-white/5">
                        <div className="flex items-start gap-4 mb-4">
                            <input 
                                type="checkbox" 
                                id="consent" 
                                checked={consent} 
                                onChange={(e) => setConsent(e.target.checked)}
                                className="mt-1 w-5 h-5 rounded accent-primary" 
                            />
                            <label htmlFor="consent" className="text-xs font-bold opacity-70 leading-relaxed cursor-pointer">
                                I understand that this is a self-screening tool and NOT a medical diagnosis. My data will be encrypted and used only for my personalized recovery roadmap.
                            </label>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500">
                            <AlertTriangle size={14} /> Disclaimer: Not for psychiatric emergencies.
                        </div>
                    </div>

                    <button
                        disabled={!consent}
                        onClick={() => setStep(1)}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl flex items-center justify-center gap-3 ${
                            consent ? 'bg-primary text-white hover:scale-105 active:scale-95 shadow-primary/20' : 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                        }`}
                    >
                        Begin Assessment <ChevronRight size={18} />
                    </button>
                </div>
            </motion.div>
        );
    }

    if (result) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-6"
            >
                <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[3rem] p-12 shadow-2xl border border-white/10 text-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl ${
                        result.risk_level === 'Low' ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/20' :
                        result.risk_level === 'Moderate' ? 'bg-amber-500/10 text-amber-500 shadow-amber-500/20' :
                        'bg-red-500/10 text-red-500 shadow-red-500/20'
                    }`}>
                        {result.risk_level === 'Low' ? <CheckCircle2 size={48} /> : <Activity size={48} />}
                    </div>
                    
                    <h2 className="text-4xl font-black mb-2 tracking-tight">Baseline Established</h2>
                    <div className={`inline-block px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs mb-8 ${
                        result.risk_level === 'Low' ? 'bg-emerald-500 text-white' :
                        result.risk_level === 'Moderate' ? 'bg-amber-500 text-white' :
                        'bg-red-500 text-white'
                    }`}>
                        {result.risk_level} Risk Level
                    </div>

                    <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-8 mb-10 text-left border border-slate-100 dark:border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Brain size={120} />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 flex items-center gap-2">
                            <Sparkles size={14} /> AI Insight
                        </h4>
                        <p className="text-lg font-bold leading-relaxed italic opacity-80 z-10 relative">
                            "{result.ai_insight}"
                        </p>
                    </div>

                    {result.risk_level === 'High' && (
                        <div className="mb-10 p-6 bg-red-500/5 rounded-2xl border border-red-500/20 text-left">
                            <div className="flex items-center gap-3 text-red-500 mb-2">
                                <AlertTriangle size={20} />
                                <span className="font-black uppercase tracking-widest text-xs">Priority Clinical Support Enabled</span>
                            </div>
                            <p className="text-xs font-medium opacity-70">
                                Your baseline markers indicate significant distress. We have prioritized verified psychiatric facilities in your dashboard. Please consider reaching out to a professional.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            localStorage.setItem('lastAssessmentDate', today);
                            onComplete();
                        }}
                        className="w-full py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                        Access My Dashboard
                    </button>
                </div>
            </motion.div>
        );
    }

    const currentQuestion = questions[step - 1];
    const progress = (step / questions.length) * 100;

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-6"
        >
            <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[3rem] p-12 shadow-2xl border border-white/10 relative overflow-hidden">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-slate-100 dark:bg-white/5">
                    <motion.div 
                        className="h-full bg-primary" 
                        initial={{ width: 0 }} animate={{ width: `${progress}%` }} 
                    />
                </div>

                <div className="flex justify-between items-center mb-12">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Step {step} of {questions.length}</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">{currentQuestion?.category} Assessment</span>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="min-h-[300px] flex flex-col justify-center"
                    >
                        <h3 className="text-3xl font-black tracking-tight mb-12 leading-tight">
                            {currentQuestion?.text}
                        </h3>

                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { text: "Not at all", val: 0 },
                                { text: "Several days", val: 1 },
                                { text: "More than half the days", val: 2 },
                                { text: "Nearly every day", val: 3 }
                            ].map((opt) => (
                                <button
                                    key={opt.val}
                                    onClick={() => handleAnswer(currentQuestion.id, opt.val)}
                                    className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-left font-bold transition-all hover:bg-primary/10 hover:border-primary/30 group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-black shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                                            {opt.val}
                                        </div>
                                        <span className="text-lg tracking-tight">{opt.text}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {step === questions.length && responses.length === questions.length && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-12 pt-8 border-t border-slate-100 dark:border-white/10">
                        <button
                            disabled={submitting}
                            onClick={handleSubmit}
                            className="w-full py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 overflow-hidden"
                        >
                            {submitting ? 'Analyzing Responses...' : 'Generate Clinical Baseline'}
                        </button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default InitialAssessment;
