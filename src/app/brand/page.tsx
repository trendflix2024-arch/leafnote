"use client";

import { motion } from 'framer-motion';
import { ArrowLeft, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/Logo';

const EchoWaveAnimation = () => {
    return (
        <div className="relative h-40 md:h-64 flex items-center justify-center overflow-hidden">
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute border-2 border-emerald-200 rounded-full"
                    initial={{ width: 0, height: 0, opacity: 0.8 }}
                    animate={{
                        width: [0, 280],
                        height: [0, 280],
                        opacity: [0.8, 0],
                        borderRadius: ["50%", "30%", "20%", "40%"]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 0.8,
                        ease: "easeOut"
                    }}
                />
            ))}
            <motion.div
                className="z-10 bg-emerald-600 p-4 md:p-6 rounded-full shadow-xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <svg width="32" height="32" className="md:w-12 md:h-12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
            </motion.div>

            {/* Floating Leaves */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={`leaf-${i}`}
                    className="absolute text-emerald-400"
                    initial={{
                        x: 0,
                        y: 0,
                        opacity: 0,
                        rotate: 0
                    }}
                    animate={{
                        x: (i % 2 === 0 ? 1 : -1) * (Math.random() * 200 + 100),
                        y: (Math.random() * -200 - 50),
                        opacity: [0, 1, 0],
                        rotate: 360
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 5,
                        ease: "easeInOut"
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fillOpacity="0.4" />
                    </svg>
                </motion.div>
            ))}
        </div>
    );
};

