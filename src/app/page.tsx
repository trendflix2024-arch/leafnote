"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight, BookOpen, Sparkles, CheckCircle2, ChevronDown,
    Book, Baby, Heart, Compass, Briefcase, Plane, Users, Sprout,
    Star, Quote, TreePine, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatPreview } from '@/components/landing/ChatPreview';
import { BackgroundEffects } from '@/components/landing/BackgroundEffects';
import { Logo } from '@/components/Logo';
import { useSession } from 'next-auth/react';
import { useBookStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

// ─── 데이터 ───────────────────────────────────────────────

const TOPICS = [
    { icon: Book, label: '나의 인생 이야기', desc: '평범하지만 위대했던 계절들' },
    { icon: Baby, label: '아이와 함께 자라는 시간', desc: '피어나는 모든 순간의 기록' },
    { icon: Sprout, label: '아이를 기다리는 시간', desc: '새 생명을 기다리는 첫 대화' },
    { icon: Heart, label: '둘이 함께 쓰는 사랑', desc: '소중한 사랑의 문장들' },
    { icon: Briefcase, label: '일과 열정의 자취', desc: '치열하게 쌓아온 경험의 기록' },
    { icon: Plane, label: '세상을 만난 여행', desc: '찬란한 풍경과 깨달음' },
    { icon: Users, label: '가족의 뿌리 깊은 이야기', desc: '다음 세대에 전하는 기억' },
    { icon: Compass, label: '빛나는 취미와 일상', desc: '소소한 발견들의 모음' },
];

const TESTIMONIALS = [
    {
        name: "푸른숨 작가님",
        tag: "인생 자서전",
        text: "에코와 대화 세 번 만에 초고가 나왔어요. 평생 글을 못 쓰던 제가 책을 냈다는 게 믿기지 않아요. 손자에게 남기는 최고의 유산이 되었습니다.",
        stars: 5,
    },
    {
        name: "단풍잎 작가님",
        tag: "고향 회고록",
        text: "고향 집 앞마당의 기억이 다시 살아났어요. 오래전 흐릿해진 장면들이 에코 덕분에 선명하게 글이 되었습니다. 가족들이 읽고 다 같이 울었어요.",
        stars: 5,
    },
    {
        name: "새벽녘 작가님",
        tag: "여행 에세이",
        text: "잊고 지낸 꿈을 기록하며 위로받았습니다. 어려운 시절 혼자 떠난 여행들이 한 편의 에세이가 됐어요. 다시 살아보는 것 같은 느낌이었습니다.",
        stars: 5,
    },
];

const FAQS = [
    {
        q: "정말 100% 무료인가요?",
        a: "베타 테스트 기간 동안은 모든 기능이 완전 무료입니다. 초고 생성, 커버 디자인, PDF 다운로드까지 제한 없이 사용하실 수 있습니다. 베타 종료 후에도 베타 참여자분들은 특별 혜택이 제공됩니다.",
    },
    {
        q: "AI가 쓴 글이라 어색하지 않나요?",
        a: "에코는 작가님의 말투와 감성을 그대로 살려서 씁니다. 단순히 생성하는 것이 아니라, 인터뷰를 통해 꺼낸 실제 기억과 감정을 바탕으로 문학적으로 다듬어 드립니다. 읽어보시면 '내가 쓴 것 같다'는 느낌을 받으실 거예요.",
    },
    {
        q: "글을 전혀 못 써도 괜찮나요?",
        a: "전혀 문제없습니다. 에코가 먼저 질문을 드리고, 작가님은 편안하게 대답만 하시면 됩니다. 대화하듯이 답변하신 내용이 자동으로 아름다운 글이 됩니다.",
    },
    {
        q: "책이 실제로 출판되나요?",
        a: "디지털 책(PDF, EPUB)은 즉시 다운로드하실 수 있습니다. 실물 종이책은 소량 인쇄(POD) 서비스를 통해 1권부터 제작 가능합니다. 실제 책처럼 인쇄되어 배송됩니다.",
    },
    {
        q: "작성 중에 데이터가 사라질까봐 걱정돼요.",
        a: "모든 대화와 인터뷰 내용이 실시간으로 클라우드에 자동 저장됩니다. 브라우저를 닫거나 로그아웃해도 데이터는 안전하게 보관되며, 언제든지 이어서 작성하실 수 있습니다.",
    },
    {
        q: "완성까지 얼마나 걸리나요?",
        a: "에코와의 인터뷰는 자신의 속도로 진행하시면 됩니다. 짧게는 1~2시간, 길게는 며칠에 나눠서 하셔도 됩니다. 인터뷰가 완료되면 초고 생성은 수 분 안에 완성됩니다.",
    },
];

// ─── FAQ 아이템 ───────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-slate-100 last:border-0">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex justify-between items-center py-6 text-left gap-4"
            >
                <span className="text-base md:text-lg font-serif font-bold text-slate-800">{q}</span>
                <ChevronDown
                    size={20}
                    className={`text-slate-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && (
                <motion.p
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pb-6 text-base text-slate-500 font-serif leading-relaxed"
                >
                    {a}
                </motion.p>
            )}
        </div>
    );
}

// ─── 책 목업 ───────────────────────────────────────────────

function BookMockup() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative mx-auto w-fit"
        >
            <div className="absolute -left-4 top-4 w-56 h-72 md:w-72 md:h-96 bg-emerald-800/20 rounded-2xl blur-sm" />
            <div className="relative w-56 h-72 md:w-72 md:h-96 bg-gradient-to-br from-emerald-700 to-teal-800 rounded-2xl shadow-2xl shadow-emerald-900/30 overflow-hidden border border-emerald-600/30">
                <div className="absolute left-8 top-0 bottom-0 w-[1px] bg-white/10" />
                <div className="absolute left-9 top-0 bottom-0 w-[2px] bg-black/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md">
                        <BookOpen size={20} className="text-white" />
                    </div>
                    <div className="w-8 h-[1px] bg-white/30 mb-4" />
                    <p className="text-white font-serif font-bold text-xl leading-tight mb-3">봄날의<br />기억들</p>
                    <div className="w-8 h-[1px] bg-white/30 mb-4" />
                    <p className="text-white/60 text-xs font-serif tracking-widest">푸른숨 작가님 著</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            </div>
            <div className="absolute -right-2 top-2 bottom-2 w-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-r-lg" style={{ boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.05)' }} />
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl px-4 py-3 border border-slate-100"
            >
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-500" />
                    <span className="text-xs font-bold text-slate-700">AI 인터뷰로 완성</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">에코와 대화 5회 → 초고 완성</p>
            </motion.div>
        </motion.div>
    );
}

// ─── 메인 페이지 ──────────────────────────────────────────

export default function Home() {
    const { data: session } = useSession();
    const { userProfile } = useBookStore();
    const router = useRouter();

    return (
        <div className="min-h-screen relative selection:bg-emerald-100 selection:text-emerald-900">

            <BackgroundEffects />

            {/* 네비 */}
            <nav className="p-4 md:p-6 flex justify-between items-center max-w-7xl mx-auto sticky top-0 z-50 backdrop-blur-md bg-white/40 border-b border-white/20">
                <Logo size="sm" />
                <div className="flex gap-3 md:gap-4 items-center">
                    {!session ? (
                        <>
                            <button
                                onClick={() => router.push('/login')}
                                className="text-xs md:text-sm text-slate-500 hover:text-slate-800 transition-colors hidden sm:block"
                            >
                                로그인
                            </button>
                            <Button
                                size="sm"
                                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm px-4 md:px-5 shadow-md shadow-emerald-100"
                                onClick={() => window.location.href = '/welcome'}
                            >
                                베타 참여하기 <ArrowRight size={13} className="ml-1" />
                            </Button>
                        </>
                    ) : (
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all overflow-hidden shadow-sm"
                            title="나의 숲(대시보드)으로 이동"
                        >
                            {userProfile?.avatar || session.user?.image ? (
                                <img src={userProfile?.avatar || session.user?.image || ''} alt="P" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-xs md:text-sm font-serif">
                                    {(userProfile?.name || session.user?.name || 'A')[0]}
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 md:px-6 pb-20 md:pb-40">

                {/* ── Hero ── */}
                <div className="text-center space-y-6 md:space-y-10 pt-12 md:pt-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="px-6 py-2.5 bg-emerald-500/10 text-emerald-700 rounded-full text-xs font-bold border border-emerald-500/20 uppercase tracking-[0.2em] inline-flex items-center gap-2 backdrop-blur-md"
                        >
                            <Sparkles size={12} className="animate-pulse" /> 베타 테스트 참여자 모집 중
                        </motion.span>
                        <h1 className="text-5xl xs:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-serif font-bold text-slate-900 mt-8 md:mt-12 leading-[1.2] md:leading-[1.15] tracking-tight break-keep">
                            기억을 꺼내어 <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">리프노트</span>를 틔우다
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-serif px-2"
                    >
                        차가운 기술이 아닌, 당신의 이야기를 들어주는 <br className="md:hidden" /> 따뜻한 기록자 <span className="text-emerald-600 font-medium">에코(Echo)</span>. <br className="hidden md:block" />
                        묻어둔 기억을 AI 인터뷰로 깨워 <br className="md:hidden" /> 한 권의 책으로 선물해 드립니다.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center pt-4 md:pt-8"
                    >
                        <Button
                            size="lg"
                            className="group w-full sm:w-auto px-8 md:px-12 py-6 md:py-7 text-lg md:text-xl rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 border-none overflow-hidden relative"
                            onClick={() => window.location.href = '/welcome'}
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                기록의 시작, 씨앗 심기 <ArrowRight className="ml-2 md:ml-3 group-hover:translate-x-2 transition-transform" />
                            </span>
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                initial={false}
                            />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="px-8 md:px-10 py-6 md:py-7 text-lg md:text-xl rounded-full border-white/40 bg-white/20 backdrop-blur-md text-slate-700 hover:bg-white/40 hover:border-white/60 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/[0.02] w-full sm:w-auto"
                            onClick={() => window.location.href = '/brand'}
                        >
                            브랜드 스토리 보기
                        </Button>
                    </motion.div>
                </div>

                {/* ── 지원 주제 ── */}
                <section className="py-16 md:py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">어떤 이야기든 책이 됩니다</h2>
                        <p className="text-slate-500 font-serif text-lg">8가지 주제 중 당신의 이야기를 선택하세요.</p>
                    </motion.div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {TOPICS.map((topic, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white/80 backdrop-blur-xl border border-emerald-50/50 rounded-[2rem] p-5 md:p-6 shadow-xl shadow-emerald-900/5 hover:-translate-y-2 hover:shadow-2xl transition-all cursor-pointer group"
                                onClick={() => window.location.href = '/welcome'}
                            >
                                <div className="w-10 h-10 bg-emerald-50 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center mb-4 transition-colors">
                                    <topic.icon size={20} className="text-emerald-600" />
                                </div>
                                <h3 className="font-serif font-bold text-slate-800 text-sm md:text-base leading-snug mb-1">{topic.label}</h3>
                                <p className="text-slate-400 text-xs font-serif leading-snug">{topic.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ── 에코 채팅 미리보기 ── */}
                <ChatPreview />

                {/* ── 완성 결과물 미리보기 ── */}
                <section className="py-16 md:py-24">
                    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 leading-tight">
                                대화가 끝나면 <br />
                                <span className="text-emerald-600">이런 책이 완성됩니다</span>
                            </h2>
                            <p className="text-slate-500 font-serif text-lg leading-relaxed">
                                에코와의 인터뷰가 완료되면 AI가 당신의 이야기를 문학적으로 다듬어 한 권의 초고를 만들어 드립니다. 직접 편집하고 커버를 디자인한 후, PDF나 EPUB으로 다운로드하세요.
                            </p>
                            <div className="space-y-3">
                                {[
                                    "챕터별 기승전결 구조 자동 구성",
                                    "감성적이고 시적인 챕터 제목",
                                    "PDF / EPUB 포맷 다운로드",
                                    "커버 이미지 AI 생성 및 커스터마이징",
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                        <span className="text-slate-600 font-serif text-base">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex justify-center"
                        >
                            <BookMockup />
                        </motion.div>
                    </div>
                </section>

                {/* ── 후기 ── */}
                <section className="py-16 md:py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">창립 작가님들의 이야기</h2>
                        <p className="text-slate-500 font-serif text-lg">먼저 시작하신 분들의 진솔한 후기입니다.</p>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/80 backdrop-blur-xl border border-emerald-50/50 rounded-[2.5rem] p-8 shadow-xl shadow-emerald-900/5 flex flex-col hover:-translate-y-2 transition-all"
                            >
                                <Quote size={24} className="text-emerald-200 mb-4 shrink-0" />
                                <p className="text-slate-600 font-serif leading-relaxed text-base flex-1 mb-6">
                                    "{t.text}"
                                </p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-slate-800 font-serif">{t.name}</p>
                                        <p className="text-xs text-emerald-600 font-bold tracking-wide mt-0.5">{t.tag}</p>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: t.stars }).map((_, j) => (
                                            <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ── FAQ ── */}
                <section className="py-16 md:py-24">
                    <div className="max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">자주 묻는 질문</h2>
                            <p className="text-slate-500 font-serif text-lg">궁금한 점이 있으시면 말씀해 주세요.</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="bg-white/80 backdrop-blur-xl border border-emerald-50/50 rounded-[2.5rem] shadow-xl shadow-emerald-900/5 px-8 md:px-12 py-4"
                        >
                            {FAQS.map((faq, i) => (
                                <FaqItem key={i} q={faq.q} a={faq.a} />
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ── 하단 CTA ── */}
                <section className="py-16 md:py-24 text-center relative isolate">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-emerald-400/10 rounded-full blur-[100px] -z-10" />
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 leading-tight break-keep">
                            잊혀지기엔 너무나 아까운 <br className="hidden md:block" />
                            당신의 인생 이야기.
                        </h2>
                        <p className="text-slate-500 font-serif text-lg max-w-xl mx-auto">
                            지금 베타에 참여하시면 모든 기능을 무료로, <br className="hidden md:block" />영원히 함께하실 수 있습니다.
                        </p>
                        <div className="flex flex-col items-center gap-4">
                            <Button
                                size="lg"
                                className="group w-full sm:w-auto px-10 md:px-16 py-8 md:py-10 text-xl md:text-2xl rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 border-none overflow-hidden relative mx-auto"
                                onClick={() => window.location.href = '/welcome'}
                            >
                                <span className="relative z-10 flex items-center justify-center">
                                    기록의 시작, 씨앗 심기 <ArrowRight className="ml-3 md:ml-4 group-hover:translate-x-3 transition-transform" />
                                </span>
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    initial={false}
                                />
                            </Button>
                            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400 font-serif">
                                <span className="flex items-center gap-2"><Shield size={14} className="text-emerald-400" /> 신용카드 불필요</span>
                                <span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> 베타 기간 100% 무료</span>
                                <span className="flex items-center gap-2"><TreePine size={14} className="text-emerald-400" /> 책 완성 시 나무 기부</span>
                            </div>
                        </div>
                    </motion.div>
                </section>

            </main>

            <footer className="border-t border-slate-200/50 py-10 md:py-16 bg-white/50">
                <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-10">
                    <div>
                        <div className="mb-3">
                            <Logo size="sm" href="/" />
                        </div>
                        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                            AI 인터뷰어 <span className="text-emerald-600 font-bold">에코</span>와 함께 당신의 목소리를 한 권의 책으로 담는 가장 쉬운 방법.
                        </p>
                    </div>
                    <div className="flex gap-10 md:gap-16">
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">서비스</h4>
                            <ul className="text-xs text-slate-500 space-y-1.5 font-serif">
                                <li><a href="/guide/start" className="hover:text-emerald-600 transition-colors">시작하는 법</a></li>
                                <li><a href="/pricing" className="hover:text-emerald-600 transition-colors">요금제</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">FAQ</a></li>
                            </ul>
                        </div>
                        <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">문의</h4>
                            <ul className="text-xs text-slate-500 space-y-1.5 font-serif">
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">파트너십</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">고객지원</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">이용약관</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 md:mt-12 pt-6 border-t border-slate-100 text-center text-[10px] text-slate-400 tracking-[0.2em] uppercase">
                    © 2026 LeafNote • Narrative AI Publishing Platform
                </div>
            </footer>
        </div>
    );
}
