"use client";
// DEPLOY_MARKER: 2026-03-02 15:15 - Fix Icon Overlap

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, ArrowRight, BookOpen, Search, KeyRound, X } from 'lucide-react';
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
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [remember, setRemember] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [findModal, setFindModal] = useState<'none' | 'find-id' | 'reset-pw'>('none');
    const [findName, setFindName] = useState('');
    const [findId, setFindId] = useState('');
    const [findResult, setFindResult] = useState('');
    const [findError, setFindError] = useState('');
    const [findLoading, setFindLoading] = useState(false);

    const handleFindId = async () => {
        if (!findName) { setFindError('성함을 입력해주세요.'); return; }
        setFindLoading(true); setFindError(''); setFindResult('');
        try {
            const res = await fetch('/api/auth/find', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'find-id', name: findName })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setFindResult(`${data.message}\n아이디: ${data.ids.join(', ')}`);
        } catch (err: any) { setFindError(err.message); }
        finally { setFindLoading(false); }
    };

    const handleResetPw = async () => {
        if (!findId) { setFindError('아이디를 입력해주세요.'); return; }
        setFindLoading(true); setFindError(''); setFindResult('');
        try {
            const res = await fetch('/api/auth/find', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'reset-password', id: findId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setFindResult(data.message);
        } catch (err: any) { setFindError(err.message); }
        finally { setFindLoading(false); }
    };

    const openFindModal = (type: 'find-id' | 'reset-pw') => {
        setFindModal(type);
        setFindName(''); setFindId(''); setFindResult(''); setFindError('');
    };

    useEffect(() => {
        if (status === 'authenticated') {
            router.push(callbackUrl);
        }
    }, [status, router, callbackUrl]);

    const handleLoginOrRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginId || !password) {
            setError('아이디와 비밀번호를 입력해주세요.');
            return;
        }
        if (mode === 'register' && !name) {
            setError('작가님 성함을 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                id: loginId,
                password: password,
                name: mode === 'register' ? name : '',
                redirect: false,
                callbackUrl
            });

            if (result?.error) {
                setError(result.error === 'CredentialsSignin' ? '로그인 정보가 일치하지 않습니다.' : result.error);
            } else {
                router.push(callbackUrl);
            }
        } catch (err: any) {
            setError('오류가 발생했습니다. 다시 시도해주세요.');
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
                                onClick={() => { setMode(m); setError(''); }}
                                className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${mode === m ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {m === 'login' ? '로그인' : '회원가입'}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-medium flex items-center justify-center text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLoginOrRegister} className="space-y-6">
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-focus-within:bg-emerald-600 group-focus-within:text-white transition-all">
                                <User size={20} />
                            </div>
                            <Input
                                type="text"
                                value={loginId}
                                onChange={(e) => setLoginId(e.target.value)}
                                placeholder="아이디"
                                className="pl-20 bg-slate-50 border-2 border-transparent focus:border-emerald-500 py-8 rounded-[1.5rem] text-xl font-medium placeholder:text-slate-300 transition-all shadow-inner w-full"
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-focus-within:bg-emerald-600 group-focus-within:text-white transition-all">
                                <BookOpen size={20} />
                            </div>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호"
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

                        <div className="flex items-center gap-2 px-2">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-200 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="remember" className="text-sm font-medium text-slate-500 cursor-pointer">
                                로그인 상태 유지
                            </label>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-9 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl shadow-xl shadow-emerald-100 transition-all active:scale-[0.98] border-none flex items-center justify-center gap-3"
                            >
                                <span>{isLoading ? '처리 중...' : (mode === 'login' ? '기록 시작하기' : '회원가입 하기')}</span>
                                <ArrowRight size={24} />
                            </Button>
                        </div>
                    </form>

                    {/* Find ID / Reset Password Links */}
                    <div className="flex justify-center gap-4 mt-5">
                        <button
                            type="button"
                            onClick={() => openFindModal('find-id')}
                            className="text-xs text-slate-400 hover:text-emerald-600 font-medium transition-colors"
                        >
                            아이디 찾기
                        </button>
                        <span className="text-slate-200">|</span>
                        <button
                            type="button"
                            onClick={() => openFindModal('reset-pw')}
                            className="text-xs text-slate-400 hover:text-emerald-600 font-medium transition-colors"
                        >
                            비밀번호 찾기
                        </button>
                    </div>

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
            {/* Find ID / Reset PW Modal */}
            {findModal !== 'none' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setFindModal('none')}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                {findModal === 'find-id' ? (
                                    <><Search size={20} className="text-emerald-600" /> 아이디 찾기</>
                                ) : (
                                    <><KeyRound size={20} className="text-emerald-600" /> 비밀번호 찾기</>
                                )}
                            </h2>
                            <button onClick={() => setFindModal('none')} className="text-slate-300 hover:text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {findModal === 'find-id' ? (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-500">회원가입 시 입력한 성함을 입력해주세요.</p>
                                <Input
                                    value={findName}
                                    onChange={(e) => setFindName(e.target.value)}
                                    placeholder="작가님 성함"
                                    className="bg-slate-50 border-2 border-transparent focus:border-emerald-500 py-6 rounded-xl text-base font-medium placeholder:text-slate-300"
                                    onKeyDown={(e) => e.key === 'Enter' && handleFindId()}
                                />
                                <Button
                                    onClick={handleFindId}
                                    disabled={findLoading}
                                    className="w-full py-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg"
                                >
                                    {findLoading ? '조회 중...' : '아이디 찾기'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-500">등록된 아이디를 입력하시면 비밀번호를 초기화해 드립니다.</p>
                                <Input
                                    value={findId}
                                    onChange={(e) => setFindId(e.target.value)}
                                    placeholder="아이디"
                                    className="bg-slate-50 border-2 border-transparent focus:border-emerald-500 py-6 rounded-xl text-base font-medium placeholder:text-slate-300"
                                    onKeyDown={(e) => e.key === 'Enter' && handleResetPw()}
                                />
                                <Button
                                    onClick={handleResetPw}
                                    disabled={findLoading}
                                    className="w-full py-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg"
                                >
                                    {findLoading ? '처리 중...' : '비밀번호 초기화'}
                                </Button>
                            </div>
                        )}

                        {findError && (
                            <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl text-center font-medium">
                                {findError}
                            </div>
                        )}
                        {findResult && (
                            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl text-center font-medium whitespace-pre-line">
                                {findResult}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
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
