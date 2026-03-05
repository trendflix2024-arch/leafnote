"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, MoreHorizontal, FileText, Edit3, Trash2, UserCircle, Settings, LogOut, Check, Palette, Type, Image, RotateCcw, RefreshCw, Sparkles, Loader2, MessageCircle, TreePine, Crown, Sprout, Leaf, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useBookStore, Project } from '@/lib/store';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function DynamicGreeting({ activeProjects }: { activeProjects: Project[] }) {
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();
    const { userProfile } = useBookStore();

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    const hasStories = activeProjects.length > 0;
    // Mock data for "latest story keyword"
    const latestKeyword = hasStories ? (stripNamePrefix(activeProjects[0].title).split(' ')[0] || '최근') : '';

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mt-12 mb-8 max-w-2xl"
                >
                    <div className="flex items-start gap-4">
                        {/* Echo Avatar */}
                        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-100 mt-1">
                            <Sprout size={24} className="text-white" />
                        </div>

                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2 ml-1">
                                <Sparkles size={14} className="text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-tight">따뜻한 기록가 에코</span>
                            </div>

                            {/* Speech Bubble */}
                            <div className="bg-emerald-50 border border-emerald-100/50 p-5 rounded-3xl rounded-tl-none shadow-sm relative group">
                                <p className="text-base sm:text-lg text-slate-800 font-serif leading-relaxed break-keep">
                                    {hasStories ? (
                                        <>
                                            작가님 오셨군요! 지난번에 들려주신 <span className="text-emerald-700 font-bold">'{latestKeyword}'</span> 이야기가 참 따뜻했어요. 오늘은 어떤 이야기를 나눠볼까요?
                                        </>
                                    ) : (
                                        <>
                                            {userProfile?.name || '작가'}님, 오늘 하루 어떻게 시작하셨나요? 제가 재미삼아 작가님의 오늘의 운세를 살짝 알아봐 드릴까요?
                                        </>
                                    )}
                                </p>
                            </div>

                            {/* Action Chips */}
                            <div className="flex flex-wrap gap-2 ml-1">
                                {!hasStories ? (
                                    <>
                                        <button
                                            onClick={() => router.push('/chat?mode=fortune')}
                                            className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full hover:bg-emerald-50 transition-all shadow-sm active:scale-95"
                                        >
                                            🔮 오늘의 운세 보기
                                        </button>
                                        <button
                                            onClick={() => router.push('/chat')}
                                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-full hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                        >
                                            ☕ 그냥 수다 떨기
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => {
                                                const { switchProject } = useBookStore.getState();
                                                switchProject(activeProjects[0].id);
                                                router.push('/interview');
                                            }}
                                            className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full hover:bg-emerald-50 transition-all shadow-sm active:scale-95"
                                        >
                                            🌳 이어서 기록하기
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// "OOO님의 제목" 형식의 레거시 제목에서 이름 접두어 제거
function stripNamePrefix(title: string): string {
    return title.replace(/^.+님의\s+/, '');
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { projects, currentProjectId, createProject, switchProject, deleteProject, userProfile, setUserProfile, fetchProjects, resetAll, resetDraft } = useBookStore();
    const [showMenu, setShowMenu] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null);
    const [editTitleValue, setEditTitleValue] = useState('');
    const [isChangingTheme, setIsChangingTheme] = useState<string | null>(null);
    const [isSelectingTone, setIsSelectingTone] = useState<string | null>(null);
    const [selectedTone, setSelectedTone] = useState('서정적인');
    const [showCompost, setShowCompost] = useState(false);

    // Author name prompt for first-time Google login users
    const [showNamePrompt, setShowNamePrompt] = useState(false);
    const [authorName, setAuthorName] = useState('');
    const { updateUserProfile } = useBookStore();

    useEffect(() => {
        if (!session || !(session.user as any)?.isNewUser) return;
        const userId = (session.user as any).id as string || '';
        const alreadySet = localStorage.getItem(`leafnote-name-set-${userId}`);
        if (alreadySet) return;

        // 이미 이름이 설정되어 있으면 모달 불필요 — localStorage만 채워두고 종료
        const existingName = userProfile?.name || session.user?.name || '';
        if (existingName && existingName !== '작가님') {
            localStorage.setItem(`leafnote-name-set-${userId}`, 'true');
            return;
        }

        setShowNamePrompt(true);
        setAuthorName('');
    }, [session, userProfile]);

    const handleNameSubmit = async () => {
        const finalName = authorName.trim() || '작가님';
        const userId = (session?.user as any)?.id || '';
        setUserProfile({
            ...(userProfile || { id: '', email: '', name: '' }),
            name: finalName,
        });
        await updateUserProfile({ name: finalName });
        localStorage.setItem(`leafnote-name-set-${userId}`, 'true');
        setShowNamePrompt(false);
    };

    // AI Subject Suggestions
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Session syncing is now handled globally in Providers.tsx

    // Handler functions below hooks but before early returns
    const formatDate = (timestamp: number) => {
        try {
            return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp);
        } catch (e) {
            return '최근';
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        const id = await createProject(newTitle.trim());
        router.push(`/interview?id=${id}`);
        setIsCreating(false);
        setNewTitle('');
        setSuggestedTopics([]);
    };

    const handleSuggestTopics = async () => {
        setIsSuggesting(true);
        setSuggestedTopics([]); // Clear existing to show loading state clearly
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

    // Auto-suggest when opening creation card
    useEffect(() => {
        if (isCreating && suggestedTopics.length === 0) {
            handleSuggestTopics();
        }
    }, [isCreating, suggestedTopics.length]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
                <div className="animate-pulse text-slate-400 font-serif">로드 중...</div>
            </div>
        );
    }

    if (!session) return null;


    const handleProjectClick = (id: string) => {
        if (isEditingTitle === id || isChangingTheme === id) return;
        switchProject(id);
        router.push('/interview');
    };

    const activeProjects = projects.filter(p => !p.isDeleted);
    const deletedProjects = projects.filter(p => p.isDeleted);

    const calculateWords = (project: Project) => {
        const interviewWords = project.interviewData.reduce((sum, step) => sum + (step.answer?.length || 0), 0);
        return Math.max(interviewWords, project.fullDraft?.length || 0);
    };

    const totalWords = activeProjects.reduce((acc: number, p: Project) => acc + calculateWords(p), 0);
    const totalChapters = activeProjects.reduce((acc: number, p: Project) => acc + (p.fullDraft ? (p.fullDraft.split('---').length - 1) : 0), 0);

    const calculateProgress = (project: Project) => {
        const turns = project.interviewData.length;
        const chars = project.interviewData.reduce((sum, step) => sum + (step.answer?.length || 0), 0);
        // Requirement for 100%: ~40 turns OR ~4000 characters
        return Math.min(Math.round(turns * 1.5 + chars / 50), 100);
    };

    const handleLogout = async () => {
        resetAll();
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <div className="min-h-screen bg-[#faf9f6]">
            {/* Author Name Prompt Modal for First-Time Google Users */}
            <AnimatePresence>
                {showNamePrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-gradient-to-br from-emerald-50 via-amber-50 to-white flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.85, opacity: 0, y: 30 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                            className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-md w-full p-8 text-center"
                        >
                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <Leaf className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">
                                환영합니다! 🎉
                            </h2>
                            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                                리프노트에서 사용하실<br />
                                <span className="font-semibold text-emerald-700">작가명(필명)</span>을 정해주세요.
                            </p>
                            <input
                                type="text"
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                                placeholder="예: 김잎새, 순풍작가, 별빛엄마"
                                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-center text-lg font-serif placeholder:text-slate-300 transition-all"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                            />
                            <button
                                onClick={handleNameSubmit}
                                className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300 active:scale-[0.98]"
                            >
                                이 이름으로 시작하기 ✨
                            </button>
                            <p className="text-xs text-slate-400 mt-3">
                                나중에 프로필 설정에서 변경할 수 있어요.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Top Bar - Mobile Optimized */}
            <header className="bg-white border-b sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-4 flex justify-between items-center">
                    <Logo size="sm" href="/" />

                    {/* Desktop Navigation - hidden on mobile */}
                    <nav className="hidden md:flex items-center gap-6 ml-8">
                        <Link href="/dashboard" className="text-sm font-bold text-emerald-600 border-b-2 border-emerald-600 pb-1">나의 숲</Link>
                        <Link href="/chat" className="text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-1">
                            <MessageCircle size={16} /> 에코와 대화
                        </Link>
                        <Link href="/community" className="text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-1">
                            <Users size={16} /> 이야기 숲
                        </Link>
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Premium button: icon-only on mobile, full on desktop */}
                        <Button variant="outline" size="sm" onClick={() => router.push('/payment')} className="hidden sm:inline-flex">
                            프리미엄 업그레이드
                        </Button>
                        <button onClick={() => router.push('/payment')} className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
                            <Crown size={16} />
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(showMenu === 'user' ? null : 'user')}
                                className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm overflow-hidden border border-slate-200"
                            >
                                {session.user?.image ? (
                                    <img src={session.user.image} alt="P" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{(userProfile?.name || session.user?.name || 'A')[0]}</span>
                                )}
                            </button>
                            {showMenu === 'user' && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border py-2 z-30">
                                    <div className="px-4 py-2 border-b mb-1">
                                        <p className="text-xs text-slate-400">내 계정</p>
                                        <p className="text-sm font-bold text-slate-800 truncate">{userProfile?.name || session.user?.name || session.user?.email}</p>
                                    </div>
                                    <button onClick={() => router.push('/profile')} className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2"><UserCircle size={16} /> 프로필</button>
                                    <button onClick={() => router.push('/settings')} className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2"><Settings size={16} /> 설정</button>
                                    <hr className="my-1" />
                                    <button className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2 text-red-500"
                                        onClick={handleLogout}
                                    ><LogOut size={16} /> 로그아웃</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 md:pb-8">
                {/* Welcome */}
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-3xl font-serif font-bold text-slate-900 mb-1 sm:mb-2 leading-tight break-keep">
                        안녕하세요, <span className="text-emerald-700">{(userProfile?.name || session.user?.name || '기록가').split(' ')[0]}</span> 작가님 <span className="inline-block animate-bounce-subtle">👋</span>
                    </h2>
                    <p className="text-sm sm:text-lg text-slate-500 font-medium">당신의 소중한 이야기를 한 권의 잎으로 기록해 보세요.</p>
                </div>

                {/* Stats - Reformatted for Seniors (3 Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
                    {[
                        { label: '기록된 잎사귀 (작성한 이야기)', value: totalWords.toLocaleString(), icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50' },
                        { label: '자라나는 나무 (진행 중인 이야기)', value: activeProjects.length.toString(), icon: TreePine, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
                        { label: '완성된 숲 (출판된 책)', value: '0', icon: Crown, color: 'text-purple-600', bgColor: 'bg-purple-50' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[1.5rem] p-6 sm:p-8 shadow-sm border border-slate-100/80 hover:shadow-md transition-all group flex items-center gap-6"
                        >
                            <div className={`${stat.bgColor} w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon size={28} className={`${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{stat.value}<span className="text-sm ml-1 text-slate-400 font-normal">{stat.label.includes('잎사귀') ? '자' : stat.label.includes('나무') ? '그루' : '권'}</span></p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Projects Header */}
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 font-serif">나의 숲 <span className="text-emerald-600 ml-1 text-sm sm:text-base">My Forest</span></h3>
                    {!isCreating && (
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-3 sm:px-4 text-white shadow-lg shadow-emerald-100 text-xs sm:text-sm h-8 sm:h-9"
                            onClick={() => setIsCreating(true)}
                        >
                            <Plus size={14} className="mr-0.5 sm:mr-1" /> 새 씨앗 심기
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Project Creation Overlay/Card */}
                    {isCreating && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-3 bg-white rounded-2xl sm:rounded-3xl shadow-xl border-2 border-emerald-400 p-4 sm:p-8 flex flex-col relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                            <div className="flex justify-between items-start mb-6 relative z-10 border-b border-emerald-50 pb-5">
                                <div className="pr-8">
                                    <h4 className="text-lg sm:text-2xl font-bold text-slate-900 font-serif break-keep leading-tight">새로운 씨앗 품기</h4>
                                    <p className="text-xs sm:text-base text-slate-500 mt-1.5 break-keep">에코와 함께 당신의 소중한 이야기를 시작해 보세요.</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsCreating(false)}
                                    className="rounded-full w-8 h-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                >
                                    <LogOut size={16} className="rotate-90" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 relative z-10">
                                {/* Left Side: AI Suggestions */}
                                <div className="lg:col-span-3 space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles size={14} /> 에코의 추천 제안
                                        </h5>
                                        <button
                                            onClick={handleSuggestTopics}
                                            disabled={isSuggesting}
                                            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4 disabled:opacity-50"
                                        >
                                            {isSuggesting ? '추천 중...' : '한번 더'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[140px]">
                                        {isSuggesting ? (
                                            <div className="col-span-full flex flex-col items-center justify-center p-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                <Loader2 className="animate-spin text-emerald-500 mb-3" size={24} />
                                                <span className="text-sm text-slate-500 font-serif">에코가 영감을 찾고 있습니다...</span>
                                            </div>
                                        ) : suggestedTopics.length > 0 ? (
                                            suggestedTopics.map((topic, i) => (
                                                <motion.button
                                                    key={i}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    onClick={() => setNewTitle(topic)}
                                                    className="text-sm px-5 py-4 bg-amber-50/40 text-amber-900 border border-amber-200/30 rounded-2xl hover:bg-amber-50 hover:border-amber-400 transition-all text-left font-serif shadow-sm hover:shadow-md active:scale-95 flex items-start gap-3 group break-keep"
                                                >
                                                    <span className="text-amber-500 font-bold group-hover:rotate-12 transition-transform">#</span>
                                                    <span className="flex-1 leading-snug">{topic}</span>
                                                </motion.button>
                                            ))
                                        ) : (
                                            <div className="col-span-full flex items-center justify-center p-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-sm text-slate-500 font-serif">위에 버튼을 눌러 에코에게 영감을 받아보세요.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Input and Action */}
                                <div className="lg:col-span-2 flex flex-col justify-center">
                                    <form onSubmit={handleCreate} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 ml-1">나의 씨앗 이름</label>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={newTitle}
                                                onChange={(e) => setNewTitle(e.target.value)}
                                                placeholder="직접 입력하거나 제안을 선택하세요"
                                                className="w-full p-4 bg-emerald-50/30 border-2 border-emerald-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-400/10 focus:border-emerald-400 transition-all font-serif text-lg text-slate-800 placeholder:text-slate-300 shadow-inner"
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={!newTitle.trim()}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-2xl shadow-xl shadow-emerald-200 text-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                                        >
                                            이야기 숲 가꾸기 시작
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeProjects.map((project, i) => {
                        const progress = calculateProgress(project);
                        const isComplete = progress >= 100;

                        return (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`rounded-2xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer group relative flex flex-col ${currentProjectId === project.id
                                    ? 'border-emerald-400 ring-2 ring-emerald-50'
                                    : isComplete
                                        ? 'border-emerald-300 shadow-emerald-900/5 bg-gradient-to-br from-emerald-50/50 to-white'
                                        : 'border-slate-100 bg-white'
                                    }`}
                                onClick={() => handleProjectClick(project.id)}
                            >
                                {/* Theme Color Indicator */}
                                <div className={`h-2 rounded-t-2xl overflow-hidden bg-gradient-to-r ${project.coverDesign?.theme === 'rose' ? 'from-rose-400 to-pink-600' :
                                    project.coverDesign?.theme === 'blue' ? 'from-blue-600 to-indigo-800' :
                                        project.coverDesign?.theme === 'emerald' ? 'from-emerald-500 to-teal-700' :
                                            'from-amber-400 to-orange-500'
                                    }`}></div>

                                <div className="p-3.5 sm:p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 mr-2 overflow-hidden">
                                            {isEditingTitle === project.id ? (
                                                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        type="text"
                                                        value={editTitleValue}
                                                        onChange={e => setEditTitleValue(e.target.value)}
                                                        className="w-full text-sm font-bold border-b-2 border-emerald-400 outline-none"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const { updateProjectTitle } = useBookStore.getState();
                                                            switchProject(project.id);
                                                            updateProjectTitle(editTitleValue);
                                                            setIsEditingTitle(null);
                                                        }}
                                                        className="p-1 bg-emerald-50 rounded text-emerald-600"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <h4 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors truncate font-serif text-base sm:text-lg">{stripNamePrefix(project.title)}</h4>
                                                    <p className="text-xs text-slate-400">{formatDate(project.updatedAt)} 수정</p>
                                                </>
                                            )}
                                        </div>
                                        {!isSelectingTone && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowMenu(showMenu === project.id ? null : project.id); }}
                                                className="p-1 hover:bg-slate-100 rounded-lg shrink-0"
                                            >
                                                <MoreHorizontal size={18} className="text-slate-400" />
                                            </button>
                                        )}
                                    </div>

                                    {isSelectingTone === project.id ? (
                                        <div className="flex-1 flex flex-col justify-center animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                                            <h5 className="font-bold text-slate-700 mb-3 text-center text-sm">어떤 문체로 다시 쓸까요?</h5>
                                            <div className="grid grid-cols-2 gap-2 mb-4">
                                                {['담백한', '서정적인', '유머러스한', '전문적인'].map(tone => (
                                                    <button
                                                        key={tone}
                                                        onClick={() => setSelectedTone(tone)}
                                                        className={`text-xs py-2 px-1 rounded-lg border font-bold transition-all ${selectedTone === tone ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                                    >
                                                        {tone}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex gap-2 mt-auto">
                                                <Button
                                                    onClick={() => {
                                                        const { resetDraft } = useBookStore.getState();
                                                        resetDraft(project.id, selectedTone);
                                                        setIsSelectingTone(null);
                                                        router.push(`/editor?tone=${encodeURIComponent(selectedTone)}`);
                                                    }}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
                                                >
                                                    적용 및 재작성
                                                </Button>
                                                <Button variant="ghost" className="text-xs h-9" onClick={() => setIsSelectingTone(null)}>취소</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {showMenu === project.id && (
                                                <div className="absolute right-4 top-14 w-44 bg-white rounded-xl shadow-xl border py-2 z-10" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => {
                                                            setIsEditingTitle(project.id);
                                                            setEditTitleValue(project.title);
                                                            setShowMenu(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        <Type size={14} className="text-slate-400" /> 이름 바꾸기
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            switchProject(project.id);
                                                            router.push('/design');
                                                            setShowMenu(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        <Image size={14} className="text-slate-400" /> 표지 틔우기
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setIsChangingTheme(isChangingTheme === project.id ? null : project.id);
                                                            // setShowMenu remains open or we close it
                                                        }}
                                                        className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 flex items-center gap-2"
                                                    >
                                                        <Palette size={14} className="text-slate-400" /> 분위기 바꾸기
                                                    </button>

                                                    {isChangingTheme === project.id && (
                                                        <div className="px-4 py-2 flex gap-2 justify-center border-t mt-1">
                                                            {['emerald', 'amber', 'rose', 'blue'].map(th => (
                                                                <button
                                                                    key={th}
                                                                    onClick={() => {
                                                                        const { setCoverDesign } = useBookStore.getState();
                                                                        switchProject(project.id);
                                                                        setCoverDesign({ theme: th });
                                                                        setIsChangingTheme(null);
                                                                        setShowMenu(null);
                                                                    }}
                                                                    className={`w-4 h-4 rounded-full border ${th === 'emerald' ? 'bg-emerald-500' :
                                                                        th === 'amber' ? 'bg-amber-500' :
                                                                            th === 'rose' ? 'bg-rose-500' : 'bg-blue-500'
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}

                                                    <hr className="my-1" />
                                                    <button
                                                        onClick={() => {
                                                            setIsSelectingTone(project.id);
                                                            setShowMenu(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-sm text-left text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                                    >
                                                        <RefreshCw size={14} /> 원고 새로 쓰기
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            deleteProject(project.id);
                                                            setShowMenu(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-sm text-left text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={14} /> 거름더미로 보내기
                                                    </button>
                                                </div>
                                            )}

                                            <div className="mt-4 space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${isComplete ? 'text-emerald-700' : 'text-slate-400'}`}>성장률</span>
                                                    <span className={`text-sm font-bold tracking-tight ${isComplete ? 'text-emerald-700' : 'text-slate-900'}`}>{progress}%</span>
                                                </div>
                                                <div className={`h-2 w-full rounded-full overflow-hidden ${isComplete ? 'bg-emerald-200/50' : 'bg-slate-100'}`}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className={`h-full rounded-full shadow-sm ${isComplete ? 'premium-gradient' : 'bg-emerald-500'}`}
                                                    />
                                                </div>
                                            </div>

                                            {isComplete ? (
                                                <div className="mt-6 flex-1 flex flex-col justify-end">
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            switchProject(project.id);
                                                            router.push('/editor');
                                                        }}
                                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-5 shadow-md hover:shadow-lg transition-all"
                                                    >
                                                        ✨ 자라난 나무(원고) 다듬기
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-center mt-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide">잎사귀</span>
                                                            <span className="text-sm sm:text-base font-bold text-slate-800">{calculateWords(project).toLocaleString()}자</span>
                                                        </div>
                                                        <div className="w-[1px] h-8 bg-slate-100/80"></div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide">대화</span>
                                                            <span className="text-sm sm:text-base font-bold text-slate-800">{project.interviewData.length}회</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-[360deg] transition-all duration-500 shadow-sm">
                                                        <Edit3 size={18} className="transition-colors" />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Empty State: Dainty Invitation Card */}
                    {!isCreating && activeProjects.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="lg:col-span-3 bg-[#FDFBF7] rounded-[2.5rem] p-12 sm:p-20 border border-emerald-100/50 text-center shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20"></div>
                            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-lg shadow-emerald-50 text-emerald-600">
                                <Plus size={44} />
                            </div>
                            <h4 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800 mb-6 break-keep leading-tight">
                                아직 심어진 이야기 씨앗이 없네요.
                            </h4>
                            <p className="text-base sm:text-xl text-slate-500 mb-12 break-keep font-medium">
                                에코가 작가님의 첫 이야기를 기다리고 있어요.
                            </p>
                            <Button
                                onClick={() => setIsCreating(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-20 px-12 rounded-2xl shadow-xl shadow-emerald-100 text-xl transition-all active:scale-95 border-none"
                            >
                                에코와 첫 대화 나누기
                            </Button>
                        </motion.div>
                    )}
                </div>

                {/* Compost ( 거름더미 ) */}
                {deletedProjects.length > 0 && (
                    <div className="mt-20 border-t pt-10">
                        <button
                            onClick={() => setShowCompost(!showCompost)}
                            className="flex items-center gap-2 text-slate-400 hover:text-orange-600 transition-colors mb-6 group"
                        >
                            <RotateCcw size={18} className={`${showCompost ? 'rotate-180' : ''} transition-transform`} />
                            <span className="text-sm font-bold font-serif">거름더미 확인하기 ({deletedProjects.length})</span>
                        </button>

                        {showCompost && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {deletedProjects.map((project) => (
                                    <div key={project.id} className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col justify-between opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                                        <div>
                                            <h4 className="font-bold text-slate-600 font-serif mb-1">{stripNamePrefix(project.title)}</h4>
                                            <p className="text-[10px] text-slate-400">떨어진 잎사귀: {(project.fullDraft?.length || 0).toLocaleString()}자</p>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => {
                                                    const { restoreProject } = useBookStore.getState();
                                                    restoreProject(project.id);
                                                }}
                                                className="flex-1 py-2 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                            >
                                                다시 심기
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('정말로 이 씨앗을 버리시겠습니까? 영구적으로 삭제됩니다.')) {
                                                        const { permanentlyDeleteProject } = useBookStore.getState();
                                                        permanentlyDeleteProject(project.id);
                                                    }
                                                }}
                                                className="px-3 py-2 text-xs font-bold bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {/* Dynamic Greeting (Echo) */}
                <DynamicGreeting activeProjects={activeProjects} />
            </main>

            {/* Mobile Bottom Navigation - Improved Visibility */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 z-50 h-16 safe-area-pb shadow-[-0px_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-around h-14">
                    <Link href="/dashboard" className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-emerald-600">
                        <TreePine size={20} />
                        <span className="text-[10px] font-bold">나의 숲</span>
                    </Link>
                    <Link href="/chat" className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-slate-400 hover:text-emerald-600 transition-colors">
                        <MessageCircle size={20} />
                        <span className="text-[10px] font-bold">에코와 대화</span>
                    </Link>
                    <Link href="/community" className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-slate-400 hover:text-emerald-600 transition-colors">
                        <Users size={20} />
                        <span className="text-[10px] font-bold">이야기 숲</span>
                    </Link>
                    <button onClick={() => router.push('/profile')} className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-slate-400 hover:text-emerald-600 transition-colors">
                        <UserCircle size={20} />
                        <span className="text-[10px] font-bold">프로필</span>
                    </button>
                    <button onClick={() => router.push('/settings')} className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-slate-400 hover:text-emerald-600 transition-colors">
                        <Settings size={20} />
                        <span className="text-[10px] font-bold">설정</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
