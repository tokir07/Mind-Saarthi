import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, X, RotateCcw, 
  Wind, Brain, Accessibility,
  Volume2, VolumeX, CheckCircle2
} from 'lucide-react';

const LiveExercisePanel = ({ exercise, onComplete, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState(exercise.duration || 120);
  const [isActive, setIsActive] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepTimeLeft, setStepTimeLeft] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const getExerciseData = (type) => {
    switch (type) {
      case 'breathing':
        return {
          title: "Guided Breathing",
          subtitle: "4-4-6 Rhythm",
          icon: <Wind className="text-blue-400" />,
          steps: [
            { text: "Inhale slowly...", duration: 4, voice: "Inhale slowly" },
            { text: "Hold your breath...", duration: 4, voice: "Hold" },
            { text: "Exhale fully...", duration: 6, voice: "Exhale slowly" }
          ],
          color: "from-blue-500/20 to-cyan-500/20"
        };
      case 'grounding':
        return {
          title: "5-4-3-2-1 Grounding",
          subtitle: "Reconnect with reality",
          icon: <Brain className="text-purple-400" />,
          steps: [
            { text: "Name 5 things you can SEE", duration: 15, voice: "Name five things you can see" },
            { text: "Name 4 things you can FEEL", duration: 12, voice: "Name four things you can feel" },
            { text: "Name 3 things you can HEAR", duration: 10, voice: "Name three things you can hear" },
            { text: "Name 2 things you can SMELL", duration: 8, voice: "Name two things you can smell" },
            { text: "Name 1 thing you can TASTE", duration: 5, voice: "Name one thing you can taste" }
          ],
          color: "from-purple-500/20 to-pink-500/20"
        };
      case 'micro_break':
        return {
          title: "Micro Break",
          subtitle: "Quick Refresh",
          icon: <Accessibility className="text-emerald-400" />,
          steps: [
            { text: "Stretch your arms up high", duration: 10, voice: "Stretch your arms up high" },
            { text: "Rotate your neck gently", duration: 10, voice: "Rotate your neck gently" },
            { text: "Look at something 20ft away", duration: 10, voice: "Look at something twenty feet away" },
            { text: "Take a deep sip of water", duration: 10, voice: "Take a deep sip of water" }
          ],
          color: "from-emerald-500/20 to-teal-500/20"
        };
      default:
        return {
          title: "Mindful Moment",
          subtitle: "Relax and center",
          icon: <Wind />,
          steps: [{ text: "Just breathe", duration: exercise.duration || 60, voice: "Just breathe" }],
          color: "from-primary/20 to-accent/20"
        };
    }
  };

  const data = getExerciseData(exercise.type);

  const speak = useCallback((text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    
    // Add subtle vibration if browser supports it
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
  }, [voiceEnabled]);

  useEffect(() => {
    if (isActive && !isCompleted) {
      if (stepTimeLeft <= 0) {
        const nextStep = (currentStep + 1) % data.steps.length;
        setCurrentStep(nextStep);
        setStepTimeLeft(data.steps[nextStep].duration);
        speak(data.steps[nextStep].voice);
        
        if (exercise.type === 'breathing' && 'vibrate' in navigator) {
            if (nextStep === 0) navigator.vibrate([100, 50, 100]); // Long pulse for inhale
            else navigator.vibrate(50); // Short pulse for others
        }
      }
    }
  }, [isActive, stepTimeLeft, currentStep, data.steps, speak, isCompleted, exercise.type]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setStepTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0) {
      setIsCompleted(true);
      setIsActive(false);
      speak("Great job. You've completed the exercise. How do you feel now?");
      
      if ('vibrate' in navigator) {
          navigator.vibrate([100, 100, 100, 100, 500]);
      }

      // Auto-close after 5 seconds if completed
      setTimeout(() => {
          onComplete && onComplete();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, speak, onComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative overflow-hidden rounded-[2.5rem] glass shadow-2xl bg-gradient-to-br ${data.color} p-8 mb-6`}
    >
      {/* Background Pulse */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: isActive ? [1, 1.1, 1] : 1,
            opacity: isActive ? [0.1, 0.2, 0.1] : 0.1
          }}
          transition={{ duration: data.steps[currentStep].duration, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-white rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              {data.icon}
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">{data.title}</h3>
              <p className="text-xs font-bold opacity-60 uppercase tracking-widest">{data.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-xl transition-colors ${voiceEnabled ? 'bg-white/20' : 'bg-black/10'}`}
            >
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button 
              onClick={onCancel}
              className="p-2 rounded-xl bg-black/10 hover:bg-black/20 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-8">
          {/* Animated Circle for Breathing */}
          {exercise.type === 'breathing' && !isCompleted && (
            <div className="relative w-48 h-48 flex items-center justify-center mb-8">
              <motion.div 
                animate={{ 
                  scale: currentStep === 0 ? [1, 1.5] : currentStep === 1 ? 1.5 : [1.5, 1],
                }}
                transition={{ duration: data.steps[currentStep].duration, ease: "easeInOut" }}
                className="absolute inset-0 border-4 border-white/30 rounded-full"
              />
              <motion.div 
                animate={{ 
                  scale: currentStep === 0 ? [1, 1.4] : currentStep === 1 ? 1.4 : [1.4, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: data.steps[currentStep].duration, ease: "easeInOut" }}
                className="absolute inset-4 bg-white/20 rounded-full blur-sm"
              />
              <div className="text-center z-10">
                <span className="text-3xl font-black">{stepTimeLeft}s</span>
              </div>
            </div>
          )}

          {exercise.type !== 'breathing' && !isCompleted && (
            <div className="text-6xl font-black mb-8 tracking-tighter">
              {formatTime(timeLeft)}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!isCompleted ? (
              <motion.div 
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <h4 className="text-2xl font-black mb-2 px-4 leading-tight">{data.steps[currentStep].text}</h4>
                <div className="flex items-center justify-center gap-1 mt-4">
                  {data.steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <CheckCircle2 size={64} className="text-white mx-auto mb-4" />
                  <h4 className="text-3xl font-black mb-2">Well Done!</h4>
                  <p className="text-sm font-medium opacity-80">You've successfully completed the session.</p>
                </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isCompleted && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button 
              onClick={() => setIsActive(!isActive)}
              className="px-8 py-3 rounded-2xl bg-white text-black font-black flex items-center gap-2 hover:scale-105 transition-transform"
            >
              {isActive ? <><Pause size={18} fill="currentColor" /> Pause</> : <><Play size={18} fill="currentColor" /> Resume</>}
            </button>
            <button 
              onClick={() => setTimeLeft(0)}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
              title="Skip"
            >
              <RotateCcw size={20} className="rotate-90" />
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {!isCompleted && (
        <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full overflow-hidden">
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: `${(timeLeft / (exercise.duration || 120)) * 100}%` }}
            className="h-full bg-white shadow-[0_0_10px_white]"
          />
        </div>
      )}
    </motion.div>
  );
};

export default LiveExercisePanel;
