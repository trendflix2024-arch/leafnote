"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Image, Layers, Type, Settings } from 'lucide-react';
import { MagicFrameLayout } from '@/components/magic-frame/MagicFrameLayout';

export default function MagicFrameLanding() {
    return (
        <MagicFrameLayout>
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6 mb-16"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-200">
                        <Sparkles size={36} className="text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 leading-tight">
                        거울 액자로<br />
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            나만의 무드를 만드세요
                        </span>
                    </h1>
                    <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                        나만의 사진을 액자 규격에 맞게 편집하고,
                        특별한 문구를 더해 세상에 하나뿐인 매직액자를 완성하세요.
                    </p>
                </motion.div>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
                >
                    {[
                        { icon: Image, title: '사진 크롭', desc: '3:4, 4:3 비율에 맞게 사진을 편집하세요', color: 'from-blue-500 to-blue-600' },
                        { icon: Layers, title: '콜라주 메이커', desc: '최대 4장의 사진을 하나의 액자로 합성하세요', color: 'from-purple-500 to-purple-600' },
                        { icon: Type, title: '문구 삽입', desc: '감성적인 문구를 사진 위에 자유롭게 추가하세요', color: 'from-pink-500 to-pink-600' },
                    ].map((f, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center space-y-3">
                            <div className={`w-12 h-12 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center mx-auto shadow-lg`}>
                                <f.icon size={22} className="text-white" />
                            </div>
                            <h3 className="font-bold text-slate-700">{f.title}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                >
                    <Link href="/magic-frame/login"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full shadow-xl shadow-indigo-200 hover:shadow-2xl hover:scale-[1.02] transition-all text-lg">
                        시작하기 <ArrowRight size={20} />
                    </Link>
                    <p className="text-xs text-slate-400 mt-4">간단한 본인 확인 후 바로 편집을 시작할 수 있어요</p>
                </motion.div>

                <div className="text-center mt-16">
                    <Link href="/magic-frame/admin"
                        className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-slate-500 transition-colors">
                        <Settings size={12} /> 관리자
                    </Link>
                </div>
            </div>
        </MagicFrameLayout>
    );
}
