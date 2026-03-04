"use client";

import { motion } from 'framer-motion';
import { Sparkles, PenTool, ArrowRight, MessageCircle, Sprout } from 'lucide-react';

const messages = [
    {
        role: 'echo',
        content: "안녕하세요, 작가님. 저는 작가님의 이야기를 담아낼 따뜻한 기록자 에코입니다. 혹시 작가님의 어린 시절, 가장 좋아하셨던 계절은 언제였나요?",
        delay: 0.5
    },
    {
        role: 'author',
        content: "글쎄, 나는 가을이 참 좋았어. 동네 뒷산에서 친구들이랑 밤 주워 먹던 기억이 나거든.",
        delay: 2.0
    },
    {
        role: 'echo',
        content: "아, 뒷산에서 친구분들과 밤을 주우셨군요! 참 정겨운 풍경입니다. 그때 함께했던 친구분들 중, 지금도 문득 생각나는 분이 있으신가요?",
        delay: 3.5
    }
];

export function ChatPreview() {
    return (
        <section className="mt-24 md:mt-40 relative px-4">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 border border-slate-100 overflow-hidden"
                >
                    {/* Mock Window Header */}
                    <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-slate-200" />
                            <div className="w-3 h-3 rounded-full bg-slate-200" />
                            <div className="w-3 h-3 rounded-full bg-slate-200" />
                        </div>
                        <span className="text-xs font-serif font-bold text-slate-400 tracking-widest uppercase">Echo Narrative Interface</span>
                        <div className="w-10" />
                    </div>

                    <div className="p-8 md:p-12 space-y-10 min-h-[500px] flex flex-col justify-center bg-[#FDFCFB]">
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: msg.delay, duration: 0.8 }}
                                className={`flex ${msg.role === 'echo' ? 'justify-start' : 'justify-end'} items-start gap-4`}
                            >
                                {msg.role === 'echo' && (
                                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100 mt-1">
                                        <Sprout size={20} className="text-white" />
                                    </div>
                                )}
                                <div className="max-w-[85%] md:max-w-[70%] space-y-2">
                                    {msg.role === 'echo' && (
                                        <div className="flex items-center gap-1.5 ml-1 mb-1">
                                            <Sparkles size={12} className="text-emerald-500" />
                                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-tight">따뜻한 기록가 에코</span>
                                        </div>
                                    )}
                                    <div className={`p-6 md:p-7 rounded-3xl text-lg md:text-xl font-serif leading-relaxed shadow-sm ${msg.role === 'echo'
                                        ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                                        : 'bg-emerald-600 text-white rounded-tr-none shadow-emerald-200/50'
                                        }`}>
                                        {msg.content}
                                    </div>
                                    {msg.role === 'echo' && (
                                        <div className="flex gap-4 ml-2 mt-2">
                                            <div className="text-[10px] text-slate-300 font-serif flex items-center gap-1">
                                                <MessageCircle size={10} /> 음성 듣기
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Mock Input Bar */}
                    <div className="px-8 py-6 bg-white border-t border-slate-50 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                            <PenTool size={18} />
                        </div>
                        <div className="flex-1 h-12 bg-slate-50 rounded-full px-6 flex items-center text-slate-300 text-sm font-serif italic">
                            내 대답을 입력해 주세요...
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                            <ArrowRight size={18} />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 4.5 }}
                    className="mt-12 text-center"
                >
                    <p className="text-xl md:text-2xl text-slate-800 font-serif font-bold break-keep">
                        <span className="text-emerald-600">복잡한 글쓰기는 잊으세요.</span><br className="sm:hidden" /> 편안하게 대화만 하시면 한 권의 책이 됩니다.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
