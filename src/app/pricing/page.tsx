"use client";

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Sparkles, BookOpen, Printer, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

const PLANS = [
    {
        id: 'free',
        name: '기본형',
        price: '무료',
        badge: 'Freemium',
        badgeColor: 'bg-green-100 text-green-700',
        features: ['1개 챕터 작성 체험', 'AI 교정 서비스', '미리보기 지원'],
        limitations: ['전체 챕터 잠금', 'PDF 다운로드 불가'],
        icon: BookOpen,
        cta: '무료로 시작하기',
        popular: false,
    },
    {
        id: 'digital',
        name: 'e북 패키지',
        price: '₩29,900',
        badge: 'Digital',
        badgeColor: 'bg-blue-100 text-blue-700',
        features: ['전체 내용 작성', 'AI 문체 교정', 'PDF/EPUB 소장', '표지 디자인 포함', 'SNS 공유 기능'],
        limitations: [],
        icon: Sparkles,
        cta: '구매하기',
        popular: true,
    },
    {
        id: 'physical',
        name: '제본 패키지',
        price: '₩79,900',
        badge: 'Physical',
        badgeColor: 'bg-amber-100 text-amber-700',
        features: ['e북 패키지 포함', '양장본 1권 제본', '고급 종이 사용', '무료 배송'],
        limitations: [],
        icon: Printer,
        cta: '구매하기',
        popular: false,
    },
    {
        id: 'premium',
        name: '작가 교정 플랜',
        price: '₩199,000',
        badge: 'Premium',
        badgeColor: 'bg-purple-100 text-purple-700',
        features: ['제본 패키지 포함', '전문 편집자 검수', '윤문 및 교정', '3권 제본 포함', '전용 ISBN 발급'],
        limitations: [],
        icon: Crown,
        cta: '프리미엄 시작',
        popular: false,
    },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[#faf9f6] py-12 md:py-20 px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-10 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-5 text-center">
                    <p className="text-emerald-800 font-medium text-sm md:text-base leading-relaxed">
                        🌿 베타 테스트 기간 동안 초고 생성, 커버 디자인, PDF 다운로드까지 제한 없이 사용하실 수 있습니다.<br className="hidden md:block" />
                        <span className="text-emerald-700"> 베타 종료 후에도 베타 참여자분들은 특별 혜택이 제공됩니다.</span>
                    </p>
                </div>

                <div className="text-center mb-16">
                    <span className="px-4 py-2 rounded-full bg-slate-100 text-sm text-slate-600 font-medium">Pricing</span>
                    <h1 className="text-2xl md:text-5xl font-serif font-bold text-slate-800 mt-6 mb-4">당신의 이야기에 맞는 플랜</h1>
                    <p className="text-slate-500 max-w-lg mx-auto">
                        무료로 시작하고, 마음에 들면 업그레이드하세요. 실물 책까지 한 번에.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {PLANS.map((plan, i) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className={`p-6 h-full flex flex-col relative ${plan.popular ? 'ring-2 ring-slate-800 shadow-xl md:scale-105 my-2 md:my-0' : 'shadow-sm'
                                }`}>
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-800 text-white text-xs rounded-full font-medium">
                                        인기
                                    </div>
                                )}
                                <div className="mb-6">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${plan.badgeColor}`}>{plan.badge}</span>
                                    <h3 className="text-xl font-bold mt-3">{plan.name}</h3>
                                    <p className="text-3xl font-bold mt-2">{plan.price}</p>
                                </div>
                                <ul className="space-y-3 flex-1">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2 text-sm">
                                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                    {plan.limitations.map((l) => (
                                        <li key={l} className="flex items-start gap-2 text-sm text-slate-400 line-through">
                                            <span className="h-4 w-4 mt-0.5 shrink-0 text-center">✕</span>
                                            <span>{l}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className={`w-full mt-6 ${plan.popular ? 'bg-slate-800 hover:bg-slate-700' : ''}`}
                                    variant={plan.popular ? 'default' : 'outline'}
                                    onClick={() => {
                                        if (plan.id === 'free') window.location.href = '/onboarding';
                                        else alert('결제 시스템 준비 중입니다.');
                                    }}
                                >
                                    {plan.cta}
                                </Button>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-sm text-slate-400">
                        B2B/단체 패키지가 필요하신가요?{' '}
                        <a href="#" className="text-slate-800 underline font-medium">문의하기</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
