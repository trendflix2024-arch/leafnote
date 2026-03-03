"use client";

import { useState, useEffect } from 'react';
import { useBookStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, BookOpen, Book, Baby, Heart, Compass, Briefcase, Plane, Users, Edit3, Sprout } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const TOPICS = [
    { id: 'autobiography', label: '나의 인생 이야기', icon: Book, desc: '평범하지만 위대했던 당신의 계절들을 기록합니다.' },
    { id: 'parenting', label: '아이와 함께 자라는 시간', icon: Baby, desc: '피어나는 아이의 모든 순간을 붓삼아 남깁니다.' },
    { id: 'prenatal', label: '아이를 기다리는 시간 (태교)', icon: Sprout, desc: '새 생명을 기다리며 건네는 부모님의 첫 번째 대화.' },
    { id: 'love', label: '둘이 함께 쓰는 사랑 이야기', icon: Heart, desc: '함께 시작한 길 위에서 틔워낸 소중한 사랑의 문장들.' },
    { id: 'career', label: '일과 열정의 자취 (회고록)', icon: Briefcase, desc: '치열하게 쌓아온 경험의 기록이 누군가의 길잡이가 되도록.' },
    { id: 'travel', label: '세상을 만난 여행의 기록', icon: Plane, desc: '낯선 길 위에서 마주한 찬란한 풍경과 깨달음.' },
    { id: 'family', label: '가족의 뿌리 깊은 이야기', icon: Users, desc: '흐릿해진 가계의 기억을 잇고 다음 세대에 전합니다.' },
    { id: 'custom', label: '나만의 새로운 이야기', icon: Edit3, desc: '정해진 형식 없이 당신만의 자유로운 서사를 시작합니다.' },
];

const TONES = [
    { id: 'warm', label: '따뜻한 수필풍', desc: '감성적이고 서정적인 문체' },
    { id: 'novel', label: '소설풍', desc: '장면감 있고 생동감 넘치는 서사' },
    { id: 'modern', label: '모던하고 담백한', desc: '군더더기 없는 깔끔한 문장' },
    { id: 'humorous', label: '익살스러운', desc: '위트 있고 유쾌한 분위기' },
    { id: 'poetic', label: '시적이고 함축적인', desc: '운율감 있는 함축적 표현' },
    { id: 'letter', label: '편지글', desc: '누군가에게 조심스레 건네는 말' },
    { id: 'business', label: '비즈니스풍', desc: '명확하고 전문적인 톤' },
    { id: 'conversational', label: '대화체', desc: '친근하고 편안한 말투' },
];

