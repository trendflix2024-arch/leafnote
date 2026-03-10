"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, MessageCircle, Mail, Home } from 'lucide-react';
import { MagicFrameLayout } from '@/components/magic-frame/MagicFrameLayout';

export default function MagicFrameComplete() {
    const router = useRouter();
    const [result, setResult] = useState<{ imageUrl: string; name: string } | null>(null);

    useEffect(() => {
        const raw = sessionStorage.getItem('magic_frame_result');
        if (!raw) {
            router.replace('/magic-frame');
            return;
        }
        try {
            setResult(JSON.parse(raw));
        } catch {
            router.replace('/magic-frame');
        }
    }, [router]);

    if (!result) return null;

    return (
        <MagicFrameLayout>
            <div className="max-w-md mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6"
                >
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} className="text-emerald-600" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">제출이 완료되었습니다!</h1>
                        <p className="text-sm text-slate-500">
                            {result.name}님의 사진이 성공적으로 저장되었습니다.<br />
                            소중한 매직액자를 곧 만나보실 수 있습니다.
                        </p>
                    </div>

                    {/* Preview */}
                    {result.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                            <img src={result.imageUrl} alt="제출된 사진" className="w-full" />
                        </div>
                    )}

                    {/* Contact */}
                    <div className="bg-slate-50 rounded-2xl p-5 space-y-3 text-sm">
                        <p className="text-slate-500 font-medium">수정이 필요하신 경우 아래로 문의해 주세요</p>
                        <div className="flex flex-col gap-2">
                            <a href="https://pf.kakao.com/_placeholder" target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-400 text-white font-bold rounded-xl hover:bg-amber-500 transition-colors">
                                <MessageCircle size={16} /> 카카오톡 채널 문의
                            </a>
                            <a href="mailto:support@example.com"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                                <Mail size={16} /> 이메일 문의
                            </a>
                        </div>
                    </div>

                    <button onClick={() => router.push('/magic-frame')}
                        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto transition-colors">
                        <Home size={12} /> 처음으로 돌아가기
                    </button>
                </motion.div>
            </div>
        </MagicFrameLayout>
    );
}
