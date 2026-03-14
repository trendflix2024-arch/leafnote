"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sprout, MessageCircle, PenTool, TreePine, Palette, BookOpen,
    ArrowLeft, ArrowRight, ChevronDown, Lightbulb, Sparkles,
    CheckCircle2, Wand2, Save, Layers, Download, FileText,
    Smartphone, Book, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ─── 재사용 컴포넌트 ──────────────────────────────────────────

function StepHeader({
    number, icon: Icon, title, subtitle, color, id
}: {
    number: string; icon: any; title: string; subtitle: string;
    color: string; id: string;
}) {
    return (
        <div id={id} className="flex items-start gap-5 mb-8 scroll-mt-24">
            <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-lg shrink-0 mt-1`}>
                <Icon size={26} className="text-white" />
            </div>
            <div>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest border border-emerald-100 mb-2">
                    Step {number}
                </span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 leading-tight">{title}</h2>
                <p className="text-slate-500 font-serif mt-1">{subtitle}</p>
            </div>
        </div>
    );
}

function ScreenshotCard({ src, alt, caption }: { src: string; alt: string; caption: string }) {
    return (
        <figure className="my-6">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200/60 bg-white">
                <img src={src} alt={alt} className="w-full h-auto block" loading="lazy" />
            </div>
            <figcaption className="text-center text-xs text-slate-400 italic mt-2 font-serif">{caption}</figcaption>
        </figure>
    );
}

function TipBox({ title, children }: { title?: string; children: React.ReactNode }) {
    return (
        <div className="bg-emerald-50 border-l-4 border-emerald-400 rounded-xl px-6 py-5 my-6">
            <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} className="text-emerald-600 shrink-0" />
                <span className="text-emerald-700 font-bold text-sm">{title || '💡 팁'}</span>
            </div>
            <div className="text-slate-600 text-sm leading-relaxed font-serif space-y-1">{children}</div>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description, color }: {
    icon: any; title: string; description: string; color: string;
}) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
                <Icon size={20} className="text-white" />
            </div>
            <h4 className="font-bold text-slate-800 mb-2">{title}</h4>
            <p className="text-slate-500 text-sm leading-relaxed font-serif">{description}</p>
        </div>
    );
}

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-slate-100 last:border-0">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex justify-between items-center py-5 text-left gap-4"
            >
                <span className="text-base font-serif font-bold text-slate-800">{q}</span>
                <ChevronDown
                    size={18}
                    className={`text-slate-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pb-5 text-sm text-slate-500 font-serif leading-relaxed overflow-hidden"
                    >
                        {a}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── FAQ 데이터 ───────────────────────────────────────────────

const FAQS = [
    {
        q: "글을 전혀 못 써도 괜찮나요?",
        a: "네, 전혀 문제없습니다. 에코가 먼저 질문을 드리고, 작가님은 일상 대화를 하듯 편안하게 답변만 하시면 됩니다. 특별한 글쓰기 실력이 없어도 대화하다 보면 한 권의 책이 자연스럽게 완성됩니다.",
    },
    {
        q: "에코와 몇 번 대화해야 원고가 완성되나요?",
        a: "최소 10~20번의 대화 이후 초고를 생성할 수 있습니다. 더 많은 대화를 나눌수록 풍부하고 깊이 있는 원고가 완성됩니다. 스탠다드·프로 플랜은 인터뷰가 무제한이므로 원하는 만큼 이야기를 쌓을 수 있습니다.",
    },
    {
        q: "내 이야기가 외부에 공개되나요?",
        a: "절대 자동으로 공개되지 않습니다. 작가님이 직접 이야기숲(커뮤니티)에 발췌 공유를 선택하지 않는 한, 모든 원고와 인터뷰 내용은 작가님만 볼 수 있습니다.",
    },
    {
        q: "인터뷰는 중간에 멈추고 나중에 이어서 할 수 있나요?",
        a: "네, 모든 대화는 자동으로 저장됩니다. 언제든지 대시보드에서 프로젝트를 선택하면 이전 대화 내용이 그대로 이어집니다. 며칠에 걸쳐 나눠서 진행하셔도 됩니다.",
    },
    {
        q: "표지 디자인을 나중에 바꿀 수 있나요?",
        a: "네, 언제든지 표지 디자인 페이지에서 수정할 수 있습니다. 폰트·색상·템플릿·배경 이미지 등 모든 디자인 요소를 자유롭게 변경하고 저장할 수 있습니다.",
    },
    {
        q: "종이책으로 실제 출판하려면 어떻게 해야 하나요?",
        a: "출판 페이지에서 책의 규격과 내지 레이아웃을 최종 확인한 후, 고객지원팀에 인쇄 제작을 문의해 주세요. 현재 베타 기간 중에는 디지털(PDF/EPUB) 다운로드가 우선 제공되며, 실물 인쇄는 스탠다드/프로 플랜 기준으로 안내드립니다.",
    },
    {
        q: "PDF와 EPUB 다운로드는 무료인가요?",
        a: "PDF 다운로드는 스탠다드 플랜 이상부터 가능하며, EPUB은 베이직 플랜 이상에서 이용할 수 있습니다. 무료 플랜은 미리보기만 제공됩니다. 베타 기간 중에는 모든 기능이 무료로 제공됩니다.",
    },
    {
        q: "책 완성 후 나무를 실제로 심어주나요?",
        a: "네, 리프노트는 책 한 권이 완성될 때마다 실제로 나무 한 그루를 심는 환경 파트너십을 운영하고 있습니다. 작가님의 이야기가 디지털 세상을 넘어 실제 지구에도 작은 숲을 만들어갑니다.",
    },
];

// ─── 메인 페이지 ──────────────────────────────────────────────

export default function GuideStartPage() {
    const tocItems = [
        { id: 'step1', label: '시작하기', icon: Sprout },
        { id: 'step2', label: '에코 인터뷰', icon: MessageCircle },
        { id: 'step3', label: '원고 편집', icon: PenTool },
        { id: 'step4', label: '표지 디자인', icon: Palette },
        { id: 'step5', label: '출판 & 배포', icon: BookOpen },
    ];

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">

            {/* ── 헤더 ──────────────────────────────────────── */}
            <nav className="p-4 md:p-6 sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-white/30 shadow-sm">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100/50 group-hover:scale-105 transition-transform">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill="white" fillOpacity="0.2" />
                                <path d="M12 22V2M12 22C12 22 20 18 20 12C20 6 12 2 12 2M12 22C12 22 4 6 4 12C4 18 12 22 12 22ZM12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 15C13.5 15 15 15.5 15 17M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14M12 15C10.5 15 9 15.5 9 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span className="text-lg font-serif font-bold text-slate-800">리프노트 <span className="text-emerald-600 text-sm">LeafNote</span></span>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800">
                            <ArrowLeft className="mr-1.5 h-4 w-4" /> 홈으로
                        </Button>
                    </Link>
                </div>
            </nav>

            {/* ── 히어로 ─────────────────────────────────────── */}
            <header className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold tracking-[0.18em] uppercase mb-5 border border-emerald-100">
                        📖 사용자 가이드
                    </span>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 leading-tight tracking-tight mb-4">
                        리프노트<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">완전 정복 가이드</span>
                    </h1>
                    <p className="text-lg text-slate-500 font-serif leading-relaxed mb-8">
                        처음 사용하시더라도 걱정 마세요.<br />
                        5단계를 따라가면 나만의 책이 완성됩니다.
                    </p>

                    {/* 빠른 목차 */}
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                        {tocItems.map((item, i) => (
                            <button
                                key={item.id}
                                onClick={() => scrollTo(item.id)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm"
                            >
                                <item.icon size={13} />
                                Step {i + 1}. {item.label}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </header>

            {/* ── 본문 ─────────────────────────────────────────── */}
            <main className="max-w-3xl mx-auto px-6 pb-24 space-y-20">

                {/* ════════════════════════════════════════
                    STEP 1 — 시작하기
                ════════════════════════════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="border-l-4 border-emerald-200 pl-8"
                >
                    <StepHeader
                        id="step1"
                        number="01"
                        icon={Sprout}
                        title="시작하기 — 새 이야기 심기"
                        subtitle="대시보드에서 새 프로젝트를 만들고 주제와 필명을 정합니다"
                        color="bg-emerald-500"
                    />

                    <div className="space-y-4 text-slate-600 font-serif leading-relaxed">
                        <p>
                            리프노트에 처음 로그인하면 <strong className="text-slate-800">나의 숲(대시보드)</strong>가 나타납니다.
                            여기서 지금까지 작성한 모든 프로젝트를 확인하고 새로운 이야기를 시작할 수 있습니다.
                        </p>
                        <p>
                            오른쪽 위 또는 중앙 하단의 <strong className="text-emerald-600">「새 씨앗 심기」</strong> 버튼을 누르면
                            프로젝트 제목을 입력하는 창이 열립니다. 책 제목이 없어도 괜찮습니다 —
                            나중에 언제든 바꿀 수 있으니 지금은 생각나는 대로 입력해 보세요.
                        </p>
                    </div>

                    <ScreenshotCard
                        src="/guide/01-dashboard.png"
                        alt="리프노트 대시보드 화면"
                        caption="대시보드 — 내가 쓰던 이야기들과 새 프로젝트 버튼이 한눈에 보입니다"
                    />

                    <ScreenshotCard
                        src="/guide/02-new-project.png"
                        alt="새 이야기 시작 모달"
                        caption="「새 씨앗 심기」를 누르면 제목을 입력할 수 있는 창이 열립니다"
                    />

                    <TipBox title="주제 선택 팁">
                        <p>제목을 떠올리기 어렵다면 아래 예시를 참고해 보세요.</p>
                        <ul className="mt-2 space-y-1 list-none">
                            {[
                                '📖 나의 인생 이야기 — 살아온 길을 연대기로',
                                '👶 아이와 함께 자라는 시간 — 육아 일기',
                                '✈️ 세상을 만난 여행 — 여행 에세이',
                                '💼 일과 열정의 자취 — 커리어 회고록',
                                '👨‍👩‍👧 가족의 뿌리 깊은 이야기 — 가족사',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </TipBox>
                </motion.section>

                {/* ════════════════════════════════════════
                    STEP 2 — 에코 인터뷰
                ════════════════════════════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="border-l-4 border-teal-200 pl-8"
                >
                    <StepHeader
                        id="step2"
                        number="02"
                        icon={MessageCircle}
                        title="에코와 인터뷰하기"
                        subtitle="AI 기록가 에코가 질문합니다 — 대화하듯 편하게 답변해 주세요"
                        color="bg-teal-500"
                    />

                    <div className="space-y-4 text-slate-600 font-serif leading-relaxed">
                        <p>
                            프로젝트를 만들면 바로 <strong className="text-slate-800">인터뷰 페이지</strong>로 이동합니다.
                            AI 기록가 <strong className="text-emerald-600">에코(Echo)</strong>가 먼저 따뜻하게 인사를 건네며
                            첫 번째 질문을 드립니다.
                        </p>
                        <p>
                            에코는 단순한 챗봇이 아니라, 작가님의 답변 속에 숨어 있는 감정과 기억을 감지하여
                            다음 질문을 이어가는 <em>문학적 인터뷰어</em>입니다.
                            정확한 문장이나 완성된 글이 아니어도 됩니다 — 기억나는 것을 편하게 이야기해 주세요.
                        </p>
                    </div>

                    <ScreenshotCard
                        src="/guide/03-interview-start.png"
                        alt="에코의 첫 인터뷰 질문"
                        caption="에코가 먼저 인사를 건네며 첫 질문을 드립니다"
                    />

                    <div className="space-y-4 text-slate-600 font-serif leading-relaxed">
                        <p>
                            화면 하단의 입력창에 답변을 작성한 뒤 <strong className="text-slate-800">Enter</strong>를 누르거나
                            오른쪽 전송 버튼을 클릭하면 에코가 응답을 생성합니다.
                            마이크 아이콘을 누르면 <strong className="text-slate-800">음성 입력</strong>도 가능합니다.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                        <ScreenshotCard
                            src="/guide/04-interview-answer.png"
                            alt="답변 입력 화면"
                            caption="기억나는 이야기를 자유롭게 입력하세요"
                        />
                        <ScreenshotCard
                            src="/guide/05-interview-reply.png"
                            alt="에코의 응답"
                            caption="에코가 답변을 바탕으로 다음 질문을 이어갑니다"
                        />
                    </div>

                    <TipBox title="더 풍부한 원고를 만드는 답변 작성법">
                        <ul className="space-y-2">
                            {[
                                { label: '구체적인 날짜와 장소', desc: '"그때"보다는 "1985년 여름, 부산 해운대에서"처럼 써보세요' },
                                { label: '감각적인 묘사', desc: '냄새, 소리, 날씨처럼 오감을 자극하는 표현을 포함하세요' },
                                { label: '감정을 솔직하게', desc: '기쁨, 두려움, 설렘 등 당시 느꼈던 감정을 그대로 표현하세요' },
                                { label: '등장인물 소개', desc: '함께한 사람들의 이름과 관계를 간단히 언급해 주세요' },
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <Star size={12} className="text-amber-400 mt-1 shrink-0" fill="currentColor" />
                                    <span><strong className="text-slate-700">{item.label}</strong> — {item.desc}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-3 text-slate-500">
                            인터뷰를 많이 할수록 원고의 깊이가 달라집니다.
                            최소 <strong className="text-emerald-700">10~20회</strong> 이상 대화를 나눈 후 초고를 생성해 보세요.
                        </p>
                    </TipBox>
                </motion.section>

                {/* ════════════════════════════════════════
                    STEP 3 — 원고 편집
                ════════════════════════════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="border-l-4 border-emerald-300 pl-8"
                >
                    <StepHeader
                        id="step3"
                        number="03"
                        icon={PenTool}
                        title="원고 편집하기"
                        subtitle="에코가 만든 초고를 내 목소리로 다듬어보세요"
                        color="bg-emerald-600"
                    />

                    <div className="space-y-4 text-slate-600 font-serif leading-relaxed">
                        <p>
                            인터뷰가 충분히 쌓이면 <strong className="text-emerald-600">「초고 생성」</strong> 버튼을 눌러
                            에코의 Literary Touch를 거친 원고를 받을 수 있습니다.
                            완성된 초고는 <strong className="text-slate-800">원고 편집 페이지</strong>에서 자유롭게 수정할 수 있습니다.
                        </p>
                        <p>
                            에코가 쓴 글이 마음에 들지 않는 부분이 있다면 직접 고쳐도 되고,
                            <strong className="text-slate-800"> AI 문체 교정</strong> 기능으로 특정 구간을 다시 다듬어 달라고 요청할 수도 있습니다.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
                        <FeatureCard
                            icon={Wand2}
                            title="AI 문체 교정"
                            description="선택한 구간을 에코가 문학적으로 다듬어줍니다. 문체가 어색하거나 더 표현력 있게 만들고 싶을 때 사용하세요."
                            color="bg-violet-500"
                        />
                        <FeatureCard
                            icon={Layers}
                            title="챕터 관리"
                            description="원고를 챕터별로 나누고 순서를 자유롭게 조정할 수 있습니다. 드래그 앤 드롭으로 편리하게 구성하세요."
                            color="bg-teal-500"
                        />
                        <FeatureCard
                            icon={Save}
                            title="자동 저장"
                            description="입력한 내용은 실시간으로 자동 저장됩니다. 갑자기 브라우저를 닫아도 걱정 없이 이어서 작업하실 수 있습니다."
                            color="bg-emerald-500"
                        />
                    </div>

                    <TipBox title="편집 단축키">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono">
                            {[
                                ['Ctrl + S', '수동 저장'],
                                ['Ctrl + Z', '실행 취소'],
                                ['Ctrl + Y', '다시 실행'],
                                ['Ctrl + B', '굵게'],
                                ['Ctrl + I', '이탤릭'],
                                ['Ctrl + F', '찾기'],
                            ].map(([key, desc]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 shadow-sm">{key}</kbd>
                                    <span className="text-slate-500 font-sans">{desc}</span>
                                </div>
                            ))}
                        </div>
                    </TipBox>
                </motion.section>

                {/* ════════════════════════════════════════
                    STEP 4 — 표지 디자인
                ════════════════════════════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="border-l-4 border-amber-200 pl-8"
                >
                    <StepHeader
                        id="step4"
                        number="04"
                        icon={Palette}
                        title="표지 디자인하기"
                        subtitle="세상에 하나뿐인 나만의 표지를 직접 만드세요"
                        color="bg-amber-500"
                    />

                    <div className="space-y-4 text-slate-600 font-serif leading-relaxed">
                        <p>
                            <strong className="text-slate-800">표지 디자인 페이지</strong>에서는 실제 책 표지를 직접 디자인할 수 있습니다.
                            왼쪽 사이드바에서 폰트, 색상, 레이아웃, 장식 등을 조정하면
                            오른쪽 캔버스에 즉시 반영됩니다.
                        </p>
                        <p>
                            앞면·책등·뒷면을 모두 디자인할 수 있으며,
                            완성 후 <strong className="text-emerald-600">「고화질」</strong> 버튼으로
                            인쇄 품질(3배 해상도)의 PNG를 바로 다운로드할 수 있습니다.
                        </p>
                    </div>

                    <ScreenshotCard
                        src="/guide/06-design.png"
                        alt="표지 디자인 페이지 초기 화면"
                        caption="표지 디자인 페이지 — 앞면·책등·뒷면을 한 화면에서 편집할 수 있습니다"
                    />

                    <ScreenshotCard
                        src="/guide/07-design-template.png"
                        alt="자서전 템플릿 적용 후"
                        caption="장르 템플릿을 선택하면 색상·폰트·레이아웃이 한 번에 적용됩니다"
                    />

                    {/* 기능 배지 */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 my-6">
                        <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">주요 디자인 기능</h4>
                        <div className="flex flex-wrap gap-2">
                            {[
                                '📖 자서전·수필·여행·소설 등 6가지 장르 템플릿',
                                '🔤 Nanum Myeongjo·Gowun Batang 등 한글 폰트',
                                '🎨 배경색·텍스트색·포인트색 자유 지정',
                                '🖼️ 배경 이미지 업로드 지원',
                                '💎 코너 장식·라인·다이아몬드 등 오너먼트',
                                '📏 앞면·책등·뒷면 개별 편집',
                                '🔍 앞면/책등/뒷면 확대 뷰',
                                '💾 고화질 PNG 3배 해상도 다운로드',
                            ].map((feat, i) => (
                                <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600 font-medium">
                                    {feat}
                                </span>
                            ))}
                        </div>
                    </div>

                    <TipBox title="표지 디자인 팁">
                        <ul className="space-y-1.5">
                            <li>• <strong>AI 디자인 생성</strong>을 누르면 원고 내용을 분석해 어울리는 색감과 문구를 자동으로 제안합니다</li>
                            <li>• 텍스트를 드래그하면 위치를 자유롭게 옮길 수 있습니다</li>
                            <li>• 변경 사항은 자동 저장되지 않으니 <strong>「저장」</strong> 버튼을 꼭 눌러주세요</li>
                            <li>• Ctrl+Z (실행 취소)로 이전 상태로 되돌릴 수 있습니다</li>
                        </ul>
                    </TipBox>
                </motion.section>

                {/* ════════════════════════════════════════
                    STEP 5 — 출판 및 배포
                ════════════════════════════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="border-l-4 border-violet-200 pl-8"
                >
                    <StepHeader
                        id="step5"
                        number="05"
                        icon={BookOpen}
                        title="출판 및 배포하기"
                        subtitle="완성된 원고를 종이책과 전자책으로 출판하세요"
                        color="bg-violet-500"
                    />

                    <div className="space-y-4 text-slate-600 font-serif leading-relaxed">
                        <p>
                            표지 디자인까지 완료하면 <strong className="text-slate-800">출판 및 배포 페이지</strong>로 이동합니다.
                            여기서 완성된 책을 최종 미리보기하고 여러 형식으로 내보낼 수 있습니다.
                        </p>
                        <p>
                            <strong className="text-slate-800">종이책 미리보기</strong>에서는 선택한 판형(A5, 신국판 등) 기준으로
                            표지·서문·목차·본문·뒷표지를 페이지별로 넘겨볼 수 있습니다.
                            <strong className="text-slate-800"> 전자책 미리보기</strong>는 스마트폰 화면 비율로 확인할 수 있습니다.
                        </p>
                    </div>

                    <ScreenshotCard
                        src="/guide/08-export.png"
                        alt="출판 및 배포 페이지"
                        caption="출판 페이지 — 종이책·전자책 미리보기와 PDF/EPUB 다운로드를 한 곳에서"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                        <div className="bg-white rounded-2xl border border-slate-100 p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 bg-slate-700 rounded-xl flex items-center justify-center">
                                    <Book size={18} className="text-white" />
                                </div>
                                <h4 className="font-bold text-slate-800">종이책</h4>
                            </div>
                            <ul className="text-sm text-slate-500 space-y-1.5 font-serif">
                                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> 실제 책 규격(A5·신국판 등) 미리보기</li>
                                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> 폰트·여백·줄간격 WYSIWYG 설정</li>
                                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> PDF 다운로드 (스탠다드 이상)</li>
                                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> 인쇄 제작 문의 가능</li>
                            </ul>
                        </div>
                        <div className="bg-white rounded-2xl border border-slate-100 p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
                                    <Smartphone size={18} className="text-white" />
                                </div>
                                <h4 className="font-bold text-slate-800">전자책</h4>
                            </div>
                            <ul className="text-sm text-slate-500 space-y-1.5 font-serif">
                                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> 스마트폰·태블릿 화면 미리보기</li>
                                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> 표지·서문·본문·저자 소개 포함</li>
                                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> EPUB 다운로드 (베이직 이상)</li>
                                <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> 이야기숲(커뮤니티) 공유 가능</li>
                            </ul>
                        </div>
                    </div>

                    <TipBox title="출판 전 체크리스트">
                        <ul className="space-y-1.5">
                            {[
                                '책 제목과 작가 이름(필명)이 올바르게 표시되는지 확인하세요',
                                '목차에 모든 챕터가 표시되는지 확인하세요',
                                '헌정사(예: "사랑하는 가족에게")와 저자 소개를 입력하면 책이 더욱 완성됩니다',
                                '표지 이미지가 정상적으로 로딩되는지 확인하세요',
                                'PDF 다운로드 전 「디자인으로」 버튼으로 돌아가 최종 저장을 확인하세요',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-emerald-600 font-bold shrink-0">{i + 1}.</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </TipBox>
                </motion.section>

                {/* ════════════════════════════════════════
                    FAQ
                ════════════════════════════════════════ */}
                <motion.section
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="mb-8 text-center">
                        <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest mb-3">FAQ</span>
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800">자주 묻는 질문</h2>
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm px-6 md:px-8 divide-y divide-slate-100">
                        {FAQS.map((faq, i) => (
                            <FaqItem key={i} q={faq.q} a={faq.a} />
                        ))}
                    </div>
                </motion.section>

                {/* ════════════════════════════════════════
                    CTA
                ════════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl p-10 md:p-14 text-center shadow-2xl shadow-emerald-200"
                >
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Sparkles size={28} className="text-white" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3">
                        지금 바로 첫 번째 씨앗을 심어보세요
                    </h2>
                    <p className="text-emerald-100 font-serif mb-8 max-w-md mx-auto">
                        당신의 모든 대화는 소중한 역사가 됩니다.<br />
                        베타 기간 동안 모든 기능을 100% 무료로 이용할 수 있습니다.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/onboarding">
                            <Button size="lg" className="px-8 py-6 text-base rounded-full bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl font-bold transition-all active:scale-95">
                                기록 시작하기 <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/pricing">
                            <Button size="lg" variant="outline" className="px-8 py-6 text-base rounded-full border-white/50 text-white hover:bg-white/10 transition-all">
                                요금제 보기
                            </Button>
                        </Link>
                    </div>
                </motion.div>

            </main>

            {/* ── 푸터 ─────────────────────────────────────────── */}
            <footer className="py-12 border-t border-slate-100 bg-white/50 text-center">
                <p className="text-slate-400 text-sm font-serif">© 2026 LeafNote • Growing your story, leaf by leaf.</p>
            </footer>
        </div>
    );
}
