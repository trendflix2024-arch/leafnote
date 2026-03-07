"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useBookStore, useCurrentProject } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, ArrowRight, ArrowLeft, Save, GripVertical, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, Sparkles, Volume2, Undo2, Redo2, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressStepper from '@/components/ProgressStepper';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTTS } from '@/hooks/useTTS';

interface Chapter {
    id: string;
    title: string;
    content: string;
}

function parseChapters(draft: string): Chapter[] {
    if (!draft?.trim()) return [{ id: '1', title: '챕터 1', content: '' }];

    const parts = draft.split(/\n(?=##\s|제\s*\d+\s*장|Chapter\s+\d+)/i).filter(Boolean);

    if (parts.length <= 1) {
        const paragraphs = draft.split(/\n\n+/).filter(Boolean);
        const chunkSize = Math.max(1, Math.ceil(paragraphs.length / 3));
        const chapters: Chapter[] = [];
        for (let i = 0; i < paragraphs.length; i += chunkSize) {
            const chunk = paragraphs.slice(i, i + chunkSize).join('\n\n');
            chapters.push({
                id: String(Date.now() + i),
                title: `챕터 ${chapters.length + 1}`,
                content: chunk,
            });
        }
        return chapters.length > 0 ? chapters : [{ id: '1', title: '챕터 1', content: draft }];
    }

    return parts.map((part, i) => {
        const lines = part.trim().split('\n');
        const firstLine = lines[0].replace(/^##\s*/, '').replace(/^제\s*\d+\s*장\s*[:：]?\s*/, '').trim();
        const hasTitle = firstLine.length < 50;
        return {
            id: String(Date.now() + i),
            title: hasTitle ? firstLine || `챕터 ${i + 1}` : `챕터 ${i + 1}`,
            content: hasTitle ? lines.slice(1).join('\n').trim() : part.trim(),
        };
    });
}

function EditorContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTone = searchParams.get('tone') || '';

    const currentProject = useCurrentProject();
    const { setFullDraft } = useBookStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [activeChapter, setActiveChapter] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isRewriting, setIsRewriting] = useState(false);
    const [rewriteMode, setRewriteMode] = useState<string | null>(null);
    const [selectedText, setSelectedText] = useState('');
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [fontSize, setFontSize] = useState(24); // Default senior-friendly size
    const { speak, stop, isSpeaking } = useTTS();

    // History (Undo/Redo) State
    const [history, setHistory] = useState<Chapter[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Auto-Save State
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSavedDraft, setLastSavedDraft] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Initialize from project
    useEffect(() => {
        if (currentProject?.fullDraft) {
            const initial = parseChapters(currentProject.fullDraft);
            setChapters(initial);
            setHistory([initial]);
            setHistoryIndex(0);
            setLastSavedDraft(currentProject.fullDraft);
        } else if (currentProject && !currentProject.fullDraft) {
            const initial = [{ id: '1', title: '시작하기', content: '' }];
            setChapters(initial);
            setHistory([initial]);
            setHistoryIndex(0);
        }
    }, [currentProject?.id]);

    // Redirect if no project selected
    useEffect(() => {
        if (status === 'authenticated' && !currentProject) {
            router.push('/dashboard');
        }
    }, [currentProject, status, router]);

    const saveDraft = async (silent = false) => {
        if (!currentProject) return;
        const combined = chapters.map(c => `## ${c.title}\n\n${c.content}`).join('\n\n');

        // Prevent unnecessary saves
        if (combined === lastSavedDraft) return;

        if (silent) setIsAutoSaving(true);
        await setFullDraft(combined);
        setLastSavedDraft(combined);
        if (silent) {
            setTimeout(() => setIsAutoSaving(false), 2000);
        }
    };

    // Auto-Save Debounce Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (chapters.length > 0 && currentProject) {
                const combined = chapters.map(c => `## ${c.title}\n\n${c.content}`).join('\n\n');
                if (combined !== lastSavedDraft) {
                    saveDraft(true);
                }
            }
        }, 3000); // Auto-save after 3 seconds of inactivity

        return () => clearTimeout(timer);
    }, [chapters, currentProject, lastSavedDraft]);

    // History Debounce inside Textarea onChange
    useEffect(() => {
        // We only want to push to history after typing stops, not on every keystroke
        const timer = setTimeout(() => {
            if (historyIndex >= 0 && JSON.stringify(chapters) !== JSON.stringify(history[historyIndex])) {
                const newHistory = [...history.slice(0, historyIndex + 1), chapters];
                // Keep last 50 states to prevent memory issues
                if (newHistory.length > 50) newHistory.shift();
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
            }
        }, 1000); // Push to history after 1s of inactivity

        return () => clearTimeout(timer);
    }, [chapters]);

    const pushImmediateHistory = (newChapters: Chapter[]) => {
        const newHistory = [...history.slice(0, historyIndex + 1), newChapters];
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setChapters(prevState);
            setHistoryIndex(historyIndex - 1);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setChapters(nextState);
            setHistoryIndex(historyIndex + 1);
        }
    };

    // Auto-draft generation effect
    useEffect(() => {
        if (!currentProject || isGenerating) return;

        // If there's no draft but there is interview data, automatically generate
        if (!currentProject.fullDraft?.trim() && currentProject.interviewData?.length > 0) {
            generateDraft();
        }
    }, [currentProject?.id, currentProject?.fullDraft, currentProject?.interviewData?.length]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
                <div className="animate-pulse text-slate-400 font-serif">인증 확인 중...</div>
            </div>
        );
    }

    if (!session || !currentProject) return null;

    async function generateDraft() {
        if (!currentProject) return;
        setIsGenerating(true);
        setGenerateError(null);
        try {
            const currentTone = searchParams?.get('tone') || '';
            const toneParam = currentTone ? { tone: currentTone } : {};
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    interviewData: currentProject.interviewData,
                    projectTitle: currentProject.title,
                    author: currentProject.author,
                    ...toneParam
                }),
            });

            const data = await response.json();
            if (data.draft) {
                const parsed = parseChapters(data.draft);
                setChapters(parsed);
                setActiveChapter(0);

                const combined = parsed.map(c => `## ${c.title}\n\n${c.content}`).join('\n\n');
                await setFullDraft(combined);
            } else if (data.error === 'upgrade_required') {
                setGenerateError('upgrade_required');
            } else if (data.error) {
                setGenerateError(data.error);
            }
        } catch (error: any) {
            console.error('Draft generation failed:', error);
            setGenerateError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setIsGenerating(false);
        }
    }

    if (generateError) {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-500 text-2xl">✕</span>
                </div>
                <h2 className="text-xl font-serif font-bold text-slate-800 mb-2">원고 생성 실패</h2>
                <p className="text-slate-500 text-sm mb-6 max-w-sm">
                    {generateError === 'upgrade_required'
                        ? '무료 플랜에서는 원고를 1회만 생성할 수 있습니다. 구독 후 무제한으로 이용하세요.'
                        : generateError}
                </p>
                <div className="flex gap-3">
                    {generateError === 'upgrade_required' && (
                        <Button onClick={() => router.push('/payment')} className="bg-amber-500 hover:bg-amber-600 rounded-full px-6">
                            구독하기
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => { setGenerateError(null); generateDraft(); }} className="rounded-full px-6">
                        다시 시도
                    </Button>
                </div>
            </div>
        );
    }

    if (isGenerating) {
        return (
            <div className="min-h-screen bg-emerald-900 flex flex-col items-center justify-center p-6 text-center isolate relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-emerald-800/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-emerald-700/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 flex items-center justify-center mb-8 shadow-2xl relative">
                        <Sparkles className="w-10 h-10 text-emerald-300 absolute top-2 right-2 animate-pulse" />
                        <span className="text-5xl">✍️</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6 tracking-tight">
                        원고를 다듬고 있습니다
                    </h2>

                    <div className="max-w-md space-y-4 text-emerald-100/90 text-lg break-keep font-medium leading-relaxed">
                        <p>
                            에코가 작가님의 소중한 인터뷰 기록을 바탕으로<br />
                            한 편의 완성된 이야기 초안을 작성 중입니다.
                        </p>
                        <p className="text-sm opacity-70 mt-4">
                            약 1~2분 정도 소요될 수 있습니다. 잠시만 기다려주세요.
                        </p>
                    </div>

                    <div className="mt-12 flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm border border-white/10">
                        <Loader2 className="w-5 h-5 text-emerald-300 animate-spin" />
                        <span className="text-white font-bold text-sm">에코가 집필 중...</span>
                    </div>
                </div>
            </div>
        );
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            const markdownImage = `\n\n![첨부 사진](${data.url})\n\n`;

            // Insert image into the active chapter
            const newChapters = [...chapters];
            newChapters[activeChapter].content += markdownImage;
            setChapters(newChapters);
            pushImmediateHistory(newChapters);

        } catch (error) {
            console.error('Photo upload error:', error);
            alert('사진 첨부에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const addChapter = () => {
        const newChapter: Chapter = {
            id: String(Date.now()),
            title: `챕터 ${chapters.length + 1}`,
            content: '',
        };
        const updated = [...chapters, newChapter];
        setChapters(updated);
        pushImmediateHistory(updated);
        setActiveChapter(chapters.length);
    };

    const deleteChapter = (idx: number) => {
        if (chapters.length <= 1) return;
        const updated = chapters.filter((_, i) => i !== idx);
        setChapters(updated);
        pushImmediateHistory(updated);
        setActiveChapter(Math.min(activeChapter, updated.length - 1));
    };

    const moveChapter = (idx: number, dir: number) => {
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= chapters.length) return;
        const updated = [...chapters];
        [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
        setChapters(updated);
        setActiveChapter(newIdx);
    };

    const updateChapter = (idx: number, field: 'title' | 'content', value: string) => {
        setChapters(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    };

    const rewriteSection = async (mode: string) => {
        const textToRewrite = selectedText || chapters[activeChapter]?.content;
        if (!textToRewrite?.trim()) return;

        setIsRewriting(true);
        setRewriteMode(mode);

        const prompts: Record<string, string> = {
            'detail': `다음 텍스트를 더 구체적이고 생생하게 묘사해주세요. 감각적 디테일과 감정을 추가하세요:\n\n${textToRewrite}`,
            'concise': `다음 텍스트를 간결하고 임팩트 있게 다듬어주세요. 핵심만 남기세요:\n\n${textToRewrite}`,
            'literary': `다음 텍스트를 문학적이고 예술적인 산문체로 변환해주세요:\n\n${textToRewrite}`,
            'warm': `다음 텍스트를 더 따뜻하고 감성적인 톤으로 재작성해주세요:\n\n${textToRewrite}`,
        };

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    interviewData: [{ question: '재작성 요청', answer: prompts[mode] }],
                    projectTitle: currentProject.title,
                }),
            });
            const data = await response.json();
            if (data.draft) {
                if (selectedText) {
                    const currentContent = chapters[activeChapter].content;
                    const newContent = currentContent.replace(selectedText, data.draft);
                    const updated = chapters.map((c, i) => i === activeChapter ? { ...c, content: newContent } : c);
                    setChapters(updated);
                    pushImmediateHistory(updated);
                } else {
                    const updated = chapters.map((c, i) => i === activeChapter ? { ...c, content: data.draft } : c);
                    setChapters(updated);
                    pushImmediateHistory(updated);
                }
            } else if (data.error) {
                alert(`다듬기 실패: ${data.error}`);
            }
        } catch (error: any) {
            console.error('Rewrite failed:', error);
            alert('문장 다듬기 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setIsRewriting(false);
            setRewriteMode(null);
        }
    };

    const wordCount = chapters.reduce((sum, c) => sum + (c.content?.length || 0), 0);

    return (
        <div className="min-h-screen bg-[#faf9f6] flex flex-col">
            <ProgressStepper />
            <header className="p-4 md:p-8 border-b bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center sticky top-0 z-30 shadow-sm gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/dashboard')}
                        className="rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 shrink-0"
                        title="나의 숲(대시보드)으로 돌아가기"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl md:text-3xl font-serif font-bold text-slate-800 tracking-tight line-clamp-1">원고 다듬기</h1>
                        <p className="text-[10px] md:text-sm text-slate-400 font-medium line-clamp-1">에코가 당신의 이야기를 문장으로 옮겨두었습니다.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-100 scale-90 md:scale-100 origin-left shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setFontSize(Math.max(18, fontSize - 2))} className="h-7 w-7 md:h-8 md:w-8 p-0 text-slate-500">가-</Button>
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 w-6 md:w-8 text-center">{fontSize}</span>
                        <Button variant="ghost" size="sm" onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="h-7 w-7 md:h-8 md:w-8 p-0 text-slate-500">가+</Button>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                        <Button variant="outline" size="sm" className="rounded-xl px-2 md:px-3 font-bold text-[10px] md:text-xs h-8 md:h-9" onClick={() => router.push('/interview')}>인터뷰 추가</Button>
                        <Button size="sm" onClick={() => router.push('/design')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 md:px-4 font-bold shadow-lg shadow-emerald-100 text-[10px] md:text-xs h-8 md:h-9">
                            다음 단계 <ArrowRight className="ml-1 h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full flex overflow-hidden">
                <div className={`flex-1 max-w-7xl mx-auto w-full p-4 lg:p-12 transition-all duration-500 ${isFocusMode ? 'max-w-4xl' : ''}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 h-full">
                        <AnimatePresence>
                            {!isFocusMode && (
                                <motion.aside
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="lg:col-span-4 space-y-6"
                                >
                                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="font-bold text-lg text-slate-800 px-2">목차</h3>
                                            <div className="h-1 w-8 bg-emerald-500 rounded-full mx-2" />
                                        </div>
                                        <div className="space-y-2 max-h-[30vh] lg:max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar focus-visible:outline-none">
                                            {chapters.map((ch, i) => (
                                                <button
                                                    key={ch.id}
                                                    onClick={() => setActiveChapter(i)}
                                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left group ${i === activeChapter
                                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-[1.02]'
                                                        : 'hover:bg-emerald-50 text-slate-600'
                                                        }`}
                                                >
                                                    <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${i === activeChapter ? 'bg-white/20' : 'bg-slate-100'}`}>
                                                        {i + 1}
                                                    </span>
                                                    <span className="flex-1 font-bold truncate">{ch.title}</span>
                                                </button>
                                            ))}
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={addChapter}
                                                    className="flex-1 rounded-2xl border-dashed border-2 h-14 text-slate-400 hover:text-emerald-600 hover:border-emerald-200"
                                                >
                                                    <Plus size={18} className="mr-2" /> 새 챕터
                                                </Button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handlePhotoUpload}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                                <Button
                                                    variant="outline"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploading}
                                                    className="flex-1 rounded-2xl border-dashed border-2 h-14 text-slate-400 hover:text-emerald-600 hover:border-emerald-200"
                                                >
                                                    {isUploading ? <Loader2 size={18} className="animate-spin" /> : <><ImageIcon size={18} className="mr-2" /> 사진 첨부</>}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="bg-emerald-900 text-white rounded-[2.5rem] p-6 lg:p-8 shadow-2xl shadow-emerald-900/20 relative overflow-hidden border border-emerald-800/50">
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <Sparkles size={80} />
                                            </div>
                                            <h3 className="font-bold text-xl mb-4 flex items-center gap-2 relative z-10">
                                                <Sparkles size={20} className="text-emerald-300" />
                                                에코에게 부탁하기
                                            </h3>
                                            <p className="text-emerald-100/80 text-sm mb-4 lg:mb-6 leading-relaxed break-keep relative z-10 font-medium">
                                                선택한 문장을 더 아름답게 다듬거나 감칠맛 나게 바꿉니다.
                                            </p>
                                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-3 relative z-10">
                                                {[
                                                    { key: 'detail', label: '더 자세하게 들려줘', icon: '🔍' },
                                                    { key: 'literary', label: '멋진 문장으로 바꿔줘', icon: '📖' },
                                                    { key: 'warm', label: '더 따뜻하게 다듬어줘', icon: '🌸' },
                                                    { key: 'concise', label: '깔끔하게 줄여줘', icon: '✂️' },
                                                ].map(opt => (
                                                    <Button
                                                        key={opt.key}
                                                        variant="ghost"
                                                        disabled={isRewriting}
                                                        onClick={() => rewriteSection(opt.key)}
                                                        className="w-full justify-start bg-white/10 hover:bg-white/20 text-white rounded-2xl h-14 px-5 font-bold border border-white/5 transition-all hover:scale-[1.02] shadow-sm break-keep"
                                                    >
                                                        {isRewriting && rewriteMode === opt.key
                                                            ? <Loader2 className="animate-spin mr-3 h-5 w-5 text-emerald-300" />
                                                            : <span className="mr-3 text-xl opacity-90">{opt.icon}</span>
                                                        }
                                                        <span className="text-sm lg:text-base tracking-tight">{opt.label}</span>
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.aside>
                            )}
                        </AnimatePresence>

                        <section className={`${isFocusMode ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeChapter}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 md:p-16 min-h-[50vh] md:min-h-[80vh] flex flex-col relative"
                                    style={{
                                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.02) 1px, transparent 0)',
                                        backgroundSize: '40px 40px'
                                    }}
                                >
                                    <div className="flex flex-col items-center text-center gap-6 mb-16 pb-16 border-b border-slate-100 relative">
                                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent rounded-t-[3rem] pointer-events-none" />
                                        <div className="relative z-10 flex flex-col items-center w-full mt-8">
                                            <span className="text-emerald-600 font-serif font-bold tracking-[0.3em] uppercase mb-4 text-sm">
                                                Chapter {activeChapter + 1}
                                            </span>
                                            <input
                                                value={chapters[activeChapter]?.title || ''}
                                                onChange={(e) => updateChapter(activeChapter, 'title', e.target.value)}
                                                className="text-2xl md:text-4xl font-serif font-bold text-slate-800 border-none outline-none bg-transparent w-full text-center placeholder:text-slate-200 mb-8"
                                                placeholder="챕터 제목을 적어주세요"
                                            />
                                            <div className="w-12 h-1 bg-emerald-200 rounded-full mb-8" />

                                            <div className="flex flex-wrap md:flex-nowrap justify-center gap-2 md:gap-3 mt-4 w-full">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => isSpeaking ? stop() : speak(chapters[activeChapter]?.content)}
                                                    className={`rounded-full h-10 md:h-12 px-4 md:px-6 font-bold flex items-center gap-2 border-emerald-100 bg-white shadow-sm text-xs md:text-sm ${isSpeaking ? 'text-emerald-600 border-emerald-300' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                >
                                                    {isSpeaking ? <Loader2 className="animate-spin h-4 w-4 md:h-5 md:w-5" /> : <Volume2 className="h-4 w-4 md:h-5 md:w-5" />}
                                                    <span className="hidden sm:inline">{isSpeaking ? "읽는 중..." : "크게 읽기"}</span>
                                                    <span className="sm:hidden">{isSpeaking ? "중지" : "읽기"}</span>
                                                </Button>

                                                <div className="flex items-center gap-1 border-l border-r border-slate-100 px-2 md:px-3 mx-1">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={undo}
                                                        disabled={historyIndex <= 0}
                                                        className="rounded-full h-8 w-8 md:h-10 md:w-10 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30"
                                                        title="되돌리기"
                                                    >
                                                        <Undo2 className="h-4 w-4 md:h-5 md:w-5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={redo}
                                                        disabled={historyIndex >= history.length - 1}
                                                        className="rounded-full h-8 w-8 md:h-10 md:w-10 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30"
                                                        title="다시 실행"
                                                    >
                                                        <Redo2 className="h-4 w-4 md:h-5 md:w-5" />
                                                    </Button>
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    onClick={() => saveDraft(false)}
                                                    className={`rounded-full h-10 md:h-12 px-4 md:px-6 font-bold border-emerald-100 shadow-sm transition-all text-xs md:text-sm ${isAutoSaving ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                >
                                                    {isAutoSaving ? (
                                                        <>
                                                            <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2 text-emerald-500" />
                                                            저장됨
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                                                            저장
                                                        </>
                                                    )}
                                                </Button>
                                                <Button variant="outline" className="text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 rounded-full h-10 w-10 md:h-12 md:w-12 p-0 border-emerald-100 bg-white shadow-sm" onClick={() => deleteChapter(activeChapter)}>
                                                    <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 relative group">
                                        <Textarea
                                            value={chapters[activeChapter]?.content || ''}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateChapter(activeChapter, 'content', e.target.value)}
                                            onSelect={(e: React.SyntheticEvent<HTMLTextAreaElement>) => {
                                                const target = e.target as HTMLTextAreaElement;
                                                const sel = target.value.substring(target.selectionStart, target.selectionEnd);
                                                setSelectedText(sel);
                                            }}
                                            placeholder="여기에 당신의 소중한 기억을 들려주세요..."
                                            className="w-full font-serif leading-[1.8] border-none focus-visible:ring-0 resize-none bg-transparent min-h-[60vh] placeholder:text-slate-300 transition-all scrollbar-hide text-slate-700"
                                            style={{ fontSize: `${fontSize}px` }}
                                        />

                                        <div className="absolute top-0 right-0 p-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-2 shadow-xl flex flex-col gap-1 items-center">
                                                <button onClick={() => setFontSize(fontSize + 2)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold" title="글씨 크게">가+</button>
                                                <div className="h-px w-6 bg-slate-100" />
                                                <button onClick={() => setFontSize(fontSize - 2)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold" title="글씨 작게">가-</button>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedText && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="fixed md:absolute bottom-4 md:bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-4 md:px-8 py-2 md:py-5 rounded-full md:rounded-[2rem] shadow-2xl flex items-center gap-3 md:gap-6 z-50 border border-white/10 w-[95%] md:w-auto overflow-hidden pointer-events-auto"
                                        >
                                            <div className="flex items-center gap-2 md:gap-3 pr-3 md:pr-6 border-r border-white/10 shrink-0">
                                                <Sparkles size={16} className="text-emerald-400" />
                                                <span className="text-xs md:text-base font-bold truncate max-w-[80px] md:max-w-[200px]">AI 다듬기</span>
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={() => rewriteSection('literary')} className="text-sm font-bold hover:text-emerald-400 transition-colors break-keep">멋지게</button>
                                                <button onClick={() => rewriteSection('detail')} className="text-sm font-bold hover:text-emerald-400 transition-colors break-keep">자세히</button>
                                                <button onClick={() => rewriteSection('warm')} className="text-sm font-bold hover:text-emerald-400 transition-colors break-keep">따뜻하게</button>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="mt-8 flex flex-col sm:flex-row justify-between items-center text-slate-300 font-serif text-xs md:text-sm gap-4">
                                        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                                            <span>공백 포함 {(chapters[activeChapter]?.content?.length || 0).toLocaleString()}자</span>
                                            <span className="hidden md:inline">200자 원고지 약 {Math.ceil((chapters[activeChapter]?.content?.length || 0) / 200)}매 | A4 약 {Math.round((chapters[activeChapter]?.content?.length || 0) / 1600 * 10) / 10}매</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            에코가 기록 중입니다
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function EditorPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen bg-[#faf9f6] flex items-center justify-center font-serif text-slate-400">로딩 중...</div>}>
            <EditorContent />
        </React.Suspense>
    );
}
