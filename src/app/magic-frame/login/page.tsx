"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, ArrowRight, Loader2, AlertCircle, Mail, MessageCircle } from 'lucide-react';
import { MagicFrameLayout } from '@/components/magic-frame/MagicFrameLayout';

function formatPhone(value: string) {
    const nums = value.replace(/[^0-9]/g, '').slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
}

export default function MagicFrameLogin() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) { setError('이름을 입력해 주세요.'); return; }
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10) { setError('올바른 연락처를 입력해 주세요.'); return; }

        setLoading(true);
        try {
            const res = await fetch('/api/magic-frame/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), phone: cleanPhone }),
            });
            const data = await res.json();

            if (data.submitted) {
                setSubmitted(true);
                return;
            }

            if (data.error) { setError(data.error); return; }

            // Save session
            sessionStorage.setItem('magic_frame_session', JSON.stringify({
                userId: data.userId,
                name: name.trim(),
                phone: cleanPhone,
            }));

            router.push('/magic-frame/edit');
        } catch {
            setError('네트워크 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MagicFrameLayout>
            <div className="max-w-md mx-auto px-4 py-12">
                <AnimatePresence mode="wait">
                    {submitted ? (
                        <motion.div key="submitted"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 text-center space-y-5">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle size={28} className="text-amber-600" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">이미 제출이 완료되었습니다</h2>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                사진이 확정되어 제작 중에 있습니다.<br />
                                사진 변경을 원하시면 아래 채널로 문의해 주세요.
                            </p>
                            <div className="flex flex-col gap-2 pt-2">
                                <a href="https://pf.kakao.com/_placeholder" target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-400 text-white font-bold rounded-xl hover:bg-amber-500 transition-colors">
                                    <MessageCircle size={16} /> 카카오톡 채널 문의
                                </a>
                                <a href="mailto:support@example.com"
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                    <Mail size={16} /> 이메일 문의
                                </a>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="form"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-slate-800 mb-2">본인 확인</h1>
                                <p className="text-sm text-slate-400">이름과 연락처를 입력해 주세요</p>
                            </div>

                            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block">이름</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input value={name} onChange={e => setName(e.target.value)}
                                            placeholder="홍길동"
                                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none transition-all" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block">연락처</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input value={phone}
                                            onChange={e => setPhone(formatPhone(e.target.value))}
                                            placeholder="010-1234-5678"
                                            type="tel"
                                            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none transition-all" />
                                    </div>
                                </div>

                                {error && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="text-red-500 text-xs flex items-center gap-1">
                                        <AlertCircle size={12} /> {error}
                                    </motion.p>
                                )}

                                <button type="submit" disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                    {loading ? <><Loader2 size={18} className="animate-spin" /> 확인 중...</>
                                        : <>사진 편집하기 <ArrowRight size={18} /></>}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MagicFrameLayout>
    );
}
