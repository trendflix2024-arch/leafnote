"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Leaf, ExternalLink, Copy, Check } from 'lucide-react';
import { Logo } from '@/components/Logo';

function isInAppBrowser(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('kakaotalk') || ua.includes('kakaomini') ||
        ua.includes('line/') || ua.includes('instagram') ||
        ua.includes('fbav') || ua.includes('fban');
}

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
    const [inApp, setInApp] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setInApp(isInAppBrowser());
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            router.push(callbackUrl);
        }
    }, [status, router, callbackUrl]);

    const handleGoogleLogin = () => {
        signIn('google', { callbackUrl });
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (inApp) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-teal-100/30 rounded-full blur-3xl pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md relative z-10 text-center space-y-6"
                >
                    <div className="inline-flex justify-center mb-2">
                        <Logo size="lg" href="/" />
                    </div>
                    <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200/60 border border-slate-100/80 space-y-5">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
                            <ExternalLink className="w-7 h-7 text-amber-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-slate-800 font-serif">외부 브라우저에서 열어주세요</h2>
                            <p className="text-sm text-slate-500 font-serif leading-relaxed">
                                카카오톡 내부 브라우저에서는 Google 로그인을 사용할 수 없습니다.<br />
                                아래 버튼으로 주소를 복사한 뒤, <span className="font-bold text-slate-700">Safari</span> 또는 <span className="font-bold text-slate-700">Chrome</span>에서 열어주세요.
                            </p>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                        >
                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            {copied ? '복사됐어요!' : '주소 복사하기'}
                        </button>
                        <p className="text-xs text-slate-400 font-serif">
                            복사 후 브라우저 주소창에 붙여넣기 하세요.
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

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
                    <div className="inline-flex justify-center mb-4">
                        <Logo size="xl" href="/" />
                    </div>
                    <p className="text-slate-500 text-base font-serif leading-relaxed">
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
