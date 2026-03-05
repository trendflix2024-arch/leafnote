"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'confirming' | 'success' | 'error'>('confirming');
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const paymentKey = searchParams.get('paymentKey');
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');
        const plan = searchParams.get('plan');

        if (!paymentKey || !orderId || !amount || !plan) {
            setStatus('error');
            setErrorMsg('결제 정보가 올바르지 않습니다.');
            return;
        }

        fetch('/api/payment/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), plan }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setExpiresAt(data.expiresAt);
                    setStatus('success');
                } else {
                    setStatus('error');
                    setErrorMsg(data.error || '결제 확인 실패');
                }
            })
            .catch(() => {
                setStatus('error');
                setErrorMsg('서버 오류가 발생했습니다.');
            });
    }, [searchParams]);

    if (status === 'confirming') {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-4 text-amber-500" size={48} />
                    <p className="text-slate-600 font-medium">결제를 확인하고 있습니다...</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-red-500 text-2xl">✕</span>
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">결제 확인 실패</h2>
                    <p className="text-slate-500 mb-6">{errorMsg}</p>
                    <Button onClick={() => router.push('/payment')} className="bg-slate-800 hover:bg-slate-700 rounded-full px-8">
                        다시 시도
                    </Button>
                </div>
            </div>
        );
    }

    const expireDate = expiresAt ? new Date(expiresAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

    return (
        <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center max-w-sm"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <Check size={40} className="text-emerald-600" />
                </motion.div>
                <h2 className="text-3xl font-serif font-bold text-slate-800 mb-2">구독 완료!</h2>
                <p className="text-slate-500 mb-2">이제 리프노트의 모든 기능을 사용하실 수 있어요.</p>
                {expireDate && (
                    <p className="text-sm text-amber-600 font-medium mb-8">구독 만료: {expireDate}</p>
                )}
                <Button
                    onClick={() => router.push('/dashboard')}
                    className="px-8 py-6 text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-full font-bold"
                >
                    대시보드로 이동
                </Button>
            </motion.div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={48} />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
