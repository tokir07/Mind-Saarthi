import React, { Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Text, MeshDistortMaterial, PresentationControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Maximize2, Sparkles as SparkleIcon, Zap } from 'lucide-react';

const BreathingSphere = () => {
    const meshRef = React.useRef();
    
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Breathing rhythm: ~4 seconds in, ~4 seconds out
        const scale = 1 + Math.sin(t * 0.8) * 0.15;
        meshRef.current.scale.set(scale, scale, scale);
        meshRef.current.rotation.y = t * 0.2;
    });

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={2}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[1, 64, 64]} />
                <MeshDistortMaterial
                    color="#4f46e5"
                    speed={2}
                    distort={0.4}
                    radius={1}
                    emissive="#1e1b4b"
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>
        </Float>
    );
};

const FloatingIslands = () => {
    return (
        <group>
            {[...Array(20)].map((_, i) => (
                <Float
                    key={i}
                    position={[
                        (Math.random() - 0.5) * 15,
                        (Math.random() - 0.5) * 10,
                        (Math.random() - 0.5) * 15
                    ]}
                    speed={Math.random() * 2}
                    rotationIntensity={Math.random()}
                >
                    <mesh>
                        <octahedronGeometry args={[Math.random() * 0.3]} />
                        <meshStandardMaterial 
                            color={i % 2 === 0 ? "#818cf8" : "#c084fc"} 
                            emissive={i % 2 === 0 ? "#1e1b4b" : "#2e1065"}
                            transparent 
                            opacity={0.6} 
                        />
                    </mesh>
                </Float>
            ))}
        </group>
    );
};

const Experience = () => {
    return (
        <>
            <color attach="background" args={['#020617']} />
            <fog attach="fog" args={['#020617', 5, 20]} />
            
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#818cf8" />
            <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Sparkles count={200} scale={15} size={2} speed={0.4} color="#f0f9ff" />
            
            <BreathingSphere />
            <FloatingIslands />

            <Text
                position={[0, -2, 0]}
                fontSize={0.4}
                color="white"
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
                anchorX="center"
                anchorY="middle"
                fillOpacity={0.6}
            >
                Breathe with the Pulse
            </Text>
        </>
    );
};

const MemoryPalace = ({ isOpen, onClose }) => {
    const [muted, setMuted] = useState(false);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-center"
            >
                {/* HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none z-10 p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-start pointer-events-auto">
                        <div className="space-y-1">
                            <h2 className="text-white text-2xl font-black tracking-tighter flex items-center gap-2">
                                <SparkleIcon className="text-indigo-400 animate-pulse" size={24} />
                                MEMORY PALACE
                            </h2>
                            <p className="text-indigo-300/60 text-[10px] font-black uppercase tracking-[0.3em]">Neural Grounding Environment</p>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setMuted(!muted)}
                                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                            >
                                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <button 
                                onClick={onClose}
                                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-red-500/20 hover:text-red-400 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="w-full max-w-md mx-auto text-center space-y-6">
                        <div className="space-y-2">
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Grounding Protocol</p>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-indigo-500"
                                    animate={{ width: ["0%", "100%"] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                />
                            </div>
                        </div>
                        <p className="text-white/60 text-sm font-medium italic">
                            Match your breath to the expansion of the sphere
                        </p>
                    </div>
                </div>

                {/* 3D Scene */}
                <div className="w-full h-full cursor-grab active:cursor-grabbing">
                    <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
                        <Suspense fallback={null}>
                            <PresentationControls
                                global
                                config={{ mass: 2, tension: 500 }}
                                snap={{ mass: 4, tension: 1500 }}
                                rotation={[0, 0.3, 0]}
                                polar={[-Math.PI / 4, Math.PI / 4]}
                                azimuth={[-Math.PI / 4, Math.PI / 4]}
                            >
                                <Experience />
                            </PresentationControls>
                            <OrbitControls enableZoom={false} enablePan={false} />
                        </Suspense>
                    </Canvas>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default MemoryPalace;
