"use client";
// DEPLOY_MARKER: 2026-03-02 15:15 - Fix Icon Overlap

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, User, ArrowRight, BookOpen, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'authenticated') {
            router.push(callbackUrl);
        }
    }, [status, router, callbackUrl]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone || (mode === 'register' && !name)) {
            setError('모든 정보를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError('');

        const phoneVal = phone.replace(/[^0-9]/g, '');
        const nameVal = mode === 'register' ? name : '';

        console.log('SignIn attempt:', { mode, phone: '***' });

        try {
            // NextAuth v4 credentials signature: signIn('credentials', { ...credentials, redirect, callbackUrl })
            const result = await signIn('credentials', {
                phone: phoneVal,
                name: nameVal,
                redirect: false,
                callbackUrl
            });

            console.log('SignIn result:', result);

            if (result?.error) {
                setError(`로그인 실패 (${result.error}).`);
            } else if (result?.url) {
                router.push(result.url);
            } else {
                router.push(callbackUrl);
            }
        } catch (err: any) {
            console.error('SignIn error:', err);
            setError(`오류 발생: ${err.message || '알 수 없는 오류'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        signIn('google', { callbackUrl });
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] paper-texture flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-3 mb-4 group cursor-pointer">
                        <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-100/60 group-hover:scale-105 transition-transform">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill="white" fillOpacity="0.2" />
                                <path d="M12 22V2M12 22C12 22 20 18 20 12C20 6 12 2 12 2M12 22C12 22 4 6 4 12C4 18 12 22 12 22ZM12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 15C13.5 15 15 15.5 15 17M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14M12 15C10.5 15 9 15.5 9 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">리프노트</h1>
                    </Link>
                    <p className="text-slate-500 text-sm font-medium">당신의 대화가 한 권의 잎이 되는 시간</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-paper-edge leaf-shadow">
                    {/* Tabs */}
                    <div className="flex bg-slate-50 rounded-2xl p-1.5 mb-8">
                        {(['login', 'register'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${mode === m ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {m === 'login' ? '로그인' : '회원가입'}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-medium flex items-center justify-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Phone Number Field - Corrected for senior-friendly login */}
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-focus-within:bg-emerald-600 group-focus-within:text-white transition-all">
                                <Phone size={20} />
                            </div>
                            <Input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="휴대폰 번호 (예: 01012345678)"
                                className="pl-20 bg-slate-50 border-2 border-transparent focus:border-emerald-500 py-8 rounded-[1.5rem] text-xl font-medium placeholder:text-slate-300 transition-all shadow-inner w-full"
                            />
                        </div>

                        {mode === 'register' && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="overflow-hidden"
                            >
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-focus-within:bg-emerald-600 group-focus-within:text-white transition-all">
                                        <User size={20} />
                                    </div>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="작가님 성함"
                                        className="pl-20 bg-slate-50 border-2 border-transparent focus:border-emerald-500 py-8 rounded-[1.5rem] text-xl font-medium placeholder:text-slate-300 transition-all shadow-inner w-full"
                                    />
                                </div>
                            </motion.div>
                        )}

                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-9 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl shadow-xl shadow-emerald-100 transition-all active:scale-[0.98] border-none flex items-center justify-center gap-3"
                            >
                                <span>{isLoading ? '준비 중...' : mode === 'login' ? '기록 시작하기' : '잎사귀 틔우기'}</span>
                                <ArrowRight size={24} />
                            </Button>
                        </div>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest text-slate-400"><span className="bg-white px-4">OR</span></div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full py-7 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
                        onClick={handleGoogleLogin}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" className="mr-1">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Google 계정으로 로그인
                    </Button>
                </div>

                <p className="text-center text-slate-400 text-[10px] mt-8 uppercase tracking-[0.2em]">
                    © 2026 LeafNote • Narrative AI Publishing
                </p>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] p-4 flex items-center justify-center font-serif text-slate-400">로딩 중...</div>}>
            <LoginContent />
        </React.Suspense>
    );
}
