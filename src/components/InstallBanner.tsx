"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Share, Plus } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function InstallBanner() {
    const { showBanner, isIOS, deferredPrompt, install, dismiss } = useInstallPrompt();

    if (!showBanner) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 relative"
            >
                <button
                    onClick={dismiss}
                    className="absolute top-3 right-3 text-emerald-400 hover:text-emerald-600 transition-colors"
                    aria-label="닫기"
                >
                    <X size={16} />
                </button>

                <div className="flex items-start gap-3 pr-6">
                    <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <Smartphone size={18} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-emerald-800 font-serif">홈 화면에 추가하기</p>
                        <p className="text-xs text-emerald-600 font-serif mt-0.5">앱처럼 바로 실행할 수 있어요</p>

                        {deferredPrompt ? (
                            <button
                                onClick={install}
                                className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors font-serif"
                            >
                                홈 화면에 추가
                            </button>
                        ) : (
                            /* iOS: 공유 버튼 안내 */
                            <div className="mt-2 space-y-1.5">
                                <div className="flex items-center gap-2 text-xs text-emerald-700 font-serif">
                                    <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">1</span>
                                    <span>하단 <strong>공유(</strong><Share size={10} className="inline" /><strong>)</strong> 버튼을 누르세요</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-emerald-700 font-serif">
                                    <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">2</span>
                                    <span><strong>홈 화면에 추가</strong>를 선택하세요</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
