"use client";

import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useBookStore, useCurrentProject, InteriorLayout, DEFAULT_INTERIOR } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, ArrowRight, ArrowLeft, Save, GripVertical, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, Sparkles, Volume2, Undo2, Redo2, CheckCircle2, Image as ImageIcon, BookOpen, Eye, PenLine, Type, ChevronLeft, ChevronRight, Search, X, MessageCircle, Send } from 'lucide-react';
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

const BOOK_FORMATS = [
    { key: 'b6', label: '4×6판(B6)', w: 128, h: 188, desc: '시, 에세이', charsPerPage: 600 },
    { key: 'irregular', label: '다짜판', w: 128, h: 210, desc: '시', charsPerPage: 650 },
    { key: 'a5', label: '국판(A5)', w: 148, h: 210, desc: '소설, 시, 수필', charsPerPage: 800 },
    { key: 'a5v', label: '국판변형', w: 136, h: 200, desc: '소설, 시, 수필', charsPerPage: 700 },
    { key: 'shinkook', label: '신국판', w: 152, h: 224, desc: '경제·경영, 전문서적', charsPerPage: 900 },
    { key: 'shinkookv', label: '신국판변형', w: 152, h: 205, desc: '경제·경영, 전문서적', charsPerPage: 800 },
    { key: 'crown', label: '크라운판', w: 170, h: 245, desc: '교재, 실용서', charsPerPage: 1100 },
    { key: 'b5', label: '4×6배판(B5)', w: 182, h: 257, desc: '교재, 실용서', charsPerPage: 1300 },
    { key: 'a4', label: '국배판(A4)', w: 210, h: 297, desc: '교재, 실용서', charsPerPage: 1600 },
];

const LAYOUT_FONTS = [
    { label: '나눔명조', value: 'Nanum Myeongjo' },
    { label: '고운바탕', value: 'Gowun Batang' },
    { label: 'Noto Serif KR', value: 'Noto Serif KR' },
    { label: '함렛', value: 'Hahmlet' },
    { label: 'Noto Sans KR', value: 'Noto Sans KR' },
    { label: '나눔고딕', value: 'Nanum Gothic' },
];

const TOPIC_PRESETS: Record<string, InteriorLayout> = {
    '나의 인생 이야기': { font: 'Nanum Myeongjo', fontSize: 11, lineHeight: 175, marginInner: 18, marginOuter: 15, marginTop: 20, marginBottom: 25, chapterStyle: 'classic', letterSpacing: 0, paragraphIndent: 1 },
    '아이와 함께 자라는 시간': { font: 'Gowun Batang', fontSize: 12, lineHeight: 180, marginInner: 20, marginOuter: 18, marginTop: 22, marginBottom: 28, chapterStyle: 'ornate', letterSpacing: 0, paragraphIndent: 1 },
    '아이를 기다리는 시간 (태교)': { font: 'Gowun Batang', fontSize: 12, lineHeight: 180, marginInner: 20, marginOuter: 18, marginTop: 22, marginBottom: 28, chapterStyle: 'ornate', letterSpacing: 0, paragraphIndent: 1 },
    '둘이 함께 쓰는 사랑 이야기': { font: 'Hahmlet', fontSize: 11.5, lineHeight: 180, marginInner: 20, marginOuter: 18, marginTop: 22, marginBottom: 28, chapterStyle: 'ornate', letterSpacing: 5, paragraphIndent: 1 },
    '세상을 만난 여행의 기록': { font: 'Noto Serif KR', fontSize: 11, lineHeight: 165, marginInner: 16, marginOuter: 14, marginTop: 18, marginBottom: 22, chapterStyle: 'minimal', letterSpacing: 0, paragraphIndent: 0 },
    '일과 열정의 자취 (회고록)': { font: 'Noto Sans KR', fontSize: 10.5, lineHeight: 160, marginInner: 15, marginOuter: 13, marginTop: 18, marginBottom: 22, chapterStyle: 'minimal', letterSpacing: 0, paragraphIndent: 0 },
    '가족의 뿌리 깊은 이야기': { font: 'Nanum Myeongjo', fontSize: 11, lineHeight: 170, marginInner: 18, marginOuter: 15, marginTop: 20, marginBottom: 25, chapterStyle: 'classic', letterSpacing: 0, paragraphIndent: 1 },
    '빛나는 취미와 일상': { font: 'Gowun Batang', fontSize: 11.5, lineHeight: 170, marginInner: 17, marginOuter: 15, marginTop: 20, marginBottom: 24, chapterStyle: 'minimal', letterSpacing: 0, paragraphIndent: 0 },
};

const QUICK_PRESETS = [
    { label: '자서전', preset: TOPIC_PRESETS['나의 인생 이야기'] },
    { label: '에세이', preset: { font: 'Gowun Batang', fontSize: 11, lineHeight: 175, marginInner: 17, marginOuter: 15, marginTop: 20, marginBottom: 25, chapterStyle: 'minimal', letterSpacing: 0, paragraphIndent: 1 } as InteriorLayout },
    { label: '여행', preset: TOPIC_PRESETS['세상을 만난 여행의 기록'] },
    { label: '사랑', preset: TOPIC_PRESETS['둘이 함께 쓰는 사랑 이야기'] },
];

const MM_TO_PX = 3.7795;

