"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, MessageCircle, PenTool, TreePine, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const GuideStep = ({ icon: Icon, step, title, description, color, delay }: { icon: any, step: string, title: string, description: React.ReactNode, color: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay }}
        className="relative pl-12 pb-20 last:pb-0"
    >
        {/* Connection Line */}
        <div className="absolute left-[19px] top-10 bottom-0 w-[2px] bg-emerald-50 last:hidden" />

        {/* Step Icon */}
        <div className={`absolute left-0 top-0 w-10 h-10 rounded-full ${color} flex items-center justify-center shadow-lg border-4 border-[#FAF9F6] z-10`}>
            <Icon size={18} className="text-white" />
        </div>

        <div className="space-y-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                Step {step}
            </div>
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 tracking-tight">{title}</h3>
            <p className="text-slate-500 font-serif text-lg leading-relaxed max-w-2xl">
                {description}
            </p>
        </div>
    </motion.div>
);

export default function GuideStartPage() {
    return (
        <div className="min-h-screen bg-[#FAF9F6] selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
            {/* Header */}
            <nav className="p-6 sticky top-0 z-50 backdrop-blur-md bg-white/40 border-b border-white/20">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100/50 group-hover:scale-105 transition-transform">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill="white" fillOpacity="0.2" />
                                <path d="M12 22V2M12 22C12 22 20 18 20 12C20 6 12 2 12 2M12 22C12 22 4 6 4 12C4 18 12 22 12 22ZM12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 15C13.5 15 15 15.5 15 17M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14M12 15C10.5 15 9 15.5 9 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span className="text-xl font-serif font-bold text-slate-800 tracking-tight">리프노트 <span className="text-emerald-600">LeafNote</span></span>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" className="text-slate-500 hover:text-slate-800">
                            <ArrowLeft className="mr-2 h-4 w-4" /> 뒤로가기
                        </Button>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="max-w-4xl mx-auto px-6 pt-24 pb-32 text-center space-y-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold tracking-[0.2em] uppercase mb-6">User Guide</span>
                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-slate-900 leading-tight tracking-tight">
                        당신의 이야기가<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">숲이 되는 여정</span>
                    </h1>
                    <p className="text-xl text-slate-500 font-serif mt-8 max-w-2xl mx-auto leading-relaxed">
                        한 권의 책을 완성하는 과정은 쉽고 즐거워야 합니다.<br />
                        리프노트와 함께 시작하는 네 가지 단계를 소개합니다.
                    </p>
                </motion.div>
            </header>

            {/* Steps Section */}
            <main className="max-w-3xl mx-auto px-6 pb-40">
                <div className="space-y-4">
                    <GuideStep
                        icon={Sprout}
                        step="01"
                        title="기억의 씨앗 심기 (Setting)"
                        description="가장 먼저 기록하고 싶은 주제를 고르고 필명을 정합니다. 수필, 태교 일기, 커리어 회고록 등 당신의 삶이 담길 가장 첫 번째 그릇을 준비하는 단계입니다."
                        color="bg-emerald-500"
                        delay={0.1}
                    />
                    <GuideStep
                        icon={MessageCircle}
                        step="02"
                        title="에코와 대화하기 (Interview)"
                        description={<>AI 기록가 <span className="text-emerald-600 font-medium">'에코(Echo)'</span>는 당신의 이야기를 진심으로 궁금해합니다. 편안하게 대화하듯 답변하세요. <span className="text-emerald-600 font-medium">에코</span>는 당신의 목소리 행간에 숨은 감정까지 포착하여 질문을 이어갑니다.</>}
                        color="bg-teal-500"
                        delay={0.2}
                    />
                    <GuideStep
                        icon={PenTool}
                        step="03"
                        title="잎사귀 다듬기 (Refinement)"
                        description={<>나눈 대화들은 <span className="text-emerald-600 font-medium">에코</span>의 Literary Touch를 거쳐 아름다운 문장인 '리프(Leaf)'로 탄생합니다. 당신은 그저 내용을 확인하고 원하는 대로 조금씩 다듬어주기만 하면 됩니다.</>}
                        color="bg-emerald-600"
                        delay={0.3}
                    />
                    <GuideStep
                        icon={TreePine}
                        step="04"
                        title="하나의 숲 완성하기 (Publish)"
                        description="모든 이야기가 모여 한 권의 '노트(Note)'가 되면, 우리는 실제 종이책으로 출판함과 동시에 당신의 이름으로 한 그루의 나무를 실제로 심어 미래의 숲을 가꿉니다."
                        color="bg-emerald-700"
                        delay={0.4}
                    />
                </div>

                {/* Call to action */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-32 p-12 bg-white rounded-[3rem] shadow-2xl shadow-emerald-900/5 text-center space-y-8 border border-white"
                >
                    <div className="w-20 h-20 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-inner">
                        <Sparkles className="text-emerald-600" size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-slate-800 mb-4">지금 바로 첫 번째 씨앗을 심어보세요</h2>
                        <p className="text-slate-500 font-serif">당신의 모든 대화는 소중한 역사가 됩니다.</p>
                    </div>
                    <Link href="/onboarding">
                        <Button size="lg" className="px-10 py-7 text-lg rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100/50 transition-all active:scale-95">
                            기록 시작하기 <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="py-20 border-t border-slate-100 bg-white/50 text-center">
                <p className="text-slate-400 text-sm font-serif">© 2026 LeafNote • Growing your story, leaf by leaf.</p>
            </footer>
        </div>
    );
}
