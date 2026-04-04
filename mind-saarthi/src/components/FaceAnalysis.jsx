import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, X, Shield, Sparkles,
  Brain, AlertCircle, CheckCircle2,
  RefreshCw, Info, ThumbsUp, Activity,
  Maximize2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const FaceAnalysis = ({ onComplete, onCancel }) => {
  const { token } = useAuth();
  const [status, setStatus] = useState("Ready"); // "Ready", "Scanning", "Analyzing", "Complete"
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false); // Simulated detection feedback

  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const speak = useCallback((text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const framesRef = useRef([]);

  const SCAN_DURATION = 3000; // Increased to 3 seconds for higher accuracy

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 480, height: 360 }
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setStatus("Ready");
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera access denied. Please grant permission to analyze expressions.");
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = 150; // Smaller resolution = much faster API response
    canvasRef.current.height = 150;
    ctx.drawImage(videoRef.current, 0, 0, 150, 150);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.6); // Lower quality for speed
    framesRef.current.push(dataUrl);
  };

  const startAnalysis = async () => {
    setCapturing(true);
    setStatus("Scanning");
    framesRef.current = [];

    // Capture 8 frames during the 3sec scan for better averaging and micro-expression detection
    const captureInterval = setInterval(captureFrame, 350);
    const startTime = Date.now();

    const updateProgress = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = (elapsed / SCAN_DURATION) * 100;
      setProgress(Math.min(currentProgress, 100));

      if (elapsed >= SCAN_DURATION) {
        clearInterval(updateProgress);
        clearInterval(captureInterval);
        processWithAI();
      }
    }, 50);
  };

  const processWithAI = async () => {
    setCapturing(false);
    setStatus("Analyzing");
    speak("Scan successful. Deep analyzing expressions now.");

    try {
      const resp = await axios.post('http://localhost:5000/analyze-face', {
        frames: framesRef.current
      }, { headers: { Authorization: `Bearer ${token}` } });

      setReport(resp.data);
      setStatus("Complete");
      speak("Analysis complete. Here is your mental wellness report.");
    } catch (err) {
      console.error("AI Analysis Error:", err);
      setError("AI Analysis failed. Please try again.");
      setStatus("Ready");
    }
  };

  return (
    <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-2xl">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="bg-white dark:bg-slate-900 border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] custom-scrollbar"
      >
        {/* Header */}
        <div className="p-8 pb-0 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
              <Brain size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">AI Vision Analysis</h2>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Facial Sentiment Intelligence</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
              <AlertCircle size={32} className="text-red-500 mx-auto mb-4" />
              <p className="text-sm font-semibold text-red-500">{error}</p>
              <button onClick={() => { setError(null); startCamera(); }} className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl font-bold">Retry</button>
            </div>
          ) : status === "Complete" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full">Report Finalized</span>
              </div>
              <div className="flex items-center justify-center gap-8 py-4">
                <div className="text-center">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Emotion</div>
                  <div className="text-4xl font-black text-primary">{report.emotion}</div>
                </div>
                <div className="w-px h-12 bg-slate-200 dark:bg-slate-800" />
                <div className="text-center">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Confidence</div>
                  <div className="text-4xl font-black text-emerald-500">
                    {Math.round(report.confidence <= 1 ? report.confidence * 100 : report.confidence)}%
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 border-slate-200/50 dark:border-slate-200/10 bg-primary/5">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                  <Sparkles size={14} /> Mood Diagnostic
                </h4>
                <p className="text-2xl font-bold tracking-tight mb-2 text-slate-800 dark:text-white">{report.mood}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{report.insight}</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Clinical Neural Markers</h4>
                  <div className="flex flex-wrap gap-2 px-2">
                    {report.au_detected?.map((au, i) => (
                      <span key={i} className="px-2 py-1 bg-primary/5 border border-primary/20 text-primary text-[9px] font-bold rounded-lg uppercase tracking-tight">
                        {au}
                      </span>
                    ))}
                    {(!report.au_detected || report.au_detected.length === 0) && (
                      <span className="text-[9px] italic opacity-40">No micro-expressions isolated in current scan window.</span>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">Actionable Suggestions</h4>
                  {report.suggestions.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 glass-card border-emerald-500/10 dark:border-emerald-500/20 rounded-2xl">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                        <ThumbsUp size={12} />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onComplete(report)}
                className="w-full btn-primary bg-primary hover:bg-primary-dark py-4 shadow-primary/25 mt-4"
              >
                Save to Wellness Log
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Camera Preview */}
              <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-black border-2 border-slate-800 shadow-inner group">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover transition-all duration-700 ${capturing ? 'scale-110 saturate-[1.2]' : ''}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Visual Scanning Overlays */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Face Bounding Box (Simulation) */}
                  <motion.div
                    animate={capturing ? {
                      scale: [1, 1.05, 1],
                      borderColor: ["rgba(23,93,197,0.3)", "rgba(23,93,197,0.8)", "rgba(23,93,197,0.3)"]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-x-12 inset-y-12 border-2 border-primary/40 rounded-[2rem] z-10"
                  />

                  {/* Scanning Beam */}
                  <AnimatePresence>
                    {status === "Scanning" && (
                      <motion.div
                        initial={{ top: "10%" }}
                        animate={{ top: "90%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(23,93,197,1)] z-20"
                      />
                    )}
                  </AnimatePresence>

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Floating Status Log */}
                <div className="absolute inset-x-0 bottom-8 flex justify-center z-40 px-6">
                  <motion.div
                    key={status}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3"
                  >
                    {status === "Scanning" && <Activity size={16} className="text-primary animate-pulse" />}
                    {status === "Analyzing" && <RefreshCw size={16} className="text-primary animate-spin" />}
                    {status === "Complete" && <CheckCircle2 size={16} className="text-emerald-500" />}
                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                      {status === "Scanning" ? "Capturing Facial Patterns..." :
                        status === "Analyzing" ? "Neural Engine Processing..." :
                          status === "Ready" ? "Align Face in Center" :
                            status === "Complete" ? "Analysis Successful" : status}
                    </span>
                  </motion.div>
                </div>

                {/* Status Indicator (Top Right) */}
                <div className="absolute top-6 right-6 z-30">
                  <div className={`px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md border ${status === "Scanning" ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/10 border-white/20 text-white"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status === "Scanning" ? "bg-primary animate-pulse" : "bg-white opacity-50"}`}></span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{status}</span>
                  </div>
                </div>
              </div>

              {/* Progress & Info */}
              <div className="space-y-4">
                {status === "Analyzing" ? (
                  <div className="text-center py-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="inline-block mb-3"
                    >
                      <RefreshCw size={32} className="text-primary" />
                    </motion.div>
                    <p className="text-lg font-bold">Deep Analysing Facial Patterns...</p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">OpenRouter Vision Intelligence</p>
                  </div>
                ) : (
                  <>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ${status === "Scanning" ? "block" : "hidden"}`}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Info size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Look directly at the camera with neutral face</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                        <Shield size={12} /> Privacy Secure
                      </div>
                    </div>

                    {status === "Ready" && (
                      <button
                        onClick={startAnalysis}
                        className="w-full btn-primary bg-primary hover:bg-primary-dark py-4 shadow-primary/25 mt-2 flex items-center justify-center gap-3"
                      >
                        <Camera size={20} />
                        Start Neural Scan
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FaceAnalysis;