function BookPagePreview({
    content, title, chapterIndex, bookFormat, il, previewPage, setPreviewPage,
}: {
    content: string;
    title: string;
    chapterIndex: number;
    bookFormat: { w: number; h: number; label: string };
    il: InteriorLayout;
    previewPage: number;
    setPreviewPage: (p: number) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerW, setContainerW] = useState(380);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new ResizeObserver(() => setContainerW(el.offsetWidth || 380));
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const pageW = bookFormat.w * MM_TO_PX;
    const pageH = bookFormat.h * MM_TO_PX;
    const scale = Math.min(containerW / pageW, 1);

    // Content area dimensions
    const contentWpx = (bookFormat.w - il.marginInner - il.marginOuter) * MM_TO_PX;
    const fontPx = il.fontSize * 1.333;
    const lineHPx = fontPx * (il.lineHeight / 100);
    const pageNumH = Math.ceil(fontPx * 0.75) + 16;
    const contentHpx = (bookFormat.h - il.marginTop - il.marginBottom) * MM_TO_PX - pageNumH;
    const charsPerLine = Math.max(10, Math.floor(contentWpx / (fontPx * 0.9)));
    const linesPerPage = Math.max(5, Math.floor((contentHpx - lineHPx) / lineHPx));
    const charsPerPage = charsPerLine * linesPerPage;

    // Paginate content
    const pages: string[] = [];
    if (content) {
        let remaining = content;
        while (remaining.length > 0) {
            pages.push(remaining.slice(0, charsPerPage));
            remaining = remaining.slice(charsPerPage);
        }
    }
    if (pages.length === 0) pages.push('');

    const safePage = Math.min(previewPage, pages.length - 1);

    const chapterTitleStyle: React.CSSProperties =
        il.chapterStyle === 'minimal' ? {
            fontSize: fontPx * 1.3, fontWeight: 700, marginBottom: lineHPx, borderBottom: '1px solid #e2e8f0', paddingBottom: lineHPx * 0.5,
        } : il.chapterStyle === 'ornate' ? {
            fontSize: fontPx * 1.4, fontWeight: 700, textAlign: 'center', marginBottom: lineHPx * 1.5, letterSpacing: '0.05em',
        } : {
            fontSize: fontPx * 1.35, fontWeight: 700, textAlign: 'center', marginBottom: lineHPx,
        };

    return (
        <motion.div
            key={`preview-${chapterIndex}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col items-center"
        >
            {/* Page container */}
            <div ref={containerRef} className="w-full max-w-2xl mx-auto">
                <div
                    style={{ width: containerW, height: Math.round(containerW * pageH / pageW), overflow: 'hidden', position: 'relative' }}
                    className="shadow-2xl shadow-slate-300/60 rounded-sm border border-slate-200"
                >
                    <div style={{
                        width: pageW,
                        height: pageH,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        backgroundColor: 'white',
                        paddingTop: il.marginTop * MM_TO_PX,
                        paddingBottom: il.marginBottom * MM_TO_PX,
                        paddingLeft: il.marginInner * MM_TO_PX,
                        paddingRight: il.marginOuter * MM_TO_PX,
                        fontFamily: `'${il.font}', serif`,
                        fontSize: fontPx,
                        lineHeight: `${il.lineHeight}%`,
                        color: '#1e293b',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        {/* Chapter header (only on first page) */}
                        {safePage === 0 && (
                            <div style={{ marginBottom: lineHPx * (il.chapterStyle === 'ornate' ? 2 : 1.5) }}>
                                {il.chapterStyle === 'classic' && (
                                    <div style={{ textAlign: 'center', marginBottom: lineHPx * 0.5 }}>
                                        <span style={{ fontSize: fontPx * 0.8, fontWeight: 700, letterSpacing: '0.3em', color: '#64748b', textTransform: 'uppercase' }}>
                                            Chapter {chapterIndex + 1}
                                        </span>
                                        <div style={{ width: 32, height: 1, backgroundColor: '#cbd5e1', margin: `${lineHPx * 0.4}px auto` }} />
                                    </div>
                                )}
                                {il.chapterStyle === 'ornate' && (
                                    <div style={{ textAlign: 'center', marginBottom: lineHPx * 0.5, color: '#94a3b8', fontSize: fontPx * 1.5 }}>
                                        ✦
                                    </div>
                                )}
                                <div style={chapterTitleStyle}>{title}</div>
                                {il.chapterStyle === 'classic' && (
                                    <div style={{ width: 48, height: 2, backgroundColor: '#e2e8f0', margin: `0 auto ${lineHPx}px` }} />
                                )}
                            </div>
                        )}
                        {/* Content */}
                        <div style={{
                            flex: 1, overflow: 'hidden', whiteSpace: 'pre-wrap', textAlign: 'justify', wordBreak: 'keep-all',
                            letterSpacing: `${(il.letterSpacing ?? 0) / 100}em`,
                            textIndent: `${il.paragraphIndent ?? 1}em`,
                        }}>
                            {pages[safePage]}
                        </div>
                        {/* Page number */}
                        <div style={{
                            position: 'absolute',
                            bottom: Math.max(8, il.marginBottom * MM_TO_PX * 0.4),
                            left: il.marginInner * MM_TO_PX,
                            right: il.marginOuter * MM_TO_PX,
                            textAlign: 'center',
                            fontSize: fontPx * 0.75,
                            color: '#94a3b8',
                        }}>
                            {safePage + 1}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4 mt-4">
                <button
                    onClick={() => setPreviewPage(Math.max(0, safePage - 1))}
                    disabled={safePage === 0}
                    className="p-2 rounded-full bg-white border border-slate-200 shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>
                <span className="text-sm text-slate-500 font-medium">
                    {safePage + 1} / {pages.length} 쪽
                </span>
                <button
                    onClick={() => setPreviewPage(Math.min(pages.length - 1, safePage + 1))}
                    disabled={safePage >= pages.length - 1}
                    className="p-2 rounded-full bg-white border border-slate-200 shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-colors"
                >
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
            </div>
        </motion.div>
    );
}

function BookFullView({
    chapters, bookFormat, il,
}: {
    chapters: Chapter[];
    bookFormat: { w: number; h: number; label: string };
    il: InteriorLayout;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerW, setContainerW] = useState(380);
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new ResizeObserver(() => setContainerW(el.offsetWidth || 380));
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const pageW = bookFormat.w * MM_TO_PX;
    const pageH = bookFormat.h * MM_TO_PX;
    const scale = Math.min(containerW / pageW, 1);
    const fontPx = il.fontSize * 1.333;
    const lineHPx = fontPx * (il.lineHeight / 100);
    const contentWpx = (bookFormat.w - il.marginInner - il.marginOuter) * MM_TO_PX;
    const pageNumH = Math.ceil(fontPx * 0.75) + 16;
    const contentHpx = (bookFormat.h - il.marginTop - il.marginBottom) * MM_TO_PX - pageNumH;
    const charsPerLine = Math.max(10, Math.floor(contentWpx / (fontPx * 0.9)));
    const linesPerPage = Math.max(5, Math.floor((contentHpx - lineHPx) / lineHPx));
    const charsPerPage = charsPerLine * linesPerPage;

    // Build unified page list across all chapters
    type PageEntry = { chapterIndex: number; text: string; isFirstPage: boolean; globalPage: number };
    const allPages: PageEntry[] = [];
    chapters.forEach((ch, ci) => {
        const content = ch.content || '';
        let remaining = content;
        let isFirst = true;
        if (content.length === 0) {
            allPages.push({ chapterIndex: ci, text: '', isFirstPage: true, globalPage: allPages.length });
        }
        while (remaining.length > 0) {
            allPages.push({ chapterIndex: ci, text: remaining.slice(0, charsPerPage), isFirstPage: isFirst, globalPage: allPages.length });
            remaining = remaining.slice(charsPerPage);
            isFirst = false;
        }
    });
    if (allPages.length === 0) allPages.push({ chapterIndex: 0, text: '', isFirstPage: true, globalPage: 0 });

    const safePage = Math.min(currentPage, allPages.length - 1);
    const entry = allPages[safePage];
    const ch = chapters[entry.chapterIndex];

    const chapterTitleStyle: React.CSSProperties =
        il.chapterStyle === 'minimal' ? {
            fontSize: fontPx * 1.3, fontWeight: 700, marginBottom: lineHPx, borderBottom: '1px solid #e2e8f0', paddingBottom: lineHPx * 0.5,
        } : il.chapterStyle === 'ornate' ? {
            fontSize: fontPx * 1.4, fontWeight: 700, textAlign: 'center', marginBottom: lineHPx * 1.5, letterSpacing: '0.05em',
        } : {
            fontSize: fontPx * 1.35, fontWeight: 700, textAlign: 'center', marginBottom: lineHPx,
        };

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex flex-col items-center">
            <div ref={containerRef} className="w-full max-w-2xl mx-auto">
                <div style={{ width: containerW, height: Math.round(containerW * pageH / pageW), overflow: 'hidden', position: 'relative' }}
                    className="shadow-2xl shadow-slate-300/60 rounded-sm border border-slate-200">
                    <div style={{
                        width: pageW, height: pageH,
                        transform: `scale(${scale})`, transformOrigin: 'top left',
                        backgroundColor: 'white',
                        paddingTop: il.marginTop * MM_TO_PX,
                        paddingBottom: il.marginBottom * MM_TO_PX,
                        paddingLeft: il.marginInner * MM_TO_PX,
                        paddingRight: il.marginOuter * MM_TO_PX,
                        fontFamily: `'${il.font}', serif`,
                        fontSize: fontPx,
                        lineHeight: `${il.lineHeight}%`,
                        color: '#1e293b',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        {entry.isFirstPage && (
                            <div style={{ marginBottom: lineHPx * (il.chapterStyle === 'ornate' ? 2 : 1.5) }}>
                                {il.chapterStyle === 'classic' && (
                                    <div style={{ textAlign: 'center', marginBottom: lineHPx * 0.5 }}>
                                        <span style={{ fontSize: fontPx * 0.8, fontWeight: 700, letterSpacing: '0.3em', color: '#64748b', textTransform: 'uppercase' }}>
                                            Chapter {entry.chapterIndex + 1}
                                        </span>
                                        <div style={{ width: 32, height: 1, backgroundColor: '#cbd5e1', margin: `${lineHPx * 0.4}px auto` }} />
                                    </div>
                                )}
                                {il.chapterStyle === 'ornate' && (
                                    <div style={{ textAlign: 'center', marginBottom: lineHPx * 0.5, color: '#94a3b8', fontSize: fontPx * 1.5 }}>✦</div>
                                )}
                                <div style={chapterTitleStyle}>{ch.title}</div>
                                {il.chapterStyle === 'classic' && (
                                    <div style={{ width: 48, height: 2, backgroundColor: '#e2e8f0', margin: `0 auto ${lineHPx}px` }} />
                                )}
                            </div>
                        )}
                        <div style={{
                            flex: 1, overflow: 'hidden', whiteSpace: 'pre-wrap', textAlign: 'justify', wordBreak: 'keep-all',
                            letterSpacing: `${(il.letterSpacing ?? 0) / 100}em`,
                            textIndent: `${il.paragraphIndent ?? 1}em`,
                        }}>
                            {entry.text}
                        </div>
                        <div style={{
                            position: 'absolute',
                            bottom: Math.max(8, il.marginBottom * MM_TO_PX * 0.4),
                            left: il.marginInner * MM_TO_PX,
                            right: il.marginOuter * MM_TO_PX,
                            textAlign: 'center',
                            fontSize: fontPx * 0.75,
                            color: '#94a3b8',
                        }}>
                            {safePage + 1}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
                <button onClick={() => setCurrentPage(Math.max(0, safePage - 1))} disabled={safePage === 0}
                    className="p-2 rounded-full bg-white border border-slate-200 shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-colors">
                    <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>
                <span className="text-sm text-slate-500 font-medium">{safePage + 1} / {allPages.length} 쪽</span>
                <button onClick={() => setCurrentPage(Math.min(allPages.length - 1, safePage + 1))} disabled={safePage >= allPages.length - 1}
                    className="p-2 rounded-full bg-white border border-slate-200 shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-colors">
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
            </div>
        </motion.div>
    );
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
    const { setFullDraft, setInteriorLayout, setCoverDesign, setTargetWordCount } = useBookStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [activeChapter, setActiveChapter] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isRewriting, setIsRewriting] = useState(false);
    const [rewriteMode, setRewriteMode] = useState<string | null>(null);
    const [selectedText, setSelectedText] = useState('');
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [fontSize, setFontSize] = useState(22); // editing comfort size (not book layout)
    const [bookFormat, setBookFormat] = useState(
        () => (currentProject?.coverDesign?.params as any)?.bookFormat ?? 'shinkook'
    );
    const handleBookFormatChange = (key: string) => {
        setBookFormat(key);
        setCoverDesign({ params: { ...(currentProject?.coverDesign?.params as any || {}), bookFormat: key } });
    };
    const [previewMode, setPreviewMode] = useState<'edit' | 'preview' | 'bookview'>('edit');
    const [previewPage, setPreviewPage] = useState(0);
    const [showLayoutPanel, setShowLayoutPanel] = useState(true);
    const { speak, stop, isSpeaking } = useTTS();

    const il = currentProject?.coverDesign?.interiorLayout || DEFAULT_INTERIOR;

    // History (Undo/Redo) State
    const [history, setHistory] = useState<Chapter[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Auto-Save State
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSavedDraft, setLastSavedDraft] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [rewriteNotice, setRewriteNotice] = useState<string | null>(null);
    const [generateError, setGenerateError] = useState<string | null>(null);

    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    // Find/Replace State
    const [showFindReplace, setShowFindReplace] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [matchCount, setMatchCount] = useState(0);

    // Chapter Interview Modal State
    const [chInterviewOpen, setChInterviewOpen] = useState(false);
    const [chInterviewChapterIndex, setChInterviewChapterIndex] = useState(0);
    const [chInterviewMessages, setChInterviewMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [chInterviewInput, setChInterviewInput] = useState('');
    const [isChInterviewLoading, setIsChInterviewLoading] = useState(false);
    const [isExpandingChapter, setIsExpandingChapter] = useState(false);
    const chInterviewScrollRef = useRef<HTMLDivElement>(null);
    const chInterviewInputRef = useRef<HTMLInputElement>(null);

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

    // Auto-apply topic preset if no interiorLayout set yet
    useEffect(() => {
        if (currentProject && !currentProject.coverDesign?.interiorLayout) {
            const topic = currentProject.coverDesign?.topic || '';
            const preset = TOPIC_PRESETS[topic] || DEFAULT_INTERIOR;
            setInteriorLayout(preset);
        }
    }, [currentProject?.id]);

    // Load Google Font for preview
    useEffect(() => {
        const font = il.font;
        if (!font) return;
        const id = `gfont-${font.replace(/\s+/g, '-')}`;
        if (!document.getElementById(id)) {
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;700&display=swap`;
            document.head.appendChild(link);
        }
    }, [il.font]);

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
        setHistory(prev => {
            const newHistory = [...prev.slice(0, historyIndex + 1), newChapters];
            if (newHistory.length > 50) newHistory.shift();
            setHistoryIndex(newHistory.length - 1);
            return newHistory;
        });
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

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = Math.max(el.scrollHeight, window.innerHeight * 0.6) + 'px';
        }
    }, [chapters[activeChapter]?.content, fontSize, activeChapter]);

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
                setSelectedText('');

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
        setSelectedText('');
    };

    const deleteChapter = (idx: number) => {
        if (chapters.length <= 1) return;
        const chapterTitle = chapters[idx]?.title || `챕터 ${idx + 1}`;
        if (!window.confirm(`"${chapterTitle}" 챕터를 삭제하시겠습니까?\n되돌리기(Ctrl+Z)로 복구할 수 있습니다.`)) return;
        const updated = chapters.filter((_, i) => i !== idx);
        setChapters(updated);
        pushImmediateHistory(updated);
        setActiveChapter(Math.min(activeChapter, updated.length - 1));
        setSelectedText('');
    };

    const moveChapter = (idx: number, dir: number) => {
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= chapters.length) return;
        const updated = [...chapters];
        [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
        setChapters(updated);
        setActiveChapter(newIdx);
        setSelectedText('');
    };

    const updateChapter = (idx: number, field: 'title' | 'content', value: string) => {
        setChapters(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    };

    const rewriteSection = async (refineType: string) => {
        const textToRewrite = selectedText || chapters[activeChapter]?.content;
        if (!textToRewrite?.trim()) {
            alert('본문을 먼저 입력해주세요.');
            return;
        }

        setIsRewriting(true);
        setRewriteMode(refineType);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'refine',
                    text: textToRewrite,
                    refineType,
                }),
            });
            const data = await response.json();
            console.log('[refine] response draft:', data.draft?.substring(0, 200));
            console.log('[refine] error:', data.error);
            if (data.draft) {
                // 마크다운 헤딩이 포함된 경우 제거 (다듬기 결과에 불필요)
                const cleaned = data.draft
                    .replace(/^##\s.*\n+/gm, '')
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/\*(.*?)\*/g, '$1')
                    .replace(/```[\s\S]*?```/g, '')
                    .replace(/`([^`]*)`/g, '$1')
                    .trim();
                console.log('[refine] cleaned:', cleaned?.substring(0, 200));
                const currentSelectedText = selectedText;
                setChapters(prev => {
                    if (currentSelectedText) {
                        const currentContent = prev[activeChapter].content;
                        const newContent = currentContent.replace(currentSelectedText, cleaned);
                        const updated = prev.map((c, i) => i === activeChapter ? { ...c, content: newContent } : c);
                        pushImmediateHistory(updated);
                        return updated;
                    } else {
                        const updated = prev.map((c, i) => i === activeChapter ? { ...c, content: cleaned } : c);
                        pushImmediateHistory(updated);
                        return updated;
                    }
                });
                setSelectedText('');
                setRewriteNotice('문장을 다듬었습니다');
                setTimeout(() => setRewriteNotice(null), 3000);
            } else if (data.error) {
                setRewriteNotice(data.error);
                setTimeout(() => setRewriteNotice(null), 4000);
            }
        } catch (error: any) {
            console.error('Rewrite failed:', error);
            setRewriteNotice('잠시 후 다시 시도해 주세요.');
            setTimeout(() => setRewriteNotice(null), 4000);
        } finally {
            setIsRewriting(false);
            setRewriteMode(null);
        }
    };

    const wordCount = chapters.reduce((sum, c) => sum + (c.content?.length || 0), 0);

    // Auto-scroll chapter interview messages
    useEffect(() => {
        if (chInterviewScrollRef.current) {
            chInterviewScrollRef.current.scrollTo({ top: chInterviewScrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [chInterviewMessages]);

    const openChapterInterview = async (chapterIndex: number) => {
        setChInterviewChapterIndex(chapterIndex);
        setChInterviewMessages([]);
        setChInterviewInput('');
        setChInterviewOpen(true);
        setIsChInterviewLoading(true);
        try {
            const chapter = chapters[chapterIndex];
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [],
                    projectTitle: currentProject?.title || '',
                    track: 'chapter-expand',
                    isInitial: true,
                    chapterTitle: chapter.title,
                    chapterExcerpt: chapter.content.slice(0, 300),
                }),
            });
            if (!response.ok || !response.body) throw new Error('API error');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let content = '';
            setChInterviewMessages([{ role: 'assistant', content: '' }]);
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                content += decoder.decode(value, { stream: true });
                setChInterviewMessages([{ role: 'assistant', content }]);
            }
        } catch (err) {
            console.error('Chapter interview open error:', err);
            setChInterviewMessages([{ role: 'assistant', content: '앗, 에코가 잠시 연결에 문제가 생겼어요. 다시 시도해 주세요.' }]);
        } finally {
            setIsChInterviewLoading(false);
        }
    };

    const sendChInterviewMessage = async () => {
        const text = chInterviewInput.trim();
        if (!text || isChInterviewLoading) return;
        const chapter = chapters[chInterviewChapterIndex];
        const userMsg = { role: 'user' as const, content: text };
        const updatedMessages = [...chInterviewMessages, userMsg];
        setChInterviewMessages(updatedMessages);
        setChInterviewInput('');
        setIsChInterviewLoading(true);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages,
                    projectTitle: currentProject?.title || '',
                    track: 'chapter-expand',
                    isInitial: false,
                    chapterTitle: chapter.title,
                    chapterExcerpt: chapter.content.slice(0, 300),
                }),
            });
            if (!response.ok || !response.body) throw new Error('API error');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';
            setChInterviewMessages(prev => [...prev, { role: 'assistant', content: '' }]);
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                assistantContent += decoder.decode(value, { stream: true });
                setChInterviewMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                    return updated;
                });
            }
        } catch (err) {
            console.error('Chapter interview send error:', err);
            setChInterviewMessages(prev => [...prev, { role: 'assistant', content: '⚠️ 잠시 후 다시 시도해 주세요.' }]);
        } finally {
            setIsChInterviewLoading(false);
            setTimeout(() => chInterviewInputRef.current?.focus(), 50);
        }
    };

    const expandChapterFromInterview = async () => {
        const chapter = chapters[chInterviewChapterIndex];
        const qaPairs: { question: string; answer: string }[] = [];
        for (let i = 0; i < chInterviewMessages.length; i++) {
            const msg = chInterviewMessages[i];
            if (msg.role === 'assistant' && i + 1 < chInterviewMessages.length && chInterviewMessages[i + 1].role === 'user') {
                qaPairs.push({ question: msg.content, answer: chInterviewMessages[i + 1].content });
            }
        }
        if (qaPairs.length === 0) return;
        setIsExpandingChapter(true);
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'expand-chapter',
                    existingContent: chapter.content,
                    chapterTitle: chapter.title,
                    projectTitle: currentProject?.title || '',
                    author: currentProject?.author || '작가',
                    additionalInterviewData: qaPairs,
                }),
            });
            const data = await response.json();
            if (data.draft) {
                const updated = chapters.map((c, i) =>
                    i === chInterviewChapterIndex ? { ...c, content: c.content + '\n\n' + data.draft } : c
                );
                setChapters(updated);
                pushImmediateHistory(updated);
                setChInterviewOpen(false);
                setChInterviewMessages([]);
                setRewriteNotice('챕터가 늘어났습니다 ✨');
                setTimeout(() => setRewriteNotice(null), 3000);
            } else if (data.error) {
                alert(data.error);
            }
        } catch (err) {
            console.error('Chapter expand error:', err);
            alert('챕터 확장 중 오류가 발생했습니다.');
        } finally {
            setIsExpandingChapter(false);
        }
    };

    const calcMatchCount = (text: string) => {
        if (!text) { setMatchCount(0); return; }
        const count = chapters.reduce((sum, c) => {
            if (!c.content) return sum;
            return sum + (c.content.split(text).length - 1);
        }, 0);
        setMatchCount(count);
    };

    const handleReplaceAll = () => {
        if (!findText) return;
        const updated = chapters.map(c => ({
            ...c,
            content: c.content?.split(findText).join(replaceText) || c.content,
        }));
        setChapters(updated);
        calcMatchCount(findText);
    };

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
                    <div className="flex gap-1.5 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => setShowFindReplace(v => !v)} title="찾기/바꾸기" className="rounded-xl px-2 h-9">
                            <Search className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl px-2 md:px-3 font-bold text-xs h-9" onClick={() => router.push('/interview')}>인터뷰 추가</Button>
                        <Button size="sm" onClick={() => router.push('/design')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 md:px-4 font-bold shadow-lg shadow-emerald-100 text-xs h-9">
                            다음 단계 <ArrowRight className="ml-1 h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* 찾기/바꾸기 바 */}
            {showFindReplace && (
                <div className="bg-white border-b px-4 py-3 flex flex-wrap items-center gap-2 shadow-sm z-20">
                    <input
                        value={findText}
                        onChange={e => { setFindText(e.target.value); calcMatchCount(e.target.value); }}
                        placeholder="찾기..."
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[100px] focus:outline-none focus:ring-1 focus:ring-emerald-300"
                    />
                    <span className="text-xs text-slate-400 shrink-0">{matchCount}개</span>
                    <input
                        value={replaceText}
                        onChange={e => setReplaceText(e.target.value)}
                        placeholder="바꾸기..."
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[100px] focus:outline-none focus:ring-1 focus:ring-emerald-300"
                    />
                    <Button size="sm" onClick={handleReplaceAll} disabled={!findText} className="shrink-0 rounded-lg text-xs">모두 바꾸기</Button>
                    <button onClick={() => setShowFindReplace(false)} className="shrink-0 text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* 모바일 사이드바 backdrop */}
            {showMobileSidebar && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setShowMobileSidebar(false)}
                />
            )}

            <main className="flex-1 w-full flex overflow-hidden">
                <div className={`flex-1 max-w-7xl mx-auto w-full p-4 lg:p-12 transition-all duration-500 ${isFocusMode ? 'max-w-4xl' : ''}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 h-full">
                        <AnimatePresence>
                            {!isFocusMode && (
                                <motion.aside
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className={`lg:col-span-4 space-y-6 order-2 lg:order-1 lg:static lg:z-auto lg:overflow-visible lg:bg-transparent lg:p-0 ${showMobileSidebar ? 'fixed inset-0 z-50 bg-white overflow-y-auto p-4 pb-20' : 'hidden'} lg:block`}
                                >
                                    {/* 모바일 사이드바 헤더 */}
                                    <div className="flex justify-between items-center mb-2 lg:hidden">
                                        <h2 className="font-bold text-slate-800">편집 설정</h2>
                                        <button onClick={() => setShowMobileSidebar(false)} className="p-1 rounded-lg hover:bg-slate-100">
                                            <X className="h-5 w-5 text-slate-500" />
                                        </button>
                                    </div>
                                    {/* 판형 선택 */}
                                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-5 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-3">
                                        <div className="flex items-center gap-2 px-2">
                                            <BookOpen className="h-4 w-4 text-emerald-600" />
                                            <h3 className="font-bold text-sm text-slate-800">판형</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 px-1">
                                            {BOOK_FORMATS.map(f => (
                                                <button
                                                    key={f.key}
                                                    onClick={() => handleBookFormatChange(f.key)}
                                                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                                                        bookFormat === f.key
                                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                                                            : 'bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-100'
                                                    }`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                        {(() => {
                                            const fmt = BOOK_FORMATS.find(f => f.key === bookFormat)!;
                                            return (
                                                <p className="text-[10px] text-slate-400 px-2">
                                                    {fmt.w}×{fmt.h}mm · {fmt.desc}
                                                </p>
                                            );
                                        })()}
                                        {/* 글자수 목표 + 진행 바 */}
                                        <div className="px-2 pt-2 border-t border-slate-100 mt-2">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <input
                                                    type="number" step={1000} min={1000} max={500000}
                                                    placeholder="목표 글자수"
                                                    defaultValue={currentProject?.targetWordCount || ''}
                                                    onBlur={e => { const v = Number(e.target.value); if (v > 0) setTargetWordCount(v); }}
                                                    className="w-28 text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                                                />
                                                <span className="text-[10px] text-slate-400">자 목표</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mb-1">현재: {wordCount.toLocaleString()}자</p>
                                            {(currentProject?.targetWordCount || 0) > 0 && (
                                                <div>
                                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                        <span>{Math.round(wordCount / currentProject!.targetWordCount! * 100)}%</span>
                                                        <span>{currentProject!.targetWordCount!.toLocaleString()}자</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full transition-all"
                                                            style={{ width: `${Math.min(100, wordCount / currentProject!.targetWordCount! * 100)}%` }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 내지 레이아웃 패널 */}
                                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                                        <button
                                            className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-slate-50 transition-colors"
                                            onClick={() => setShowLayoutPanel(!showLayoutPanel)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Type className="h-4 w-4 text-emerald-600" />
                                                <h3 className="font-bold text-sm text-slate-800">내지 레이아웃</h3>
                                            </div>
                                            {showLayoutPanel ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                        </button>
                                        {showLayoutPanel && (
                                            <div className="px-4 md:px-5 pb-5 space-y-4 border-t border-slate-100">
                                                {/* 빠른 프리셋 */}
                                                <div className="pt-3">
                                                    <p className="text-[10px] text-slate-400 font-medium mb-2">빠른 프리셋</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {QUICK_PRESETS.map(qp => (
                                                            <button
                                                                key={qp.label}
                                                                onClick={() => setInteriorLayout(qp.preset)}
                                                                className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-100 transition-all"
                                                            >
                                                                {qp.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                {/* 본문 글꼴 */}
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-slate-400 font-medium">본문 글꼴</p>
                                                    <select
                                                        value={il.font}
                                                        onChange={(e) => setInteriorLayout({ font: e.target.value })}
                                                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                                                        style={{ fontFamily: `'${il.font}', serif` }}
                                                    >
                                                        {LAYOUT_FONTS.map(f => (
                                                            <option key={f.value} value={f.value}>{f.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {/* 글자 크기 */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] text-slate-400 font-medium">글자 크기</p>
                                                        <span className="text-[10px] font-bold text-emerald-600">{il.fontSize}pt</span>
                                                    </div>
                                                    <input type="range" min={9} max={14} step={0.5} value={il.fontSize}
                                                        onChange={(e) => setInteriorLayout({ fontSize: Number(e.target.value) })}
                                                        className="w-full h-1 accent-emerald-600 cursor-pointer" />
                                                </div>
                                                {/* 행 간격 */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] text-slate-400 font-medium">행 간격</p>
                                                        <span className="text-[10px] font-bold text-emerald-600">{il.lineHeight}%</span>
                                                    </div>
                                                    <input type="range" min={140} max={200} step={5} value={il.lineHeight}
                                                        onChange={(e) => setInteriorLayout({ lineHeight: Number(e.target.value) })}
                                                        className="w-full h-1 accent-emerald-600 cursor-pointer" />
                                                </div>
                                                {/* 안쪽 여백 */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] text-slate-400 font-medium">안쪽 여백 (제본)</p>
                                                        <span className="text-[10px] font-bold text-emerald-600">{il.marginInner}mm</span>
                                                    </div>
                                                    <input type="range" min={10} max={25} step={1} value={il.marginInner}
                                                        onChange={(e) => setInteriorLayout({ marginInner: Number(e.target.value) })}
                                                        className="w-full h-1 accent-emerald-600 cursor-pointer" />
                                                </div>
                                                {/* 바깥쪽 여백 */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] text-slate-400 font-medium">바깥쪽 여백</p>
                                                        <span className="text-[10px] font-bold text-emerald-600">{il.marginOuter}mm</span>
                                                    </div>
                                                    <input type="range" min={8} max={20} step={1} value={il.marginOuter}
                                                        onChange={(e) => setInteriorLayout({ marginOuter: Number(e.target.value) })}
                                                        className="w-full h-1 accent-emerald-600 cursor-pointer" />
                                                </div>
                                                {/* 위/아래 여백 */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-[10px] text-slate-400 font-medium">위 여백</p>
                                                            <span className="text-[10px] font-bold text-emerald-600">{il.marginTop}mm</span>
                                                        </div>
                                                        <input type="range" min={10} max={30} step={1} value={il.marginTop}
                                                            onChange={(e) => setInteriorLayout({ marginTop: Number(e.target.value) })}
                                                            className="w-full h-1 accent-emerald-600 cursor-pointer" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-[10px] text-slate-400 font-medium">아래 여백</p>
                                                            <span className="text-[10px] font-bold text-emerald-600">{il.marginBottom}mm</span>
                                                        </div>
                                                        <input type="range" min={15} max={35} step={1} value={il.marginBottom}
                                                            onChange={(e) => setInteriorLayout({ marginBottom: Number(e.target.value) })}
                                                            className="w-full h-1 accent-emerald-600 cursor-pointer" />
                                                    </div>
                                                </div>
                                                {/* 챕터 스타일 */}
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] text-slate-400 font-medium">챕터 제목 스타일</p>
                                                    <div className="flex gap-1.5">
                                                        {(['minimal', 'classic', 'ornate'] as const).map(style => (
                                                            <button
                                                                key={style}
                                                                onClick={() => setInteriorLayout({ chapterStyle: style })}
                                                                className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${il.chapterStyle === style ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-emerald-200 hover:text-emerald-600'}`}
                                                            >
                                                                {style === 'minimal' ? '심플' : style === 'classic' ? '클래식' : '장식형'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                {/* 자간 */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] text-slate-400 font-medium">자간</p>
                                                        <span className="text-[10px] font-bold text-emerald-600">{((il.letterSpacing ?? 0) / 100).toFixed(2)}em</span>
                                                    </div>
                                                    <input type="range" min={0} max={20} step={1} value={il.letterSpacing ?? 0}
                                                        onChange={(e) => setInteriorLayout({ letterSpacing: Number(e.target.value) })}
                                                        className="w-full h-1 accent-emerald-600 cursor-pointer" />
                                                </div>
                                                {/* 들여쓰기 */}
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] text-slate-400 font-medium">들여쓰기</p>
                                                    <div className="flex gap-1.5">
                                                        {([{ label: '없음', val: 0 }, { label: '1em', val: 1 }, { label: '2em', val: 2 }]).map(opt => (
                                                            <button key={opt.val}
                                                                onClick={() => setInteriorLayout({ paragraphIndent: opt.val })}
                                                                className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${(il.paragraphIndent ?? 1) === opt.val ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-emerald-200 hover:text-emerald-600'}`}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="font-bold text-lg text-slate-800 px-2">목차</h3>
                                            <div className="h-1 w-8 bg-emerald-500 rounded-full mx-2" />
                                        </div>
                                        <div className="space-y-2 max-h-[40vh] lg:max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar focus-visible:outline-none">
                                            {chapters.map((ch, i) => (
                                                <button
                                                    key={ch.id}
                                                    onClick={() => { setActiveChapter(i); setSelectedText(''); }}
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

                                        <div className="bg-emerald-900 text-white rounded-[2.5rem] p-4 lg:p-8 shadow-2xl shadow-emerald-900/20 relative overflow-hidden border border-emerald-800/50">
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
                                            <Button
                                                disabled={isRewriting || isChInterviewLoading}
                                                onClick={() => openChapterInterview(activeChapter)}
                                                className="w-full justify-start bg-emerald-500/30 hover:bg-emerald-500/50 text-white rounded-2xl h-14 px-5 font-bold border border-emerald-400/30 transition-all hover:scale-[1.02] shadow-sm mb-3 break-keep relative z-10"
                                            >
                                                <MessageCircle className="mr-3 h-5 w-5 text-emerald-300 shrink-0" />
                                                <span className="text-sm lg:text-base tracking-tight">에코와 이어 쓰기</span>
                                            </Button>
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

                        <section className={`${isFocusMode ? 'lg:col-span-12' : 'lg:col-span-8'} order-1 lg:order-2`}>
                            {/* 편집 / 미리보기 탭 */}
                            <div className="flex items-center justify-between mb-4 sticky top-0 z-20 bg-[#faf9f6]/95 backdrop-blur-sm py-2 -mx-1 px-1">
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
                                    <button
                                        onClick={() => setPreviewMode('edit')}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${previewMode === 'edit' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <PenLine className="h-4 w-4" /> 편집
                                    </button>
                                    <button
                                        onClick={() => { setPreviewMode('preview'); setPreviewPage(0); }}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${previewMode === 'preview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Eye className="h-4 w-4" /> 챕터 보기
                                    </button>
                                    <button
                                        onClick={() => { setPreviewMode('bookview'); setPreviewPage(0); }}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${previewMode === 'bookview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <BookOpen className="h-4 w-4" /> 전체 북뷰
                                    </button>
                                </div>
                                {(previewMode === 'preview' || previewMode === 'bookview') && (
                                    <p className="text-[10px] text-slate-400">{BOOK_FORMATS.find(f => f.key === bookFormat)?.label} · {il.font}</p>
                                )}
                            </div>

                            <AnimatePresence mode="wait">
                            {previewMode === 'bookview' ? (
                                /* ── 전체 북뷰 모드 ── */
                                <BookFullView
                                    key="bookview"
                                    chapters={chapters}
                                    bookFormat={BOOK_FORMATS.find(f => f.key === bookFormat)!}
                                    il={il}
                                />
                            ) : previewMode === 'preview' ? (
                                /* ── 챕터 미리보기 모드 ── */
                                <BookPagePreview
                                    key={`preview-${activeChapter}`}
                                    content={chapters[activeChapter]?.content || ''}
                                    title={chapters[activeChapter]?.title || ''}
                                    chapterIndex={activeChapter}
                                    bookFormat={BOOK_FORMATS.find(f => f.key === bookFormat)!}
                                    il={il}
                                    previewPage={previewPage}
                                    setPreviewPage={setPreviewPage}
                                />
                            ) : (
                                <motion.div
                                    key={activeChapter}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 md:p-16 min-h-[50vh] md:min-h-[80vh] flex flex-col relative mx-auto transition-all duration-500"
                                    style={{
                                        maxWidth: `${Math.round(BOOK_FORMATS.find(f => f.key === bookFormat)!.w / BOOK_FORMATS.find(f => f.key === bookFormat)!.h * 900)}px`,
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
                                            ref={textareaRef}
                                            value={chapters[activeChapter]?.content || ''}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateChapter(activeChapter, 'content', e.target.value)}
                                            onSelect={(e: React.SyntheticEvent<HTMLTextAreaElement>) => {
                                                const target = e.target as HTMLTextAreaElement;
                                                const sel = target.value.substring(target.selectionStart, target.selectionEnd);
                                                setSelectedText(sel);
                                            }}
                                            placeholder="여기에 당신의 소중한 기억을 들려주세요..."
                                            className="w-full font-serif border-none focus-visible:ring-0 resize-none bg-transparent placeholder:text-slate-300 transition-all scrollbar-hide text-slate-700 overflow-y-auto"
                                            style={{ fontSize: `${fontSize}px`, lineHeight: '170%', minHeight: '60vh' }}
                                        />

                                        <div className="absolute top-0 right-0 p-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-2 shadow-xl flex flex-col gap-1 items-center">
                                                <button onClick={() => setFontSize(fontSize + 2)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold" title="글씨 크게">가+</button>
                                                <div className="h-px w-6 bg-slate-100" />
                                                <button onClick={() => setFontSize(fontSize - 2)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-600 font-bold" title="글씨 작게">가-</button>
                                            </div>
                                        </div>
                                    </div>

                                    {rewriteNotice && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 20 }}
                                            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 font-bold text-sm"
                                        >
                                            <CheckCircle2 size={16} />
                                            {rewriteNotice}
                                        </motion.div>
                                    )}

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
                                            <span className="hidden md:inline">200자 원고지 약 {Math.ceil((chapters[activeChapter]?.content?.length || 0) / 200)}매</span>
                                            <span className="hidden md:inline">{BOOK_FORMATS.find(f => f.key === bookFormat)!.label} 약 {Math.max(1, Math.round((chapters[activeChapter]?.content?.length || 0) / BOOK_FORMATS.find(f => f.key === bookFormat)!.charsPerPage * 10) / 10)}쪽</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isAutoSaving ? (
                                                <>
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-emerald-500 font-medium">자동 저장됨</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                    <span>3초 후 자동 저장</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </section>
                    </div>
                </div>
            </main>

            {/* Mobile FAB — 사이드바 토글 */}
            {!isFocusMode && (
                <button
                    className="fixed bottom-8 right-4 z-40 lg:hidden bg-emerald-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-2xl shadow-emerald-900/30 transition-transform active:scale-95"
                    onClick={() => setShowMobileSidebar(v => !v)}
                    aria-label="에코 패널 열기"
                >
                    {showMobileSidebar
                        ? <X className="h-6 w-6" />
                        : <Sparkles className="h-6 w-6" />
                    }
                </button>
            )}

            {/* Chapter Interview Modal */}
            <AnimatePresence>
                {chInterviewOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 border-b border-emerald-800/60 shrink-0">
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-emerald-300" />
                                <div>
                                    <p className="text-[10px] text-emerald-300/70 font-medium uppercase tracking-widest">에코와 이야기하기</p>
                                    <h2 className="text-white font-bold text-base leading-tight truncate max-w-[60vw]">
                                        {chapters[chInterviewChapterIndex]?.title}
                                    </h2>
                                </div>
                            </div>
                            <button
                                onClick={() => setChInterviewOpen(false)}
                                className="p-2 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            ref={chInterviewScrollRef}
                            className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
                        >
                            {chInterviewMessages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed font-medium break-keep ${
                                        msg.role === 'user'
                                            ? 'bg-emerald-600 text-white rounded-br-md'
                                            : 'bg-white text-slate-700 shadow-md rounded-bl-md'
                                    }`}>
                                        {msg.content || <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                                    </div>
                                </motion.div>
                            ))}
                            {isChInterviewLoading && chInterviewMessages.length === 0 && (
                                <div className="flex justify-start">
                                    <div className="bg-white rounded-2xl rounded-bl-md px-5 py-3 shadow-md">
                                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Add to Chapter Button */}
                        {chInterviewMessages.filter(m => m.role === 'user').length >= 3 && (
                            <div className="px-4 pb-2 shrink-0">
                                <Button
                                    onClick={expandChapterFromInterview}
                                    disabled={isExpandingChapter}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-12 font-bold shadow-lg text-sm"
                                >
                                    {isExpandingChapter
                                        ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />챕터에 추가 중...</>
                                        : <><Sparkles className="h-4 w-4 mr-2" />이 내용 챕터에 추가하기</>
                                    }
                                </Button>
                            </div>
                        )}

                        {/* Input Bar */}
                        <div className="px-4 pb-6 pt-2 shrink-0 border-t border-slate-700/50">
                            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2 shadow-lg">
                                <input
                                    ref={chInterviewInputRef}
                                    value={chInterviewInput}
                                    onChange={e => setChInterviewInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChInterviewMessage(); } }}
                                    placeholder="에코의 질문에 답해주세요..."
                                    disabled={isChInterviewLoading}
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-300 py-2 font-medium"
                                />
                                <button
                                    onClick={sendChInterviewMessage}
                                    disabled={isChInterviewLoading || !chInterviewInput.trim()}
                                    className="p-2 rounded-xl bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-700 transition-colors shrink-0"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
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
