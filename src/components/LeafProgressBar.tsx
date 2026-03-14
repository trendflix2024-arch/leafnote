"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeafProgressBarProps {
    progress: number; // 0 to 100
}

export default function LeafProgressBar({ progress }: LeafProgressBarProps) {
    const leafCount = Math.floor(progress / 10); // Sprout a leaf every 10%

    return (
        <div className="w-full py-4">
            <div className="relative h-4 bg-slate-100 rounded-full overflow-visible border border-slate-200 leaf-shadow">
                {/* Main Branch (Progress Fill) */}
                <motion.div
                    className="h-full bg-emerald-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />

                {/* Sprouting Leaves */}
                <div className="absolute inset-0 flex justify-around items-center pointer-events-none">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="relative w-0 h-0">
                            <AnimatePresence>
                                {progress >= (i + 1) * 10 && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -45, opacity: 0 }}
                                        animate={{ scale: 1, rotate: i % 2 === 0 ? 15 : -15, opacity: 1 }}
                                        className="absolute bottom-4 -left-2 w-4 h-6 bg-emerald-400 rounded-full border border-emerald-600 origin-bottom"
                                        style={{
                                            borderRadius: '100% 0% 100% 0% / 100% 0% 100% 0%',
                                            transform: i % 2 === 0 ? 'scaleX(-1)' : 'none'
                                        }}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between mt-3 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                <span>씨앗</span>
                <span className="text-emerald-700 font-bold">{progress}% 성장 중</span>
                <span>나무</span>
            </div>
        </div>
    );
}
