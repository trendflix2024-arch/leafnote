"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, Zap, Crown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const plans = [
    {
        id: 'free',
        name: '무료',
        price: 0,
        period: '',
        desc: '리프노트 시작하기',
        color: 'from-slate-400 to-slate-500',
        icon: null,
        features: ['AI 인터뷰 10회', '원고 생성 1회', 'e북(EPUB) 다운로드'],
        popular: false,
    },
    {
        id: 'monthly',
        name: '월간 구독',
        price: 9900,
        period: '/월',
        desc: '언제든지 해지 가능',
        color: 'from-blue-500 to-indigo-600',
        icon: Zap,
        features: ['AI 인터뷰 무제한', '원고 생성 무제한', 'e북(EPUB) 다운로드', '표지 디자인 6종', 'AI 문체 교정'],
        popular: false,
    },
    {
        id: 'yearly',
        name: '연간 구독',
        price: 79000,
        period: '/년',
        desc: '월 6,583원 · 33% 절약',
        color: 'from-amber-500 to-orange-500',
        icon: Crown,
        features: ['월간 구독 기능 전체 포함', 'AI 음성 TTS', '전용 고객지원', '신규 기능 우선 체험'],
        popular: true,
    },
];

export default function PaymentPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const [isLoading, setIsLoading] = useState(false);

    const handlePayment = async () => {
        if (selectedPlan === 'free') {
            router.push('/dashboard');
            return;
        }

        if (!session?.user) {
            router.push('/login');
            return;
        }

        setIsLoading(true);
        try {
            const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
            if (!clientKey) {
                alert('결제 시스템을 준비 중입니다. 잠시 후 다시 시도해주세요.');
                setIsLoading(false);
                return;
            }

            const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
            const tossPayments = await loadTossPayments(clientKey);

            const plan = plans.find(p => p.id === selectedPlan)!;
            const orderId = `leafnote-${selectedPlan}-${Date.now()}`;
            const userId = (session.user as any).id as string;

            // v2 API: tossPayments.payment({ customerKey }).requestPayment(...)
            const payment = tossPayments.payment({ customerKey: userId });
            await payment.requestPayment({
                method: 'CARD',
                amount: {
                    currency: 'KRW',
                    value: plan.price,
                },
                orderId,
                orderName: `리프노트 ${plan.name}`,
                // Toss가 성공 시 ?paymentKey=&orderId=&amount= 자동 추가
                successUrl: `${window.location.origin}/payment/success?plan=${selectedPlan}`,
                failUrl: `${window.location.origin}/payment/fail`,
                customerName: session.user?.name ?? undefined,
                customerEmail: session.user?.email ?? undefined,
            });
        } catch (err: any) {
            if (err?.code !== 'USER_CANCEL') {
                console.error('Payment error:', err);
                alert('결제 중 오류가 발생했습니다.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#faf9f6]">
            <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-800 mb-3">구독 플랜</h1>
                    <p className="text-slate-500">나의 이야기를 책으로 만드는 여정, 함께해요</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {plans.map((plan, i) => {
                        const Icon = plan.icon;
                        const isSelected = selectedPlan === plan.id;
                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative cursor-pointer rounded-2xl p-6 transition-all ${
                                    isSelected
                                        ? 'ring-2 ring-amber-500 shadow-xl scale-[1.02] bg-white'
                                        : 'bg-white shadow-sm border border-slate-100 hover:shadow-md'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                                        가장 인기 🌟
                                    </div>
                                )}

                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-white font-medium bg-gradient-to-r ${plan.color} mb-4`}>
                                    {Icon && <Icon size={12} />}
                                    {plan.name}
                                </div>

                                <div className="mb-1">
                                    <span className="text-3xl font-bold text-slate-800">
                                        {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}`}
                                    </span>
                                    {plan.period && <span className="text-slate-400 text-sm ml-1">{plan.period}</span>}
                                </div>
                                <p className="text-xs text-slate-400 mb-5">{plan.desc}</p>

                                <ul className="space-y-2.5">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-sm">
                                            <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                            <span className="text-slate-600">{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                {isSelected && (
                                    <div className="mt-4 pt-4 border-t border-amber-100 text-center">
                                        <span className="text-xs font-medium text-amber-600">✓ 선택됨</span>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                <div className="text-center space-y-4">
                    <Button
                        onClick={handlePayment}
                        disabled={isLoading}
                        className="px-12 py-6 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-full font-bold"
                    >
                        {isLoading ? '처리 중...' : selectedPlan === 'free' ? '무료로 시작' : '구독 시작하기'}
                        {!isLoading && <ArrowRight className="ml-2" size={20} />}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                        <Shield size={13} />
                        <span>토스페이먼츠로 안전하게 결제 · 언제든지 해지 가능</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
