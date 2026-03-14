"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Send,
    Sparkles,
    MessageCircle,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    Volume1,
    Loader2,
    RotateCcw,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useInterview } from '@/hooks/useInterview';
import { useBookStore, useCurrentProject } from '@/lib/store';
import { useTTS } from '@/hooks/useTTS';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LeafProgressBar from '@/components/LeafProgressBar';

const highlightEcho = (text: string) => {
    if (!text) return text;
    const parts = text.split(/(에코)/g);
    return parts.map((part, i) =>
        part === '에코' ? <span key={i} className="text-emerald-600 font-bold">에코</span> : part
    );
};

export default function InterviewPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const currentProject = useCurrentProject();
    const { tempOnboardingData, createProject, setTempOnboardingData, isSyncing, setCoverDesign } = useBookStore();
    const { speak, stop, isSpeaking, isLoading: ttsLoading, autoSpeak, toggleAutoSpeak } = useTTS();

    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
    const [continueAfterComplete, setContinueAfterComplete] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const autoSpeakRef = useRef(autoSpeak);
    autoSpeakRef.current = autoSpeak;

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/interview');
        }
    }, [status, router]);

    // Handle project creation from onboarding data
    useEffect(() => {
        const initProject = async () => {
            if (status === 'authenticated' && !currentProject && tempOnboardingData) {
                const title = tempOnboardingData.topic === '자유 주제'
                    ? '나의 기록'
                    : tempOnboardingData.topic;

                await createProject(title);
                // Save topic to coverDesign for interior layout auto-preset
                if (tempOnboardingData.topic) {
                    await setCoverDesign({ topic: tempOnboardingData.topic });
                }
                // Clear temp data once project is created
                setTempOnboardingData(null);
            } else if (status === 'authenticated' && !currentProject && !tempOnboardingData) {
                // If authenticated but no project and no onboarding data, go to dashboard
                // Small delay to allow projects to be fetched/created
                const timer = setTimeout(() => {
                    if (!currentProject) router.push('/dashboard');
                }, 1000);
                return () => clearTimeout(timer);
            }
        };
        initProject();
    }, [status, currentProject, tempOnboardingData, createProject, setTempOnboardingData, router]);

    const handleSpeak = useCallback((text: string, idx: number) => {
        if (isSpeaking && speakingIdx === idx) {
            stop();
        } else {
            setSpeakingIdx(idx);
            speak(text);
        }
    }, [isSpeaking, speakingIdx, stop, speak]);

    const interviewOptions = useMemo(() => ({
        onResponseComplete: (text: string) => {
            if (!autoSpeakRef.current) return;
            // Use a slight delay or ref to get correct message index if needed
            // For now, stable handleSpeak is better
            handleSpeak(text, -1); // -1 or special logic for auto-speak
        },
    }), [handleSpeak]);

    const { messages, sendMessage, continueConversation, undo, isLoading } = useInterview(interviewOptions);

    useEffect(() => {
        if (autoSpeakRef.current && isSpeaking && messages.length > 0) {
            const lastIdx = messages.length - 1;
            if (messages[lastIdx]?.role === 'assistant') {
                setSpeakingIdx(lastIdx);
            }
        }
    }, [isSpeaking, messages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    useEffect(() => {
        if (!isSpeaking && !ttsLoading) setSpeakingIdx(null);
    }, [isSpeaking, ttsLoading]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'ko-KR';
                recognition.continuous = true;
                recognition.interimResults = true;

                recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    let interimTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript;
                        } else {
                            interimTranscript += transcript;
                        }
                    }
                    setInput((prev) => {
                        if (finalTranscript) return prev + finalTranscript;
                        return prev.replace(/\[.*?\]$/, '') + (interimTranscript ? `[${interimTranscript}]` : '');
                    });
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                    if (event.error === 'not-allowed') {
                        setSpeechError('마이크 권한이 필요합니다. 브라우저 설정에서 허용해주세요.');
                    } else if (event.error === 'no-speech') {
                        setSpeechError(null); // 무음은 에러 아님
                    } else {
                        setSpeechError('음성 인식 중 오류가 발생했습니다. 다시 시도해주세요.');
                    }
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            }
        }
        return () => {
            recognitionRef.current?.stop();
        };
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('이 브라우저에서는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            setInput((prev) => prev.replace(/\[.*?\]$/, ''));
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleSend = () => {
        const cleanInput = input.replace(/\[.*?\]$/, '').trim();
        if (!cleanInput || isLoading) return;
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
        stop();
        sendMessage(cleanInput);
        setInput('');
    };


    if (status === 'loading') {
        return (
            <div className="h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="animate-pulse text-emerald-600 font-serif font-bold">리프노트 준비 중...</div>
            </div>
        );
    }

    if (!session || !currentProject) {
        return (
            <div className="h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="animate-pulse text-emerald-600 font-serif font-bold">리프노트 준비 중...</div>
            </div>
        );
    }

    const userMessages = messages.filter((m: any) => m.role === 'user');
    const userMsgCount = userMessages.length;
    const totalChars = userMessages.reduce((sum: number, m: any) => sum + m.content.length, 0);

    // Progress calculation: Unified with Dashboard
    // ~66 turns for 100% OR 5000 chars for 100% (or a mix)
    const interviewProgress = Math.min(Math.round(userMsgCount * 5 + totalChars / 100), 100);

    return (
        <div className="flex flex-col h-screen bg-[#FAF9F6] paper-texture">
            {/* Header */}
            <header className="border-b border-paper-edge bg-white/90 backdrop-blur-lg sticky top-0 z-50 transition-all">
                <div className="max-w-4xl mx-auto p-2.5 md:p-6 flex justify-between items-center bg-white/50">
                    <Link href="/" className="flex items-center gap-2 md:gap-3 group min-w-0">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100/30 group-hover:scale-105 transition-transform">
                            <svg width="18" height="18" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill="white" fillOpacity="0.2" />
                                <path d="M12 22V2M12 22C12 22 20 18 20 12C20 6 12 2 12 2M12 22C12 22 4 6 4 12C4 18 12 22 12 22ZM12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 15C13.5 15 15 15.5 15 17M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14M12 15C10.5 15 9 15.5 9 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                            <h1 className="text-[13px] md:text-lg font-serif font-bold text-slate-800 leading-none group-hover:text-emerald-700 transition-colors truncate">리프노트 <span className="text-emerald-600 text-[9px] md:text-xs font-sans">LeafNote</span></h1>
                            <div className="flex items-center gap-1.5 md:gap-2 mt-1">
                                <span className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-tighter md:tracking-widest truncate max-w-[80px] md:max-w-none">{currentProject.title}</span>
                                <span className="text-[8px] md:text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold shrink-0 border border-emerald-100/50">St. {currentProject.interviewStage || 1}</span>
                            </div>
                        </div>
                    </Link>
                    <div className="flex gap-1.5 md:gap-3 items-center shrink-0">
                        <div className="hidden sm:block">
                            <AnimatePresence mode="wait">
                                {isSyncing ? (
                                    <motion.div
                                        key="syncing"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-1 md:px-2.5 rounded-full border border-amber-100"
                                    >
                                        <Loader2 size={10} className="animate-spin" />
                                        <span className="hidden xs:inline">자동 저장 중...</span>
                                    </motion.div>
                                ) : messages.length > 0 ? (
                                    <motion.div
                                        key="saved"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 md:px-2.5 rounded-full border border-emerald-100"
                                    >
                                        <CheckCircle2 size={10} />
                                        <span className="hidden xs:inline">안전하게 저장됨</span>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>

                        <Button
                            variant={autoSpeak ? "default" : "outline"}
                            size="sm"
                            className={`rounded-full text-[10px] md:text-xs h-7 md:h-8 transition-all px-2.5 md:px-4 ${autoSpeak ? 'bg-emerald-600 hover:bg-emerald-700 border-none text-white' : 'text-slate-500 bg-white/50 border-slate-200'}`}
                            onClick={toggleAutoSpeak}
                        >
                            {autoSpeak ? <Volume2 size={14} className="md:mr-1.5" /> : <VolumeX size={14} className="md:mr-1.5" />}
                            <span className="hidden xs:inline">{autoSpeak ? '음성 ON' : '음성 OFF'}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/dashboard')}
                            className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 h-7 md:h-8 px-1.5 md:px-3 text-[10px] md:text-xs flex items-center"
                        >
                            <ArrowLeft className="mr-0.5 md:mr-1 h-3.5 w-3.5" /> <span>나중에</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Word Count Encouragement Banner - Slimmer on mobile */}
            {(currentProject.currentWordCount || 0) > 0 && interviewProgress < 100 && (
                <div className="max-w-4xl mx-auto w-full px-4 md:px-8 mt-2 md:mt-4">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-100 rounded-xl md:rounded-2xl p-2 md:p-3 flex flex-row items-center justify-between shadow-sm shadow-emerald-900/5 mb-[-0.5rem] md:mb-[-1rem] relative z-10"
                    >
                        <div className="flex items-center gap-2 md:gap-3">
                            <span className="text-lg md:text-2xl drop-shadow-sm">🌱</span>
                            <div>
                                <p className="text-[11px] md:text-sm font-bold text-emerald-800 font-serif">
                                    현재 약 <span className="text-emerald-600 text-sm md:text-lg">{(currentProject.currentWordCount || 0).toLocaleString()}</span>자의 이야기가 자라났습니다.
                                </p>
                                <p className="hidden md:block text-xs text-emerald-600/80 font-medium break-keep">
                                    한 권의 푸른 숲(책)을 완성하기 위해, 에코와 조금 더 깊은 대화를 나누어 주세요.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Main Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full" ref={scrollRef}>
                <AnimatePresence>
                    {messages.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-20"
                        >
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 leaf-shadow">
                                <Sparkles className="text-emerald-500 w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">따뜻한 기록가 <span className="text-emerald-600">"에코"</span>가 기다립니다</h2>
                            <p className="text-slate-500 max-w-md mx-auto">
                                당신의 소중한 기억을 잎사귀처럼 하나씩 채집해 드릴게요. <br />
                                편안하게 이야기를 들려주세요.
                            </p>
                            <Button
                                className="mt-8 px-10 py-6 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-xl"
                                onClick={() => sendMessage("인터뷰를 시작하고 싶어요.")}
                            >
                                대화 시작하기
                            </Button>
                        </motion.div>
                    )}

                    {messages.map((m, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex flex-col gap-2 max-w-[85%]`}>
                                <div className={`p-3.5 md:p-5 rounded-2xl shadow-sm border ${m.role === 'user'
                                    ? 'bg-emerald-600 text-white rounded-tr-none border-emerald-700 shadow-emerald-100'
                                    : 'bg-white text-slate-800 rounded-tl-none border-paper-edge leaf-shadow'
                                    }`}>
                                    {m.role === 'assistant' && (
                                        <div className="flex items-center gap-1.5 mb-1.5 text-emerald-600 font-bold text-[9px] md:text-[10px] uppercase tracking-widest bg-emerald-50/50 w-fit px-2 py-0.5 rounded-full">
                                            <Sparkles size={10} className="md:w-3 md:h-3" /> 따뜻한 기록가 에코
                                        </div>
                                    )}
                                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{m.role === 'assistant' ? highlightEcho(m.content) : m.content || '...'}</p>
                                </div>
                                {m.role === 'assistant' && m.content && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleSpeak(m.content, i)}
                                            className={`self-start flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${isSpeaking && speakingIdx === i
                                                ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                                }`}
                                        >
                                            {isSpeaking && speakingIdx === i ? (
                                                <><Volume2 size={12} /> 재생 중...</>
                                            ) : ttsLoading && speakingIdx === i ? (
                                                <><Loader2 size={12} className="animate-spin" /> 생성 중...</>
                                            ) : (
                                                <><Volume1 size={12} /> 음성 듣기</>
                                            )}
                                        </button>

                                        {i === messages.length - 1 && !isLoading && !m.content.replace(/[^a-zA-Z가-힣0-9.!?~"\'」』\\)]+$/, '').match(/[.!?~"\'」』\\)]$/) && (
                                            <button
                                                onClick={() => continueConversation()}
                                                className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all border border-amber-100"
                                            >
                                                <RotateCcw size={10} className="rotate-90" /> 이어서 말하기
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="p-4 rounded-2xl bg-white border border-paper-edge leaf-shadow flex items-center gap-2">
                                <span className="flex gap-1">
                                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                </span>
                                <span className="text-xs text-slate-400 italic"><span className="text-emerald-500 font-medium">에코</span>가 기록 중...</span>
                            </div>
                        </div>
                    )}

                    {interviewProgress >= 100 && !isLoading && !continueAfterComplete && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="mt-12 p-8 rounded-3xl bg-emerald-50 border border-emerald-100 shadow-xl shadow-emerald-900/5 text-center flex flex-col items-center justify-center isolate relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-300/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                            <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center mb-6 relative z-10">
                                <span className="text-4xl">🌳</span>
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-emerald-800 mb-3 relative z-10">나무가 모두 자라났습니다!</h3>
                            <p className="text-emerald-700/80 mb-8 max-w-sm relative z-10 leading-relaxed break-keep">
                                작가님의 귀중한 이야기들이 모여 한 권의 책이 될 준비를 마쳤습니다. 이제 이 이야기들을 멋지게 다듬으러 가볼까요?
                            </p>
                            <Button
                                onClick={() => router.push('/editor')}
                                className="h-14 px-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all relative z-10 group"
                            >
                                자라난 나무(원고) 다듬기
                                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <button
                                onClick={() => setContinueAfterComplete(true)}
                                className="mt-4 text-sm text-emerald-600/70 hover:text-emerald-700 underline underline-offset-4 transition-colors relative z-10"
                            >
                                조금 더 이야기하고 싶어요
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Sticky Progress Bar */}
            <div className="max-w-4xl mx-auto w-full px-4 md:px-8 pt-4 pb-2 bg-[#FAF9F6]/80 backdrop-blur-sm">
                <LeafProgressBar progress={interviewProgress} />
            </div>

            {/* Footer Input - Optimized for mobile reach */}
            <footer className="p-3 md:p-8 bg-white/80 backdrop-blur-md border-t border-paper-edge relative pb-safe">
                {interviewProgress >= 100 && !continueAfterComplete && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <p className="text-[11px] md:text-sm font-bold text-emerald-800 bg-white px-4 py-2 rounded-full shadow-sm border border-emerald-100 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            인터뷰가 완료되었습니다.
                        </p>
                    </div>
                )}
                <div className="max-w-4xl mx-auto flex gap-2 md:gap-3 items-center">
                    <Button
                        variant={isListening ? "default" : "outline"}
                        className={`rounded-full w-12 h-12 md:w-14 md:h-14 p-0 shrink-0 transition-all ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse border-none text-white' : 'text-emerald-600 border-emerald-100 hover:bg-emerald-50'}`}
                        onClick={toggleListening}
                    >
                        {isListening ? <MicOff size={20} className="md:w-6 md:h-6" /> : <Mic size={20} className="md:w-6 md:h-6" />}
                    </Button>
                    <div className="relative flex-1">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isListening ? "🎙️ 듣고 있습니다..." : "대답해 주세요..."}
                            className="pr-12 md:pr-14 py-6 md:py-7 rounded-xl md:rounded-2xl border-paper-edge focus-visible:ring-emerald-500 bg-white/50 shadow-inner text-sm md:text-base"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={isLoading || !input.replace(/\[.*?\]$/, '').trim()}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg md:rounded-xl w-9 h-9 md:w-10 md:h-10 p-0 bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all active:scale-95"
                        >
                            <Send size={16} className="text-white md:w-4.5 md:h-4.5" />
                        </Button>
                    </div>
                </div>
                {isListening && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-4xl mx-auto mt-3 text-xs text-emerald-600 font-bold text-center"
                    >
                        인터뷰 내용이 자동으로 텍스트로 변환되고 있습니다.
                    </motion.p>
                )}
                {speechError && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-4xl mx-auto mt-2 text-xs text-red-500 text-center flex items-center justify-center gap-1"
                    >
                        <AlertCircle size={12} />
                        {speechError}
                    </motion.p>
                )}
            </footer>
        </div>
    );
}
