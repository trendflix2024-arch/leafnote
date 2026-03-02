"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LeafIcon = ({ color = "currentColor", size = 24 }: { color?: string, size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill={color} fillOpacity="0.2" />
        <path d="M12 22V2M12 22C12 22 20 18 20 12C20 6 12 2 12 2M12 22C12 22 4 6 4 12C4 18 12 22 12 22ZM12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 15C13.5 15 15 15.5 15 17M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14M12 15C10.5 15 9 15.5 9 17" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
);

const FloatingLeaf = ({ id }: { id: number }) => {
    const randomX = Math.random() * 100;
    const randomDelay = Math.random() * 20;
    const randomDuration = 15 + Math.random() * 25;
    const randomScale = 0.5 + Math.random() * 1;
    const randomRotation = Math.random() * 360;

    return (
        <motion.div
            initial={{
                opacity: 0,
                x: `${randomX}vw`,
                y: '-10vh',
                rotate: randomRotation,
                scale: randomScale
            }}
            animate={{
                opacity: [0, 0.4, 0.4, 0],
                y: '110vh',
                x: [`${randomX}vw`, `${randomX + (Math.random() * 10 - 5)}vw`, `${randomX}vw`],
                rotate: randomRotation + 720
            }}
            transition={{
                duration: randomDuration,
                repeat: Infinity,
                delay: randomDelay,
                ease: "linear"
            }}
            className="absolute pointer-events-none z-0"
            style={{ color: '#10b981' }}
        >
            <LeafIcon size={24} />
        </motion.div>
    );
};

export const BackgroundEffects = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#faf9f6]">
            {/* Soft Ambient Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-100/30 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-amber-100/20 rounded-full blur-[120px]" />
            <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] bg-blue-50/20 rounded-full blur-[100px]" />

            {/* Organic Waves / Echo Ripples */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                <filter id="gooey">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                </filter>
                <g filter="url(#gooey)">
                    {[...Array(3)].map((_, i) => (
                        <motion.circle
                            key={i}
                            cx="50%"
                            cy="50%"
                            r={300 + i * 150}
                            fill="none"
                            stroke="#059669"
                            strokeWidth="2"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                                scale: [0.8, 1.2, 0.8],
                                opacity: [0.1, 0.3, 0.1],
                            }}
                            transition={{
                                duration: 10 + i * 5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </g>
            </svg>

            {/* Floating Leaves System */}
            {[...Array(12)].map((_, i) => (
                <FloatingLeaf key={i} id={i} />
            ))}

            {/* Noise Texture Overlay for Premium Feel */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    );
};
