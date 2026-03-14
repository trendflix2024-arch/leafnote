"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, BookOpen, Printer, Crown, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const SUBSCRIPTION_PLANS = [
    {
        id: 'free',
        name: '무료',
        badge: 'Free',
        badgeColor: 'bg-slate-100 text-slate-600',
        monthlyPrice: 0,
        yearlyPrice: 0,
        popular: false,
        features: { interview: '10회', project: '1개', output: '미리보기', correction: '1회/월', tts: '1회/월', cover: '기본 1종' },
        cta: '무료로 시작',
        ctaHref: '/onboarding',
    },
    {
        id: 'basic',
        name: '베이직',
        badge: 'Basic',
        badgeColor: 'bg-blue-100 text-blue-700',
        monthlyPrice: 6900,
        yearlyPrice: 69000,
        popular: false,
        features: { interview: '20회', project: '1개', output: 'EPUB', correction: '5회/월', tts: '10회/월', cover: '3종' },
        cta: '베이직 시작',
        ctaHref: '/payment',
    },
    {
        id: 'standard',
        name: '스탠다드',
        badge: 'Standard',
        badgeColor: 'bg-emerald-100 text-emerald-700',
        monthlyPrice: 12900,
        yearlyPrice: 129000,
        popular: true,
        features: { interview: '무제한', project: '3개', output: 'PDF + EPUB', correction: '20회/월', tts: '무제한', cover: '6종' },
        cta: '스탠다드 시작',
        ctaHref: '/payment',
    },
    {
        id: 'pro',
        name: '프로',
        badge: 'Pro',
        badgeColor: 'bg-purple-100 text-purple-700',
        monthlyPrice: 24900,
        yearlyPrice: 249000,
        popular: false,
        features: { interview: '무제한', project: '무제한', output: 'PDF + EPUB', correction: '무제한', tts: '무제한', cover: '전체' },
        cta: '프로 시작',
        ctaHref: '/payment',
    },
];

const ONE_TIME_PACKAGES = [
    {
        id: 'ebook',
        name: 'e북 패키지',
        price: '₩29,900',
        icon: BookOpen,
        color: 'bg-blue-50 border-blue-100',
        iconColor: 'text-blue-500',
        features: ['PDF + EPUB 영구 소장', '표지 디자인 포함', 'SNS 공유 기능'],
    },
    {
        id: 'print',
        name: '제본 패키지',
        price: '₩79,900',
        icon: Printer,
        color: 'bg-amber-50 border-amber-100',
        iconColor: 'text-amber-500',
        features: ['e북 패키지 포함', '양장본 1권 제본', '고급 종이 · 무료 배송'],
    },
    {
        id: 'editorial',
        name: '작가 교정 플랜',
        price: '₩199,000',
        icon: Crown,
        color: 'bg-purple-50 border-purple-100',
        iconColor: 'text-purple-500',
        features: ['제본 패키지 포함', '전문 편집자 검수·윤문', '3권 제본 + ISBN 발급'],
    },
];

const FEATURE_ROWS = [
    { key: 'interview', label: 'AI 인터뷰 횟수' },
    { key: 'project', label: '프로젝트(책) 개수' },
    { key: 'output', label: '출력 포맷' },
    { key: 'correction', label: 'AI 문체 교정' },
    { key: 'tts', label: 'TTS 음성' },
    { key: 'cover', label: '표지 디자인' },
];

export default function PricingPage() {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <div className="min-h-screen bg-[#faf9f6] py-12 md:py-20 px-4 md:px-6">
            <div className="max-w-6xl mx-auto">

                {/* 베타 배너 */}
                <div className="mb-10 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-5 text-center">
                    <p className="text-emerald-800 font-medium text-sm md:text-base leading-relaxed">
                        🌿 베타 테스트 기간 동안 모든 기능을 제한 없이 체험하실 수 있습니다.<br className="hidden md:block" />
                        <span className="text-emerald-700"> 베타 종료 후에도 참여자분들께 특별 혜택이 제공됩니다.</span>
                    </p>
                </div>

                {/* 헤더 */}
                <div className="text-center mb-10">
                    <span className="px-4 py-2 rounded-full bg-slate-100 text-sm text-slate-600 font-medium">Pricing</span>
                    <h1 className="text-2xl md:text-5xl font-serif font-bold text-slate-800 mt-6 mb-4">당신의 이야기에 맞는 플랜</h1>
                    <p className="text-slate-500 max-w-lg mx-auto">무료로 시작하고, 마음에 들면 업그레이드하세요.</p>
                </div>

                {/* 월간/연간 토글 */}
                <div className="flex items-center justify-center gap-4 mb-10">
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

                {/* 플랜 카드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                    {SUBSCRIPTION_PLANS.map((plan, i) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={`relative bg-white rounded-2xl p-6 flex flex-col border ${
                                plan.popular
                                    ? 'ring-2 ring-emerald-500 shadow-xl border-transparent'
                                    : 'border-slate-100 shadow-sm'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-white text-xs rounded-full font-bold whitespace-nowrap">
                                    가장 인기 🌟
                                </div>
                            )}

                            <div className="mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${plan.badgeColor}`}>{plan.badge}</span>
                                <h3 className="text-xl font-bold mt-3 text-slate-800">{plan.name}</h3>
                                <div className="mt-2">
                                    {plan.monthlyPrice === 0 ? (
                                        <span className="text-3xl font-bold text-slate-800">무료</span>
                                    ) : (
                                        <>
                                            <span className="text-3xl font-bold text-slate-800">
                                                ₩{(isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice).toLocaleString()}
                                            </span>
                                            <span className="text-slate-400 text-sm ml-1">/월</span>
                                            {isYearly && (
                                                <p className="text-xs text-emerald-600 font-medium mt-0.5">
                                                    연 ₩{plan.yearlyPrice.toLocaleString()} 청구
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <ul className="space-y-2.5 flex-1 mb-6">
                                {FEATURE_ROWS.map(row => (
                                    <li key={row.key} className="flex items-center justify-between text-sm gap-2">
                                        <span className="text-slate-400 shrink-0">{row.label}</span>
                                        <span className="font-medium text-slate-800 text-right">{plan.features[row.key as keyof typeof plan.features]}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={plan.id === 'free' ? plan.ctaHref : `${plan.ctaHref}?plan=${plan.id}_${isYearly ? 'yearly' : 'monthly'}`}
                                className={`w-full mt-auto block text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                                    plan.popular
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                        : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                                }`}
                            >
                                {plan.cta}
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* 1회성 패키지 구분선 */}
                <div className="flex items-center gap-4 mb-10">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-sm text-slate-400 font-medium whitespace-nowrap">📚 책 완성 패키지 (1회성 구매)</span>
                    <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* 1회성 패키지 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {ONE_TIME_PACKAGES.map((pkg, i) => {
                        const Icon = pkg.icon;
                        return (
                            <motion.div
                                key={pkg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className={`rounded-2xl p-6 border ${pkg.color}`}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                        <Icon size={20} className={pkg.iconColor} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{pkg.name}</h3>
                                        <p className="text-lg font-bold text-slate-800">{pkg.price}</p>
                                    </div>
                                </div>
                                <ul className="space-y-2 mb-5">
                                    {pkg.features.map(f => (
                                        <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                                            <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button variant="outline" className="w-full border-slate-200" onClick={() => alert('결제 시스템 준비 중입니다.')}>
                                    구매하기
                                </Button>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="text-center">
                    <p className="text-sm text-slate-400">
                        B2B/단체 패키지가 필요하신가요?{' '}
                        <a href="#" className="text-slate-800 underline font-medium">문의하기</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
