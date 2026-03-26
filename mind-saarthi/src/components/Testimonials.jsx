import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const Testimonials = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const testimonials = [
        {
            id: 1,
            name: 'Sarah M.',
            role: 'Student',
            text: 'MindSaarthi gave me a safe space to express my anxiety when I didn\'t want to talk to anyone else. It helped me understand my triggers better.',
            rating: 5,
        },
        {
            id: 2,
            name: 'David L.',
            role: 'Software Engineer',
            text: 'The daily mood tracking and immediate feedback from the chatbot is incredible. It feels like having a wellness coach 24/7.',
            rating: 5,
        },
        {
            id: 3,
            name: 'Dr. Emily R.',
            role: 'Clinical Psychologist',
            text: 'As a therapist, the dashboard insights allow me to understand my patients\' week between sessions. It\'s a game-changer for digital mental health.',
            rating: 5,
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setDirection(1);
            setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [testimonials.length]);

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.9,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
            },
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.9,
            transition: {
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
            },
        }),
    };

    const paginate = (newDirection) => {
        setDirection(newDirection);
        setCurrentIndex((prevIndex) => {
            let nextIndex = prevIndex + newDirection;
            if (nextIndex < 0) nextIndex = testimonials.length - 1;
            if (nextIndex >= testimonials.length) nextIndex = 0;
            return nextIndex;
        });
    };

    return (
        <section className="py-24 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 overflow-hidden relative">
            <div className="container mx-auto px-6 max-w-4xl relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Hear from our Community
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                        Real stories of better mental wellness with MindSaarthi.
                    </p>
                </div>

                <div className="relative h-[300px] flex justify-center items-center">
                    <button
                        onClick={() => paginate(-1)}
                        className="absolute left-0 z-20 w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light transition-colors hover:scale-105 active:scale-95 hidden md:flex"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="w-full relative h-full flex justify-center overflow-hidden px-16">
                        <AnimatePresence initial={false} custom={direction} mode="wait">
                            <motion.div
                                key={currentIndex}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                className="absolute w-full max-w-2xl bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl flex flex-col items-center text-center"
                            >
                                <div className="absolute top-6 left-6 text-primary/10 dark:text-primary/20">
                                    <Quote size={64} fill="currentColor" />
                                </div>

                                <div className="flex mb-6 gap-1 z-10">
                                    {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                                        <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>

                                <p className="text-xl md:text-2xl text-slate-800 dark:text-slate-200 font-medium leading-relaxed mb-8 z-10 italic">
                                    "{testimonials[currentIndex].text}"
                                </p>

                                <div className="z-10 mt-auto">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">{testimonials[currentIndex].name}</h4>
                                    <span className="text-sm font-medium text-primary dark:text-primary-light">{testimonials[currentIndex].role}</span>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => paginate(1)}
                        className="absolute right-0 z-20 w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light transition-colors hover:scale-105 active:scale-95 hidden md:flex"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Mobile controls & pagination dots */}
                <div className="flex justify-center mt-8 gap-2">
                    {testimonials.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setDirection(i > currentIndex ? 1 : -1);
                                setCurrentIndex(i);
                            }}
                            className={`w-3 h-3 rounded-full transition-all ${i === currentIndex ? 'bg-primary w-8' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
