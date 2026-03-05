"use client";

import { motion } from 'framer-motion';
import { Sprout, ArrowRight, Sparkles, TreePine, Medal, Leaf } from 'lucide-react';
import { Logo } from '@/components/Logo';

const floatingLeaves = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: `${10 + (i * 11) % 80}%`,
    delay: i * 0.7,
    duration: 6 + (i % 3) * 2,
    size: 10 + (i % 3) * 4,
    rotate: (i % 2 === 0 ? 1 : -1) * (20 + i * 15),
}));

export default function WelcomePage() {
    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 px-4 py-12">

            {/* Ambient glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-[140px] pointer-events-none" />

            {/* Floating leaves */}
            {floatingLeaves.map((leaf) => (
                <motion.div
                    key={leaf.id}
                    className="absolute top-0 text-emerald-400/30 pointer-events-none"
                    style={{ left: leaf.left }}
                    initial={{ y: -40, opacity: 0, rotate: 0 }}
                    animate={{
                        y: ['0vh', '110vh'],
                        opacity: [0, 0.6, 0.6, 0],
                        rotate: [0, leaf.rotate],
                    }}
                    transition={{
                        duration: leaf.duration,
                        delay: leaf.delay,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                >
                    <Leaf size={leaf.size} />
                </motion.div>
            ))}

            {/* Content */}
            <div className="relative z-10 w-full max-w-lg text-center flex flex-col items-center gap-8 md:gap-10">

                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="flex flex-col items-center gap-3"
                >
                    <Logo size="lg" variant="dark" href="/" showText={false} />
                </motion.div>

                {/* Founding member badge */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-amber-400/20 border border-amber-400/40 rounded-full backdrop-blur-sm"
                >
                    <Sparkles size={13} className="text-amber-300 animate-pulse" />
                    <span className="text-amber-200 text-xs font-bold tracking-widest uppercase">베타 창립 멤버</span>
                </motion.div>

                {/* Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                >
                    <h1 className="text-4xl xs:text-5xl md:text-6xl font-serif font-bold text-white leading-[1.2] tracking-tight break-keep">
                        작가님을<br />
                        <span className="text-emerald-300">오래 기다렸습니다.</span>
                    </h1>
                </motion.div>

                {/* Echo's message bubble */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="w-full bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 md:p-8 text-left shadow-2xl"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/50 shrink-0">
                            <Sprout size={16} className="text-white" />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Sparkles size={11} className="text-emerald-300" />
                            <span className="text-xs font-bold text-emerald-300 uppercase tracking-tight">따뜻한 기록가 에코</span>
                        </div>
                    </div>
                    <p className="text-white/85 font-serif text-base md:text-lg leading-relaxed break-keep">
                        "처음으로 저를 찾아와 주셔서 진심으로 감사드립니다. 작가님의 소중한 기억 하나하나를, 제가 정성껏 한 권의 책으로 담아드리겠습니다. 지금 이 순간부터, 당신의 이야기가 시작됩니다."
                    </p>
                </motion.div>

                {/* Benefits */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.6 }}
                    className="flex flex-wrap justify-center gap-3"
                >
                    {[
                        { icon: Leaf, text: '베타 기간 100% 무료' },
                        { icon: TreePine, text: '책 완성 시 나무 기부' },
                        { icon: Medal, text: '창립 멤버 전용 혜택' },
                    ].map(({ icon: Icon, text }, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-800/50 border border-emerald-600/40 rounded-full"
                        >
                            <Icon size={13} className="text-emerald-300 shrink-0" />
                            <span className="text-emerald-100 text-xs font-bold font-sans whitespace-nowrap">{text}</span>
                        </div>
                    ))}
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4, duration: 0.6 }}
                    className="flex flex-col items-center gap-3 w-full"
                >
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => window.location.href = '/onboarding'}
                        className="group w-full sm:w-auto px-10 md:px-14 py-5 md:py-6 bg-white text-emerald-900 font-serif font-bold text-lg md:text-xl rounded-full shadow-2xl shadow-emerald-950/50 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-3"
                    >
                        나의 첫 이야기 시작하기
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                    <p className="text-emerald-400/70 text-sm font-serif">
                        에코가 첫 번째 질문을 준비하고 있어요.
                    </p>
                </motion.div>

            </div>

            {/* Bottom copyright */}
            <div className="absolute bottom-6 text-emerald-700 text-[10px] tracking-[0.2em] uppercase">
                © 2026 LeafNote · Narrative AI Publishing
            </div>
        </div>
    );
}