export default function BrandStory() {
    return (
        <div className="min-h-screen bg-[#faf9f6] text-slate-800 font-serif overflow-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 px-4 py-3 md:p-6 z-50 bg-[#faf9f6]/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors">
                        <ArrowLeft size={20} />
                        <span className="text-sm font-sans font-medium">돌아가기</span>
                    </Link>
                    <Logo size="sm" href="/" />
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 md:px-6 pt-20 md:pt-32 pb-20 md:pb-40 space-y-16 md:space-y-32">
                {/* Prologue */}
                <section className="space-y-6 md:space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <span className="text-emerald-600 font-sans font-bold tracking-widest text-sm uppercase">Prologue</span>
                        <h2 className="text-2xl md:text-5xl font-bold leading-tight">잊혀가는 잎사귀들</h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        viewport={{ once: true }}
                        className="space-y-5 md:space-y-8 text-base md:text-xl text-slate-600 leading-relaxed"
                    >
                        <p>
                            우리의 삶은 매일 새로운 잎을 틔우는 거대한 나무와 같습니다.<br />
                            꿈에 부풀었던 열여덟의 수채화 냄새,<br />
                            현실과 타협하며 처음 넥타이를 매던 날의 어색함,<br />
                            아이의 작은 손을 처음 잡았던 그 떨림까지.
                        </p>
                        <p>
                            하지만 치열한 일상 속에서 우리 마음의 잎사귀들은<br />
                            채 기록되기도 전에 속절없이 떨어져 흩어지곤 합니다.
                        </p>
                        <div className="py-5 md:py-8 border-y border-emerald-100 relative">
                            <Quote className="absolute -top-3 md:-top-4 left-0 text-emerald-100" size={32} />
                            <p className="text-lg md:text-3xl text-emerald-800 font-bold text-center italic">
                                "내 이야기가 책이 될 수 있을까?"
                            </p>
                            <p className="mt-2 md:mt-4 text-center text-slate-500 text-sm md:text-base">
                                망설임 속에 당신의 소중한 역사는 기억 저편으로 흐려져 갑니다.
                            </p>
                        </div>
                    </motion.div>
                </section>

                {/* The Solution */}
                <section className="space-y-6 md:space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <span className="text-emerald-600 font-sans font-bold tracking-widest text-sm uppercase">The Solution</span>
                        <h2 className="text-2xl md:text-5xl font-bold leading-tight">AI 기록가, <span className="text-emerald-600">'에코(Echo)'</span>와의 만남</h2>
                    </motion.div>

                    <EchoWaveAnimation />

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="space-y-5 md:space-y-8 text-base md:text-xl text-slate-600 leading-relaxed"
                    >
                        <p>
                            리프노트는 그 망설임에 답하기 위해 시작되었습니다.<br />
                            우리는 차가운 기술이 아닌, 당신의 이야기를 들어주는 따뜻한 기록자 <span className="text-emerald-600 font-bold">에코(Echo)</span>를 만들었습니다.
                        </p>
                        <p className="bg-emerald-50 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-emerald-100 text-sm md:text-base">
                            당신은 그저 편안하게 대화만 하세요.<br />
                            기록가 <span className="text-emerald-600 font-bold">'에코'</span>는 당신의 목소리에서 묻어나는 미세한 떨림과 행간에 숨은 진심을 포착합니다. 당신이 던진 삶의 파동을 다시금 아름다운 문장으로 울려 퍼지게 하여, 가장 문학적인 언어로 다듬어냅니다.
                        </p>
                    </motion.div>
                </section>

                {/* The Process */}
                <section className="space-y-8 md:space-y-12">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <span className="text-emerald-600 font-sans font-bold tracking-widest text-sm uppercase">The Process</span>
                        <h2 className="text-2xl md:text-5xl font-bold leading-tight">대화가 잎이 되고,<br />기록이 숲이 되는 시간</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="p-6 md:p-10 bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl shadow-emerald-900/5 space-y-3 md:space-y-6"
                        >
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-600">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill="currentColor" fillOpacity="0.1" />
                                </svg>
                            </div>
                            <h3 className="text-lg md:text-2xl font-bold text-slate-800">리프 (Leaf)</h3>
                            <p className="text-slate-500 leading-relaxed text-sm md:text-base">
                                하나의 에피소드는 하나의 &apos;리프&apos;가 됩니다. 인터뷰가 진행될수록 당신의 화면 속 나뭇가지는 풍성해집니다.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="p-6 md:p-10 bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl shadow-emerald-900/5 space-y-3 md:space-y-6"
                        >
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-600">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg md:text-2xl font-bold text-slate-800">노트 (Note)</h3>
                            <p className="text-slate-500 leading-relaxed text-sm md:text-base">
                                그 잎들이 모여 당신의 인생을 증명하는 단단한 &apos;노트&apos;가 완성됩니다. 당신이 지나온 계절을 복구하는 과정입니다.
                            </p>
                        </motion.div>
                    </div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center text-sm md:text-xl text-slate-500 pt-4 md:pt-8"
                    >
                        우리는 단순히 종이 뭉치를 만드는 것이 아닙니다.<br />
                        다음 세대에게 전해질 가장 아름다운 유산을 엮어내는 일을 합니다.
                    </motion.p>
                </section>

                {/* Epilogue */}
                <section className="text-center space-y-6 md:space-y-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <span className="text-emerald-600 font-sans font-bold tracking-widest text-sm uppercase">Epilogue</span>
                        <h2 className="text-2xl md:text-5xl font-bold leading-tight">이제 당신의 이야기를 들려주세요</h2>
                        <p className="text-sm md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            떨어지는 낙엽은 끝을 의미하지만, 기록된 잎사귀는 영원히 푸릅니다.<br />
                            당신이라는 숲이 사라지기 전에, 그 찬란했던 계절의 기록을 리프노트와 함께 시작하세요.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="pt-6 md:pt-12"
                    >
                        <Link href="/onboarding">
                            <Button size="lg" className="px-8 md:px-12 py-5 md:py-8 text-base md:text-xl rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-100 transition-all active:scale-95">
                                내 이야기 시작하기
                            </Button>
                        </Link>
                        <p className="mt-4 md:mt-8 text-emerald-600 font-medium text-sm md:text-base">당신의 대화가 한 권의 잎이 되는 시간, 리프노트.</p>
                    </motion.div>
                </section>
            </main>

            <footer className="border-t border-slate-200/50 py-8 md:py-16 bg-white/50">
                <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
                    <p className="text-slate-400 text-[10px] md:text-sm tracking-wider uppercase">© 2026 LeafNote • Narrative AI Publishing Platform</p>
                </div>
            </footer>
        </div>
    );
}
