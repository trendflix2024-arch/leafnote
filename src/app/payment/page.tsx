"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Shield, Zap, Crown, Star, ArrowRight, Tag, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

const PLAN_TIERS = [
    {
        tier: 'free',
        name: '무료',
        monthlyPrice: 0,
        yearlyPrice: 0,
        desc: '리프노트 시작하기',
        color: 'from-slate-400 to-slate-500',
        icon: null,
        features: ['AI 인터뷰 10회', '프로젝트 1개', '미리보기', 'AI 교정 1회/월', 'TTS 1회/월'],
        popular: false,
    },
    {
        tier: 'basic',
        name: '베이직',
        monthlyPrice: 6900,
        yearlyPrice: 69000,
        desc: '언제든지 해지 가능',
        color: 'from-blue-400 to-blue-600',
        icon: Zap,
        features: ['AI 인터뷰 20회', '프로젝트 1개', 'EPUB 다운로드', 'AI 교정 5회/월', 'TTS 10회/월'],
        popular: false,
    },
    {
        tier: 'standard',
        name: '스탠다드',
        monthlyPrice: 12900,
        yearlyPrice: 129000,
        desc: '가장 인기 있는 플랜',
        color: 'from-emerald-500 to-teal-600',
        icon: Star,
        features: ['AI 인터뷰 무제한', '프로젝트 3개', 'PDF + EPUB', 'AI 교정 20회/월', 'TTS 무제한'],
        popular: true,
    },
    {
        tier: 'pro',
        name: '프로',
        monthlyPrice: 24900,
        yearlyPrice: 249000,
        desc: '모든 기능 무제한',
        color: 'from-purple-500 to-indigo-600',
        icon: Crown,
        features: ['AI 인터뷰 무제한', '프로젝트 무제한', 'PDF + EPUB', 'AI 교정 무제한', 'TTS 무제한'],
        popular: false,
    },
];

