"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { BookOpen, PenTool, Sparkles, Printer, ArrowRight, Heart, Wind, Flame, TreePine, Sprout, CheckCircle2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackgroundEffects } from '@/components/landing/BackgroundEffects';

export default function Home() {
    return (
        <div className="min-h-screen relative selection:bg-emerald-100 selection:text-emerald-900">
            <BackgroundEffects />
            <nav className="p-4 md:p-6 flex justify-between items-center max-w-7xl mx-auto sticky top-0 z-50 backdrop-blur-md bg-white/40 border-b border-white/20">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100/50">
                        <svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill="white" fillOpacity="0.2" />
                            <path d="M12 22V2M12 22C12 22 20 18 20 12C20 6 12 2 12 2M12 22C12 22 4 6 4 12C4 18 12 22 12 22ZM12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 15C13.5 15 15 15.5 15 17M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14M12 15C10.5 15 9 15.5 9 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <span className="text-lg md:text-2xl font-serif font-bold text-slate-800 tracking-tight whitespace-nowrap">리프노트 <span className="text-emerald-600 hidden xs:inline">LeafNote</span></span>
                </div>
                <div className="flex gap-3 md:gap-4 items-center">
                    <a href="/pricing" className="text-xs md:text-sm text-slate-500 hover:text-slate-800 transition-colors">요금제</a>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 text-xs md:text-sm px-2 md:px-4"
                        onClick={() => window.location.href = '/login'}
                    >
                        로그인
                    </Button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-20 md:pb-40">
                <div className="text-center space-y-6 md:space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="px-6 py-2.5 bg-emerald-500/10 text-emerald-700 rounded-full text-xs md:text-sm font-bold border border-emerald-500/20 uppercase tracking-[0.2em] inline-block backdrop-blur-md"
                        >
                            Deep Narrative AI Publishing
                        </motion.span>
                        <h1 className="text-5xl xs:text-6xl md:text-8xl lg:text-[10rem] font-serif font-bold text-slate-900 mt-8 md:mt-12 leading-[1.1] md:leading-tight tracking-tight break-keep">
                            기억을 꺼내어 <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">리프노트</span>를 틔우다
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-lg md:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-serif px-2"
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
                            className="group w-full sm:w-auto px-8 md:px-12 py-6 md:py-8 text-lg md:text-xl rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 border-none overflow-hidden relative"
                            onClick={() => window.location.href = '/onboarding'}
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
                            className="px-8 md:px-10 py-6 md:py-8 text-lg md:text-xl rounded-full border-white/40 bg-white/20 backdrop-blur-md text-slate-700 hover:bg-white/40 hover:border-white/60 transition-all active:scale-95 shadow-lg shadow-black/[0.02] w-full sm:w-auto"
                            onClick={() => window.location.href = '/brand'}
                        >
                            브랜드 스토리 보기
                        </Button>
                    </motion.div>
                </div>

                {/* 1. '경험 안내' 섹션 (How it works) */}
                <div className="mt-24 md:mt-48">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16 md:mb-24"
                    >
                        <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-6">당신의 기억은 이렇게 한 권의 책이 됩니다.</h2>
                        <p className="text-lg md:text-xl text-slate-500 font-serif">복잡한 글쓰기는 저희가 대신할게요.</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto px-4">
                        {[
                            { step: "Step 1", title: "에코와 대화하기", desc: "다정한 질문에 편안하게 답해보세요.", icon: <MessageCircle className="text-emerald-600" /> },
                            { step: "Step 2", title: "문장이 되는 마법", desc: "흩어진 기억을 아름다운 글로 다듬어 드립니다.", icon: <Sparkles className="text-teal-600" /> },
                            { step: "Step 3", title: "자서전 완성", desc: "나만의 나이테를 품은 디지털 책이 완성됩니다.", icon: <BookOpen className="text-emerald-700" /> }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white/80 backdrop-blur-xl border border-emerald-50/50 p-10 md:p-12 rounded-[2.5rem] shadow-xl shadow-emerald-900/5 text-center group hover:-translate-y-2 transition-all"
                            >
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 md:mb-8 group-hover:scale-110 transition-transform">
                                    {React.cloneElement(item.icon as React.ReactElement, { size: 40 })}
                                </div>
                                <span className="text-emerald-600 font-bold text-sm tracking-widest uppercase mb-3 block">{item.step}</span>
                                <h3 className="text-2xl md:text-3xl font-serif font-bold mb-4 text-slate-800">{item.title}</h3>
                                <p className="text-slate-500 text-base md:text-xl leading-relaxed font-serif">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* 2. '무료 혜택 강조' 섹션 (베타테스트 안내) */}
                <div className="mt-24 md:mt-48 max-w-5xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-emerald-50/60 backdrop-blur-xl border border-emerald-100 p-10 md:p-20 rounded-[3rem] text-center relative overflow-hidden"
                    >
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-200/20 rounded-full blur-3xl" />
                        <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-8 leading-tight">
                            첫 씨앗 작가님을 위한 특별한 초대 <br />
                            <span className="text-emerald-600">(현재 100% 무료)</span>
                        </h2>
                        <div className="text-lg md:text-2xl text-slate-700 font-serif leading-relaxed max-w-3xl mx-auto space-y-6">
                            <p>리프노트는 현재 서비스의 깊이를 더해가는 중입니다. 지금 참여하시면 AI 인터뷰부터 디지털 자서전 완성까지 전 과정을 비용 부담 없이 100% 무료로 이용하실 수 있습니다.</p>
                        </div>
                    </motion.div>
                </div>

                {/* 3. '아이덴티티 및 명예의 전당' 섹션 */}
                <div className="mt-32 md:mt-56">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center px-4">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8 md:space-y-12"
                        >
                            <h2 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 leading-tight">당신의 이야기가 <br />누군가의 위로가 되고, <br /><span className="text-emerald-600">한 그루의 나무</span>가 됩니다.</h2>
                            <div className="space-y-6">
                                {[
                                    { icon: <TreePine />, title: "지구를 위한 기록", desc: "자서전 한 권이 완성될 때마다 실제 나무 한 그루를 기부합니다." },
                                    { icon: <Heart />, title: "소외 없는 기록", desc: "정보 취약 계층의 생애 기록 사업을 적극 지원합니다." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 items-start">
                                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white shadow-lg shadow-emerald-900/5 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-lg md:text-2xl font-serif font-bold text-slate-800 mb-1">{item.title}</h4>
                                            <p className="text-slate-500 text-base md:text-xl font-serif">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-white/40 backdrop-blur-md border border-slate-100 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-emerald-900/5"
                        >
                            <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-800 mb-8 pb-4 border-b border-slate-100 flex items-center gap-2">
                                <Sprout className="text-emerald-500" /> 리프노트의 깊은 뿌리가 되어주신 분들
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { name: "푸른숨 작가님", desc: "손자에게 남기는 최고의 유산이 되었습니다." },
                                    { name: "단풍잎 작가님", desc: "고향 집 앞마당의 기억이 다시 살아났어요." },
                                    { name: "새벽녘 작가님", desc: "잊고 지낸 꿈을 기록하며 위로받았습니다." }
                                ].map((author, i) => (
                                    <div key={i} className="flex justify-between items-center group">
                                        <div className="space-y-1">
                                            <p className="text-lg md:text-xl font-bold text-slate-700 font-serif group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{author.name}</p>
                                            <p className="text-sm md:text-base text-slate-400 font-serif italic">"{author.desc}"</p>
                                        </div>
                                        <div className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-tighter">Founder Author</div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-10 pt-6 border-t border-slate-50 text-center">
                                <p className="text-xs text-slate-300 font-serif uppercase tracking-widest italic">All pseudonyms are recorded permanently.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* 4. 하단 CTA 섹션 */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-32 md:mt-56 text-center px-4 pb-24 md:pb-48 relative isolate"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />

                    <h2 className="text-3xl md:text-6xl font-serif font-bold text-slate-900 mb-8 md:mb-12 leading-tight">
                        잊혀지기엔 너무나 아까운 <br className="hidden md:block" /> 당신의 인생 이야기.
                    </h2>

                    <Button
                        size="lg"
                        className="group px-14 md:px-24 py-8 md:py-12 text-xl md:text-3xl rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-4 mx-auto"
                        onClick={() => window.location.href = '/onboarding'}
                    >
                        [ 지금 무료로 첫 씨앗 심기 ] <ArrowRight className="group-hover:translate-x-3 transition-transform" />
                    </Button>

                    <div className="mt-12 md:mt-20 flex flex-wrap justify-center gap-8 md:gap-16 items-center text-sm md:text-xl text-slate-400 font-serif">
                        <span className="flex items-center gap-3"><CheckCircle2 size={24} className="text-emerald-500/60" /> 첫 시작 100% 무료</span>
                        <span className="flex items-center gap-3"><CheckCircle2 size={24} className="text-emerald-500/60" /> 초기 참여 작가 영구 기록</span>
                        <span className="flex items-center gap-3"><CheckCircle2 size={24} className="text-emerald-500/60" /> 환경 보호 기여</span>
                    </div>
                </motion.div>
            </main>

            <footer className="border-t border-slate-200/50 py-10 md:py-16 bg-white/50">
                <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-10">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md shadow-emerald-100/30">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill="white" fillOpacity="0.2" />
                                    <path d="M12 22V2M12 22C12 22 20 18 20 12C20 6 12 2 12 2M12 22C12 22 4 6 4 12C4 18 12 22 12 22ZM12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 15C13.5 15 15 15.5 15 17M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14M12 15C10.5 15 9 15.5 9 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <span className="text-base font-serif font-bold text-slate-800 tracking-tight">리프노트 <span className="text-emerald-600">LeafNote</span></span>
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
