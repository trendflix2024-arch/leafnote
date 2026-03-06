"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Share, Plus } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function InstallBanner() {
    const { showBanner, isIOS, isAndroid, deferredPrompt, install, dismiss } = useInstallPrompt();
    const [showGuide, setShowGuide] = useState(false);

    if (!showBanner) return null;

    // Android + 네이티브 프롬프트 사용 가능 → 버튼 한 번으로 설치
    const canNativeInstall = isAndroid && !!deferredPrompt;

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
                        <p className="text-sm font-semibold text-emerald-800 font-serif">
                            홈 화면에 추가하기
                        </p>
                        <p className="text-xs text-emerald-600 font-serif mt-0.5">
                            앱처럼 바로 실행할 수 있어요
                        </p>

                        {canNativeInstall ? (
                            <button
                                onClick={install}
                                className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors font-serif"
                            >
                                홈 화면에 추가
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setShowGuide(v => !v)}
                                    className="mt-2 text-xs font-semibold text-emerald-700 underline underline-offset-2"
                                >
                                    {showGuide ? '안내 닫기' : '추가 방법 보기'}
                                </button>
                                <AnimatePresence>
                                    {showGuide && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-2 space-y-1.5">
                                                {isIOS ? (
                                                    <>
                                                        <div className="flex items-center gap-2 text-xs text-emerald-700 font-serif">
                                                            <Share size={13} className="shrink-0" />
                                                            <span>하단의 <strong>공유</strong> 버튼을 누르세요</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-emerald-700 font-serif">
                                                            <Plus size={13} className="shrink-0" />
                                                            <span><strong>홈 화면에 추가</strong>를 선택하세요</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2 text-xs text-emerald-700 font-serif">
                                                            <span className="shrink-0 font-bold text-sm">⋮</span>
                                                            <span>Chrome 우측 상단 <strong>메뉴(⋮)</strong>를 누르세요</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-emerald-700 font-serif">
                                                            <Plus size={13} className="shrink-0" />
                                                            <span><strong>홈 화면에 추가</strong>를 선택하세요</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