export default function PaymentPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isYearly, setIsYearly] = useState(false);
    const [selectedTier, setSelectedTier] = useState('standard');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const planParam = searchParams.get('plan');
        if (planParam) {
            const [tier, period] = planParam.split('_');
            if (tier) setSelectedTier(tier);
            if (period === 'yearly') setIsYearly(true);
        }
    }, [searchParams]);

    const selectedPlanId = selectedTier === 'free' ? 'free' : `${selectedTier}_${isYearly ? 'yearly' : 'monthly'}`;
    const selectedPlanData = PLAN_TIERS.find(p => p.tier === selectedTier)!;
    const selectedPrice = isYearly ? selectedPlanData.yearlyPrice : selectedPlanData.monthlyPrice;

    // 쿠폰
    const [showCoupon, setShowCoupon] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [couponStatus, setCouponStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [couponMsg, setCouponMsg] = useState('');

    const handlePayment = async () => {
        if (selectedTier === 'free') {
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

            const orderId = `leafnote-${selectedPlanId}-${Date.now()}`;
            const userId = (session.user as any).id as string;

            const payment = tossPayments.payment({ customerKey: userId });
            await payment.requestPayment({
                method: 'CARD',
                amount: { currency: 'KRW', value: selectedPrice },
                orderId,
                orderName: `리프노트 ${selectedPlanData.name} ${isYearly ? '연간' : '월간'}`,
                successUrl: `${window.location.origin}/payment/success?plan=${selectedPlanId}`,
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

    const handleCoupon = async () => {
        if (!couponCode.trim()) return;
        if (!session?.user) { router.push('/login'); return; }

        setCouponStatus('loading');
        try {
            const res = await fetch('/api/coupon/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode }),
            });
            const data = await res.json();

            if (data.success) {
                const expire = new Date(data.expiresAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
                setCouponMsg(`🎉 ${expire}까지 무료 구독이 활성화되었어요!`);
                setCouponStatus('success');
                setTimeout(() => router.push('/dashboard'), 2500);
            } else {
                const msgs: Record<string, string> = {
                    COUPON_NOT_FOUND: '존재하지 않는 쿠폰 코드예요.',
                    COUPON_EXHAUSTED: '이미 소진된 쿠폰이에요.',
                    COUPON_ALREADY_USED: '이미 사용하신 쿠폰이에요.',
                };
                setCouponMsg(msgs[data.error] || '쿠폰 적용에 실패했어요.');
                setCouponStatus('error');
            }
        } catch {
            setCouponMsg('네트워크 오류가 발생했어요.');
            setCouponStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-[#faf9f6]">
            <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-800 mb-3">구독 플랜</h1>
                    <p className="text-slate-500">나의 이야기를 책으로 만드는 여정, 함께해요</p>
                </div>

                {/* 월간/연간 토글 */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <span className={`text-sm font-medium ${!isYearly ? 'text-slate-800' : 'text-slate-400'}`}>월간</span>
                    <button
                        onClick={() => setIsYearly(v => !v)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${isYearly ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isYearly ? 'translate-x-7' : ''}`} />
                    </button>
                    <span className={`text-sm font-medium ${isYearly ? 'text-slate-800' : 'text-slate-400'}`}>
                        연간
                        <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">2개월 무료</span>
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {PLAN_TIERS.map((plan, i) => {
                        const Icon = plan.icon;
                        const isSelected = selectedTier === plan.tier;
                        const displayPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                        return (
                            <motion.div
                                key={plan.tier}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                onClick={() => setSelectedTier(plan.tier)}
                                className={`relative cursor-pointer rounded-2xl p-5 transition-all ${
                                    isSelected
                                        ? 'ring-2 ring-emerald-500 shadow-xl scale-[1.02] bg-white'
                                        : 'bg-white shadow-sm border border-slate-100 hover:shadow-md'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                                        가장 인기 🌟
                                    </div>
                                )}

                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-white font-medium bg-gradient-to-r ${plan.color} mb-3`}>
                                    {Icon && <Icon size={12} />}
                                    {plan.name}
                                </div>

                                <div className="mb-1">
                                    <span className="text-2xl font-bold text-slate-800">
                                        {displayPrice === 0 ? '무료' : `₩${displayPrice.toLocaleString()}`}
                                    </span>
                                    {displayPrice > 0 && (
                                        <span className="text-slate-400 text-xs ml-1">{isYearly ? '/년' : '/월'}</span>
                                    )}
                                </div>
                                {isYearly && displayPrice > 0 && (
                                    <p className="text-xs text-emerald-600 font-medium mb-2">
                                        월 ₩{Math.round(displayPrice / 12).toLocaleString()}
                                    </p>
                                )}
                                <p className="text-xs text-slate-400 mb-4">{plan.desc}</p>

                                <ul className="space-y-2">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-start gap-1.5 text-xs">
                                            <Check size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                                            <span className="text-slate-600">{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                {isSelected && (
                                    <div className="mt-3 pt-3 border-t border-emerald-100 text-center">
                                        <span className="text-xs font-bold text-emerald-600">✓ 선택됨</span>
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
                        className="px-12 py-6 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-full font-bold"
                    >
                        {isLoading ? '처리 중...' : selectedTier === 'free' ? '무료로 시작' : '구독 시작하기'}
                        {!isLoading && <ArrowRight className="ml-2" size={20} />}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                        <Shield size={13} />
                        <span>토스페이먼츠로 안전하게 결제 · 언제든지 해지 가능</span>
                    </div>

                    {/* 쿠폰 섹션 */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <button
                            onClick={() => setShowCoupon(v => !v)}
                            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mx-auto"
                        >
                            <Tag size={14} />
                            쿠폰 코드가 있으신가요?
                            <ChevronDown size={14} className={`transition-transform ${showCoupon ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {showCoupon && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 flex gap-2 max-w-sm mx-auto">
                                        <input
                                            value={couponCode}
                                            onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponStatus('idle'); }}
                                            onKeyDown={e => e.key === 'Enter' && handleCoupon()}
                                            placeholder="쿠폰 코드 입력"
                                            disabled={couponStatus === 'loading' || couponStatus === 'success'}
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none font-mono tracking-wider uppercase"
                                        />
                                        <button
                                            onClick={handleCoupon}
                                            disabled={couponStatus === 'loading' || couponStatus === 'success' || !couponCode.trim()}
                                            className="px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                                        >
                                            {couponStatus === 'loading' ? <Loader2 size={14} className="animate-spin" /> : '적용'}
                                        </button>
                                    </div>

                                    {couponStatus !== 'idle' && couponStatus !== 'loading' && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`mt-2 text-sm text-center font-medium ${couponStatus === 'success' ? 'text-emerald-600' : 'text-red-500'}`}
                                        >
                                            {couponMsg}
                                        </motion.p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