export default function OnboardingPage() {
    const { data: session } = useSession();
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('');
    const [selectedTone, setSelectedTone] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const { setTempOnboardingData, userProfile } = useBookStore();

    // Auto-populate name if logged in and skip Step 0
    useEffect(() => {
        if (userProfile?.name && name === '') {
            setName(userProfile.name);
            if (step === 0) setStep(1);
        } else if (session?.user?.name && name === '') {
            setName(session.user.name);
            if (step === 0) setStep(1);
        }
    }, [userProfile, session, name, step]);

    // AI Subject Suggestions
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);

    const handleSuggestTopics = async () => {
        setIsSuggesting(true);
        setSuggestedTopics([]);
        try {
            const res = await fetch('/api/suggest-topics', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                if (data.topics && Array.isArray(data.topics)) {
                    setSuggestedTopics(data.topics);
                }
            }
        } catch (error) {
            console.error("Failed to fetch topics:", error);
        } finally {
            setIsSuggesting(false);
        }
    };

    // Auto-suggest when reaching step 1
    const [hasSuggested, setHasSuggested] = useState(false);
    if (step === 1 && !hasSuggested) {
        setHasSuggested(true);
        handleSuggestTopics();
    }

    const handleComplete = () => {
        const topicLabel = selectedTopic === 'custom' ? customTopic : (TOPICS.find((t) => t.id === selectedTopic)?.label || selectedTopic);
        const toneLabel = TONES.find((t) => t.id === selectedTone)?.label || selectedTone;

        // Store onboarding data temporarily
        setTempOnboardingData({ name, topic: topicLabel, tone: toneLabel });

        // Redirect to interview if logged in, otherwise to login
        if (session) {
            window.location.href = '/interview';
        } else {
            window.location.href = '/login?callbackUrl=/interview';
        }
    };

    const canProceed = () => {
        if (step === 0) return name.trim().length > 0;
        if (step === 1) return selectedTopic !== '';
        if (step === 2) return selectedTone !== '';
        return true;
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] paper-texture flex flex-col items-center pt-24 pb-32 px-4 md:px-6">
            <Link href="/" className="fixed top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 md:gap-3 group cursor-pointer z-[60]">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100/50 group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill="white" fillOpacity="0.2" />
                        <path d="M12 22V2M12 22C12 22 20 18 20 12C20 6 12 2 12 2M12 22C12 22 4 6 4 12C4 18 12 22 12 22ZM12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 15C13.5 15 15 15.5 15 17M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14M12 15C10.5 15 9 15.5 9 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </div>
                <span className="text-lg md:text-2xl font-serif font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">리프노트 <span className="text-emerald-600 text-xs md:text-base ml-1">LeafNote</span></span>
            </Link>
            <div className="max-w-2xl w-full text-slate-800">
                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 md:gap-3 mb-10 md:mb-16">
                    {[0, 1, 2].map((s) => (
                        <div key={s} className={`h-1.5 md:h-2 rounded-full transition-all duration-700 ${s === step ? 'w-12 md:w-16 bg-emerald-600 shadow-sm shadow-emerald-100' : s < step ? 'w-8 md:w-10 bg-emerald-200' : 'w-8 md:w-10 bg-slate-200'
                            }`} />
                    ))}
                </div>
                {/*
                 ### 3. 페이지별 고도화 내역
- **랜딩 페이지**: '씨앗 심기'부터 '숲을 이루는 기록'까지의 브랜드 서사를 담은 디자인으로 재구성했습니다.
- **온보딩(주제 선택)**: 이름 입력부터 문체 선택까지 전 과정을 리프노트 테마로 개편했습니다. 부드러운 애니메이션과 유기적인 카드 디자인이 적용되었습니다.
- **로그인/대시보드**: 리프노트만의 정갈하고 전문적인 출판 플랫폼 느낌을 살린 레이아웃을 적용했습니다.
                */}
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="name"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="text-center space-y-12"
                        >
                            <div>
                                <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 leaf-shadow border border-emerald-100/50">
                                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700">
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4 tracking-tight">반갑습니다, 작가님!</h2>
                                <p className="text-slate-500 font-serif text-base md:text-lg">어떤 성함(필명)으로 기록을 시작해볼까요?</p>
                            </div>
                            <div className="relative max-w-sm mx-auto group">
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && canProceed() && setStep(1)}
                                    placeholder="성함(필명)을 입력하세요."
                                    className="text-center text-xl md:text-2xl py-6 md:py-8 border-paper-edge rounded-2xl md:rounded-3xl bg-white/40 focus-visible:ring-emerald-500 shadow-inner group-hover:border-emerald-200 transition-all font-serif"
                                    autoFocus
                                />
                                <div className="absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none group-hover:bg-emerald-500/5 transition-colors" />
                            </div>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div
                            key="topic"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-12"
                        >
                            <div className="text-center">
                                <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 leaf-shadow border border-emerald-100/50">
                                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700">
                                        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.5 2 7a7 7 0 0 1-7 7h-3" />
                                        <path d="M11 20c0-3 .5-6 2-9" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 mb-3 md:mb-4 tracking-tight break-keep leading-tight px-4">
                                    {name}님만의 <span className="text-emerald-600">이야기</span> 배경
                                </h2>
                                <p className="text-slate-500 font-serif text-base md:text-lg break-keep px-4">기억의 숲을 이룰 첫 번째 씨앗을 골라주세요</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                                {TOPICS.map((topic) => (
                                    <button
                                        key={topic.id}
                                        onClick={() => setSelectedTopic(topic.id)}
                                        className={`p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all text-left group relative outline-none flex items-start gap-4 md:gap-6 ${selectedTopic === topic.id
                                            ? 'border-emerald-600 bg-white shadow-xl shadow-emerald-100 scale-[1.01]'
                                            : 'border-paper-edge bg-white/60 hover:border-emerald-200 hover:shadow-lg hover:bg-white'
                                            }`}
                                    >
                                        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-colors ${selectedTopic === topic.id ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                                            <topic.icon size={24} className="md:w-7 md:h-7" strokeWidth={1.5} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={`font-bold text-base md:text-lg block mb-0.5 md:mb-1 font-serif tracking-tight break-keep ${selectedTopic === topic.id ? 'text-emerald-700' : 'text-slate-800'}`}>{topic.label}</span>
                                            <span className={`text-[13px] md:text-sm leading-relaxed block font-serif break-keep ${selectedTopic === topic.id ? 'text-emerald-600/80' : 'text-slate-400 group-hover:text-slate-500'
                                                }`}>{topic.desc}</span>
                                        </div>
                                        {selectedTopic === topic.id && (
                                            <motion.div
                                                layoutId="active-check"
                                                className="absolute top-4 right-4 text-emerald-600"
                                            >
                                                <Sparkles size={16} fill="currentColor" />
                                            </motion.div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* AI Suggestions Section */}
                            <div className="max-w-3xl mx-auto mt-12 pt-8 border-t border-slate-200/60">
                                <div className="flex justify-between items-center mb-6 px-4">
                                    <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles size={14} className="animate-pulse" /> 에코의 추천 제안
                                    </h5>
                                    <button
                                        onClick={handleSuggestTopics}
                                        disabled={isSuggesting}
                                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 disabled:opacity-50 font-serif"
                                    >
                                        {isSuggesting ? '추천 중...' : '한번 더'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-2">
                                    {isSuggesting ? (
                                        Array(3).fill(0).map((_, i) => (
                                            <div key={i} className="h-14 bg-white/40 border border-dashed border-slate-200 rounded-2xl animate-pulse" />
                                        ))
                                    ) : suggestedTopics.length > 0 ? (
                                        suggestedTopics.map((topic, i) => (
                                            <motion.button
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                onClick={() => {
                                                    setSelectedTopic('custom');
                                                    setCustomTopic(topic);
                                                }}
                                                className={`text-[13px] px-4 py-3 border rounded-2xl transition-all text-left font-serif shadow-sm flex items-start gap-2 group ${customTopic === topic && selectedTopic === 'custom'
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-100'
                                                    : 'bg-white/80 text-slate-700 border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-md'
                                                    }`}
                                            >
                                                <span className={`${customTopic === topic && selectedTopic === 'custom' ? 'text-emerald-200' : 'text-emerald-400'} mt-0.5`}>#</span>
                                                <span className="flex-1 leading-snug">{topic}</span>
                                            </motion.button>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-8 text-center bg-white/40 rounded-3xl border border-dashed border-slate-200">
                                            <p className="text-sm text-slate-400 font-serif">위에 버튼을 눌러 에코에게 영감을 받아보세요.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Direct Input Area */}
                                <div className="mt-10 px-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-px flex-1 bg-slate-200/60" />
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2 whitespace-nowrap">또는 직접 주제 입력하기</span>
                                        <div className="h-px flex-1 bg-slate-200/60" />
                                    </div>
                                    <Input
                                        value={customTopic}
                                        onChange={(e) => {
                                            setCustomTopic(e.target.value);
                                            setSelectedTopic('custom');
                                        }}
                                        placeholder="나만의 특별한 주제를 입력해보세요. (예: 나의 고향 거제도 이야기)"
                                        className={`text-base md:text-lg py-6 md:py-7 border-2 rounded-2xl bg-white shadow-sm focus-visible:ring-emerald-500 font-serif transition-all ${selectedTopic === 'custom' ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-paper-edge hover:border-emerald-100'
                                            }`}
                                    />
                                    {selectedTopic === 'custom' && !customTopic.trim() && (
                                        <p className="text-[10px] md:text-[11px] text-amber-600 mt-2 ml-2 animate-pulse font-serif italic text-right">주제를 입력하시거나 위에서 하나를 추천받아보세요.</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="tone"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-12"
                        >
                            <div className="text-center">
                                <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 leaf-shadow border border-emerald-100/50">
                                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700">
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 mb-3 md:mb-4 tracking-tight break-keep">어떤 <span className="text-emerald-600">숨결</span>로 담을까요?</h2>
                                <p className="text-slate-500 font-serif text-base md:text-lg break-keep px-4">따뜻한 인공지능 기록가 <span className="text-emerald-600 font-medium">'에코'</span>가 이 문체로 다듬어 드립니다</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                                {TONES.map((tone) => (
                                    <button
                                        key={tone.id}
                                        onClick={() => setSelectedTone(tone.id)}
                                        className={`p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all text-left group outline-none ${selectedTone === tone.id
                                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-xl shadow-emerald-100 scale-[1.01]'
                                            : 'border-paper-edge bg-white/60 hover:border-emerald-200 hover:shadow-lg hover:bg-white'
                                            }`}
                                    >
                                        <span className="font-bold text-base md:text-lg block mb-0.5 md:mb-1 font-serif tracking-tight break-keep">{tone.label}</span>
                                        <span className={`text-[13px] md:text-sm leading-relaxed font-serif break-keep ${selectedTone === tone.id ? 'text-emerald-50' : 'text-slate-400'
                                            }`}>{tone.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation sticky bottom bar for mobile */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#FAF9F6]/80 backdrop-blur-md border-t border-paper-edge md:border-none md:relative md:bg-transparent md:p-0 md:mt-16 md:max-w-xl md:mx-auto z-50">
                    <div className="flex justify-between items-center max-w-xl mx-auto w-full gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setStep(Math.max(0, step - 1))}
                            className={`text-slate-400 hover:text-emerald-600 transition-colors h-14 md:h-auto ${step === 0 ? 'invisible' : ''}`}
                        >
                            이전 단계
                        </Button>
                        <Button
                            onClick={() => step < 2 ? setStep(step + 1) : handleComplete()}
                            disabled={!canProceed()}
                            className="bg-emerald-600 hover:bg-emerald-700 h-14 md:h-auto flex-1 md:flex-none md:px-12 md:py-8 rounded-2xl md:rounded-[2rem] text-base md:text-lg font-bold shadow-xl shadow-emerald-100 transition-all active:scale-95 disabled:opacity-30 disabled:shadow-none"
                        >
                            {step < 2 ? (
                                <span className="flex items-center gap-2">다음으로 <ArrowRight size={18} strokeWidth={1.5} /></span>
                            ) : (
                                <span className="flex items-center gap-2">인터뷰 시작하기 <Sparkles size={18} strokeWidth={1.5} /></span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
