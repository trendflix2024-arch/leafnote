"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CreditCard, Shield, Clock, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProgressStepper from '@/components/ProgressStepper';

const plans = [
    {
        id: 'free',
        name: '무료 체험',
        price: '0',
        period: '',
        desc: 'AI 인터뷰 체험',
        color: 'from-slate-400 to-slate-500',
        features: ['AI 인터뷰 5회', 'e북 미리보기', '기본 표지 1종'],
        popular: false,
    },
    {
        id: 'basic',
        name: '에코 베이직',
        price: '29,000',
        period: '/권',
        desc: '나만의 첫 번째 책',
        color: 'from-blue-500 to-indigo-600',
        features: ['AI 인터뷰 무제한', 'e북(EPUB) 다운로드', '표지 디자인 3종', 'AI 문체 교정', '챕터 관리'],
        popular: false,
    },
    {
        id: 'premium',
        name: '에코 프리미엄',
        price: '79,000',
        period: '/권',
        desc: '전문 품질의 자서전',
        color: 'from-amber-500 to-orange-500',
        features: ['베이직 기능 전체 포함', 'PDF 고품질 다운로드', '표지 디자인 6종', 'AI 음성 TTS', '전문 에디터 리뷰', '종이책 주문 (별도)'],
        popular: true,
    },
    {
        id: 'family',
        name: '패밀리 패키지',
        price: '199,000',
        period: '/3권',
        desc: '가족의 기록을 한 권에',
        color: 'from-emerald-500 to-teal-600',
        features: ['프리미엄 기능 전체 포함', '최대 3권 제작', '가족 공유 앨범', '종이책 5부 무료 배송', 'VIP 전담 지원'],
        popular: false,
    },
];

export default function PaymentPage() {
    const [selectedPlan, setSelectedPlan] = useState('premium');
    const [step, setStep] = useState<'plan' | 'payment' | 'complete'>('plan');
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setStep('complete');
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#faf9f6]">
            <ProgressStepper />
            <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
                <AnimatePresence mode="wait">
                    {step === 'plan' && (
                        <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="text-center mb-12">
                                <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-800 mb-3">요금제 선택</h1>
                                <p className="text-slate-500">당신의 이야기에 맞는 플랜을 선택하세요</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {plans.map((plan, i) => (
                                    <motion.div
                                        key={plan.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={`relative cursor-pointer rounded-2xl p-6 transition-all ${selectedPlan === plan.id
                                                ? 'ring-2 ring-amber-500 shadow-xl scale-[1.02] bg-white'
                                                : 'bg-white shadow-sm border border-slate-100 hover:shadow-md'
                                            }`}
                                    >
                                        {plan.popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                                                인기
                                            </div>
                                        )}
                                        <div className={`inline-block px-3 py-1 rounded-full text-xs text-white font-medium bg-gradient-to-r ${plan.color} mb-4`}>
                                            {plan.name}
                                        </div>
                                        <div className="mb-4">
                                            <span className="text-3xl font-bold text-slate-800">₩{plan.price}</span>
                                            <span className="text-slate-400 text-sm">{plan.period}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 mb-4">{plan.desc}</p>
                                        <ul className="space-y-2">
                                            {plan.features.map(f => (
                                                <li key={f} className="flex items-start gap-2 text-sm">
                                                    <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                                    <span className="text-slate-600">{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="text-center mt-10">
                                <Button
                                    onClick={() => selectedPlan !== 'free' ? setStep('payment') : (window.location.href = '/interview')}
                                    className="px-12 py-6 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-full"
                                >
                                    {selectedPlan === 'free' ? '무료 체험 시작' : '결제하기'}
                                    <ArrowRight className="ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'payment' && (
                        <motion.div key="payment" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                            <div className="max-w-lg mx-auto">
                                <h2 className="text-2xl font-serif font-bold text-center mb-8">결제 정보 입력</h2>
                                <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-6">
                                    <div className="p-4 bg-slate-50 rounded-xl flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-slate-800">{plans.find(p => p.id === selectedPlan)?.name}</p>
                                            <p className="text-xs text-slate-400">{plans.find(p => p.id === selectedPlan)?.desc}</p>
                                        </div>
                                        <p className="text-lg font-bold">₩{plans.find(p => p.id === selectedPlan)?.price}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm text-slate-600 mb-1 block">카드 번호</label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none" placeholder="0000 0000 0000 0000" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-slate-600 mb-1 block">유효기간</label>
                                                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" placeholder="MM/YY" />
                                            </div>
                                            <div>
                                                <label className="text-sm text-slate-600 mb-1 block">CVC</label>
                                                <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" placeholder="000" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Shield size={14} />
                                        <span>결제 정보는 안전하게 암호화됩니다 (Toss Payments)</span>
                                    </div>

                                    <Button
                                        onClick={handlePayment}
                                        disabled={isProcessing}
                                        className="w-full py-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl text-base font-bold"
                                    >
                                        {isProcessing ? <><Loader2 className="animate-spin mr-2" /> 결제 처리 중...</> : '결제 완료'}
                                    </Button>

                                    <button onClick={() => setStep('plan')} className="text-sm text-slate-400 hover:text-slate-600 w-full text-center">
                                        ← 요금제 다시 선택
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'complete' && (
                        <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <Check size={40} className="text-emerald-600" />
                            </motion.div>
                            <h2 className="text-3xl font-serif font-bold text-slate-800 mb-3">결제가 완료되었습니다!</h2>
                            <p className="text-slate-500 mb-8">이제 에코북의 모든 기능을 사용하실 수 있습니다.</p>
                            <Button
                                onClick={() => window.location.href = '/interview'}
                                className="px-8 py-6 text-lg bg-slate-800 hover:bg-slate-700 rounded-full"
                            >
                                <BookOpen className="mr-2" /> 책 만들기 시작
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
