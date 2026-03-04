"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Sparkles, UserCircle, ArrowLeft, Loader2, Info, RotateCcw } from 'lucide-react';
import { useBookStore } from '@/lib/store';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { chatHistory, addChatMessage, persistChatMessage, projects, userProfile, setChatHistory } = useBookStore();
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [showContinuationPrompt, setShowContinuationPrompt] = useState(false);
    const hasPromptedRef = useRef(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, isTyping]);

    // Check for existing history on mount
    useEffect(() => {
        if (status === 'authenticated' && chatHistory.length > 0 && !hasPromptedRef.current) {
            setShowContinuationPrompt(true);
            hasPromptedRef.current = true;
        }
    }, [status, chatHistory.length]);

    // Initial greeting if history is empty
    useEffect(() => {
        const fetchGreeting = async () => {
            if (chatHistory.length === 0 && session?.user && !showContinuationPrompt) {
                setIsTyping(true);
                try {
                    // Gather context for the initial greeting
                    const context = projects
                        .filter(p => !p.isDeleted)
                        .map(p => ({
                            title: p.title,
                            interviewData: p.interviewData,
                            fullDraft: (p.fullDraft || '').substring(0, 500)
                        }));

                    const res = await fetch('/api/chat', {
                        method: 'POST',
                        body: JSON.stringify({
                            isInitial: true,
                            context,
                            userName: session.user.name || '작가님',
                            track: 'casual'
                        })
                    });

                    if (res.ok) {
                        const reader = res.body?.getReader();
                        const decoder = new TextDecoder();
                        let assistantContent = '';
                        const placeholderTs = Date.now();

                        addChatMessage('assistant', '');

                        if (reader) {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;

                                const chunk = decoder.decode(value, { stream: true });
                                assistantContent += chunk;

                                // Update the last message in history
                                useBookStore.setState((state) => {
                                    const history = [...state.chatHistory];
                                    if (history.length > 0) {
                                        history[history.length - 1].content = assistantContent;
                                    }
                                    return { chatHistory: history };
                                });
                            }
                        }

                        // Persist final content to DB after streaming
                        await persistChatMessage('assistant', assistantContent, placeholderTs);
                    }
                } catch (error) {
                    console.error("Failed to get greeting:", error);
                } finally {
                    setIsTyping(false);
                }
            }
        };
        if (status === 'authenticated') fetchGreeting();
    }, [status, session, chatHistory.length, showContinuationPrompt]);

    const handleStartNewConversation = () => {
        setChatHistory([]);
        setShowContinuationPrompt(false);
    };

    const handleContinueConversation = () => {
        setShowContinuationPrompt(false);
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMessage = input.trim();
        setInput('');
        addChatMessage('user', userMessage);
        setIsTyping(true);

        try {
            const context = projects
                .filter(p => !p.isDeleted)
                .map(p => ({
                    title: p.title,
                    interviewData: p.interviewData,
                    fullDraft: (p.fullDraft || '').substring(0, 500)
                }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message: userMessage,
                    history: chatHistory.slice(-10),
                    context,
                    userName: session?.user?.name || '작가님',
                    track: 'casual'
                })
            });

            if (res.ok) {
                const reader = res.body?.getReader();
                const decoder = new TextDecoder();
                let assistantContent = '';
                const placeholderTs = Date.now();

                addChatMessage('assistant', '');

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        assistantContent += chunk;

                        // Update the last message in history
                        useBookStore.setState((state) => {
                            const history = [...state.chatHistory];
                            if (history.length > 0) {
                                history[history.length - 1].content = assistantContent;
                            }
                            return { chatHistory: history };
                        });
                    }
                }

                // Persist final content to DB after streaming
                await persistChatMessage('assistant', assistantContent, placeholderTs);
            }
        } catch (error) {
            console.error("Chat error:", error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleContinue = async () => {
        if (isTyping || chatHistory.length === 0) return;
        const lastMsg = chatHistory[chatHistory.length - 1];
        if (lastMsg.role !== 'assistant') return;

        setIsTyping(true);
        const originalContent = lastMsg.content;

        try {
            const context = projects
                .filter(p => !p.isDeleted)
                .map(p => ({
                    title: p.title,
                    interviewData: p.interviewData,
                    fullDraft: (p.fullDraft || '').substring(0, 500)
                }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    history: chatHistory,
                    message: "이어서 계속 말씀해주세요.",
                    context,
                    userName: session?.user?.name || '작가님',
                    track: 'casual'
                })
            });

            if (res.ok) {
                const reader = res.body?.getReader();
                const decoder = new TextDecoder();
                let addedContent = '';

                if (reader) {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        addedContent += chunk;

                        useBookStore.setState((state) => {
                            const history = [...state.chatHistory];
                            if (history.length > 0) {
                                history[history.length - 1].content = originalContent + addedContent;
                            }
                            return { chatHistory: history };
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Continue chat error:", error);
        } finally {
            setIsTyping(false);
        }
    };

    if (status === 'loading') return null;

    return (
        <div className="min-h-screen bg-[#faf9f6] flex flex-col relative">
            {/* Continuation Overlay */}
            <AnimatePresence>
                {showContinuationPrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: -20 }}
                            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-emerald-100 relative overflow-hidden text-center"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-emerald-600 shadow-inner">
                                <Sparkles size={28} />
                            </div>

                            <h3 className="text-xl font-bold font-serif text-slate-800 mb-2 break-keep">어떻게 대화를 시작할까요?</h3>
                            <p className="text-sm text-slate-500 mb-8 break-keep">이전 대화가 남아있습니다. 이어서 대화하려면 계속하기를, 백지에서 새로 시작하려면 새로운 대화를 선택해 주세요.</p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleContinueConversation}
                                    className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                                >
                                    <MessageCircle size={18} /> 이전 대화 이어하기
                                </button>
                                <button
                                    onClick={handleStartNewConversation}
                                    className="w-full py-4 px-6 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                                >
                                    <RotateCcw size={18} /> 새로운 대화 시작하기
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-serif font-bold text-slate-800">에코와 대화하기</h1>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">나의 이야기를 기억하는 동반자</p>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-100">
                        <Info size={14} className="text-amber-600" />
                        <span className="text-[11px] text-amber-700 font-medium">에코는 당신의 모든 기록을 소중히 기억합니다.</span>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto p-4 space-y-6" ref={scrollRef}>
                <AnimatePresence initial={false}>
                    {chatHistory.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${msg.role === 'user' ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100'
                                    }`}>
                                    {msg.role === 'user' ? (
                                        session?.user?.image ? <img src={session.user.image} className="w-full h-full rounded-full object-cover" /> : <UserCircle size={14} className="text-white" />
                                    ) : (
                                        <Sparkles size={14} className="text-emerald-600" />
                                    )}
                                </div>
                                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-emerald-600 text-white rounded-tr-none'
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none font-serif'
                                    }`}>
                                    {msg.content.split('\n').map((line, idx) => (
                                        <p key={idx}>{line}</p>
                                    ))}

                                    {msg.role === 'assistant' && i === chatHistory.length - 1 && !isTyping && !msg.content.replace(/[^a-zA-Z가-힣0-9.!?~"\'」』\\)]+$/, '').match(/[.!?~"\'」』\\)]$/) && (
                                        <button
                                            onClick={handleContinue}
                                            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-all border border-amber-200 shadow-sm"
                                        >
                                            <RotateCcw size={10} className="rotate-90" /> 이어서 계속 듣기
                                        </button>
                                    )}

                                    <p className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                        {new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(msg.timestamp)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                        >
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-white border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                                    <Sparkles size={14} className="text-emerald-600" />
                                </div>
                                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Input Area */}
            <footer className="bg-white border-t p-4 sticky bottom-0">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="에코와 대화하며 따뜻한 영감을 얻어보세요..."
                        className="flex-1 p-4 pr-14 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all font-serif shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-6 p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 disabled:opacity-50 disabled:shadow-none"
                    >
                        <Send size={18} />
                    </button>
                </form>
                <p className="text-center text-[10px] text-slate-400 mt-2">에코는 작가님이 남겨주신 소중한 기록들을 기억하며 대화합니다.</p>
            </footer>
        </div>
    );
}
