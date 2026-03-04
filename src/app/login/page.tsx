"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Leaf } from 'lucide-react';

const BENEFITS = [
    "AI 기록가 에코와 함께하는 따뜻한 인터뷰",
    "소중한 기억이 아름다운 한 권의 책으로",
    "베타 기간 동안 100% 무료 제공",
];

function LoginContent() {
    const { status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    useEffect(() => {
        if (status === 'authenticated') {
            router.push(callbackUrl);
        }
    }, [status, router, callbackUrl]);

    const handleGoogleLogin = () => {
        signIn('google', { callbackUrl });
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-teal-100/30 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex flex-col items-center gap-4 group cursor-pointer">
                        <motion.div
                            whileHover={{ scale: 1.08, rotate: -3 }}
                            className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-200/60"
                        >
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill="white" fillOpacity="0.2" />
                                <path d="M12 22V2M12 22C12 22 20 18 20 12C20 6 12 2 12 2M12 22C12 22 4 6 4 12C4 18 12 22 12 22ZM12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 15C13.5 15 15 15.5 15 17M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14M12 15C10.5 15 9 15.5 9 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </motion.div>
                        <div>
                            <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                                리프노트
                            </h1>
                            <p className="text-emerald-600 text-sm font-medium mt-1 tracking-widest uppercase">
                                LeafNote
                            </p>
                        </div>
                    </Link>
                    <p className="text-slate-500 text-base font-serif mt-4 leading-relaxed">
                        당신의 대화가 한 권의 잎이 되는 시간
                    </p>
                </div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200/60 border border-slate-100/80"
                >
                    {/* Benefits */}
                    <div className="mb-8 space-y-3">
                        {BENEFITS.map((benefit, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                    <Leaf size={10} className="text-emerald-600" />
                                </div>
                                <p className="text-sm text-slate-600 font-serif leading-snug">{benefit}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-8" />

                    {/* Google Login Button */}
                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-4 bg-white border-2 border-slate-200 hover:border-emerald-400 text-slate-700 font-bold text-lg py-5 px-6 rounded-2xl transition-all shadow-sm"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google 계정으로 시작하기
                    </motion.button>

                    {/* Notice */}
                    <div className="mt-6 flex items-start gap-2 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                        <Sparkles size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-700 font-serif leading-relaxed">
                            Google 계정으로 간편하게 시작하세요. 별도 가입이 필요 없으며, 처음 오시는 분께는 작가명을 설정할 기회가 드려집니다.
                        </p>
                    </div>
                </motion.div>

                <p className="text-center text-slate-400 text-[10px] mt-8 uppercase tracking-[0.2em]">
                    © 2026 LeafNote • Narrative AI Publishing
                </p>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <React.Suspense fallback={
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-serif text-slate-400">
                로딩 중...
            </div>
        }>
            <LoginContent />
        </React.Suspense>
    );
}
