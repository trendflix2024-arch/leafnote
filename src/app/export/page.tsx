"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useBookStore, useCurrentProject, Project, InteriorLayout, DEFAULT_INTERIOR } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Printer, Share2, ArrowLeft, FileText, Loader2, BookOpen, ChevronLeft, ChevronRight, Check, Lock, TreePine, Copy, ExternalLink, ChevronDown, Crown, Sparkles, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressStepper from '@/components/ProgressStepper';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';

const loadGoogleFont = (fontName: string) => {
    if (typeof document === 'undefined') return;
    const id = `gfont-${fontName.replace(/\s+/g, '-')}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@100;300;400;500;700;900&display=swap`;
    document.head.appendChild(link);
};

const BOOK_FORMATS = [
    { key: 'b6', label: '4×6판(B6)', w: 128, h: 188, charsPerPage: 600 },
    { key: 'irregular', label: '다짜판', w: 128, h: 210, charsPerPage: 650 },
    { key: 'a5', label: '국판(A5)', w: 148, h: 210, charsPerPage: 800 },
    { key: 'a5v', label: '국판변형', w: 136, h: 200, charsPerPage: 700 },
    { key: 'shinkook', label: '신국판', w: 152, h: 224, charsPerPage: 900 },
    { key: 'shinkookv', label: '신국판변형', w: 152, h: 205, charsPerPage: 800 },
    { key: 'crown', label: '크라운판', w: 170, h: 245, charsPerPage: 1100 },
    { key: 'b5', label: '4×6배판(B5)', w: 182, h: 257, charsPerPage: 1300 },
    { key: 'a4', label: '국배판(A4)', w: 210, h: 297, charsPerPage: 1600 },
];

const CATEGORIES = ['에세이', '자서전', '소설', '시', '여행'];
const EXCERPT_OPTIONS = [
    { key: 'intro', label: '서두만 (1,000자)', desc: '맛보기용 공개' },
    { key: 'first-chapter', label: '첫 챕터', desc: '챕터 1개 공개' },
    { key: 'full', label: '전문 공개', desc: '전체 원고 공개' },
] as const;

// Dynamic import to avoid SSR issues with @react-pdf/renderer
const PDFDownloadSection = dynamic<{ project: Project }>(
    () => import('@/components/PDFDownloadSection'),
    {
        ssr: false,
        loading: () => (
            <Button disabled className="w-full bg-slate-800">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> PDF 준비 중...
            </Button>
        ),
    }
);

export default function ExportPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const currentProject = useCurrentProject();
    const [isEpubLoading, setIsEpubLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [viewMode, setViewMode] = useState<'print' | 'ebook'>('print');
    const [bgImageValid, setBgImageValid] = useState(false);

    // Community publish state
    const [publishCategory, setPublishCategory] = useState('에세이');
    const [publishExcerpt, setPublishExcerpt] = useState<'intro' | 'first-chapter' | 'full'>('intro');
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [copied, setCopied] = useState(false);

    const { setDedicationText, setAuthorBio } = useBookStore();
    const { tier } = useSubscription();
    const canDownloadPdf = tier === 'standard' || tier === 'pro';
    const canDownloadEpub = tier !== 'free';

    // Dedication & Author Bio local state (sync to store on blur)
    const [localDedication, setLocalDedication] = useState(currentProject?.dedicationText || '');
    const [localAuthorBio, setLocalAuthorBio] = useState(currentProject?.authorBio || '');
    const [isCoverDownloading, setIsCoverDownloading] = useState(false);
    const coverPreviewRef = useRef<HTMLDivElement>(null);

    // Load cover font and interior font
    useEffect(() => {
        if (currentProject?.coverDesign?.params?.font) {
            loadGoogleFont(currentProject.coverDesign.params.font);
        }
        if (currentProject?.coverDesign?.interiorLayout?.font) {
            loadGoogleFont(currentProject.coverDesign.interiorLayout.font);
        }
    }, [currentProject?.coverDesign?.params?.font, currentProject?.coverDesign?.interiorLayout?.font]);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Redirect if no project selected
    useEffect(() => {
        if (status === 'authenticated' && !currentProject) {
            router.push('/dashboard');
        }
    }, [currentProject, status, router]);

    // Validate cover background image URL (Replicate URLs may expire)
    useEffect(() => {
        const url = currentProject?.coverDesign?.params?.bgImageUrl || currentProject?.coverImageUrl || '';
        if (!url) { setBgImageValid(false); return; }
        const img = new window.Image();
        img.onload = () => setBgImageValid(true);
        img.onerror = () => setBgImageValid(false);
        img.src = url;
    }, [currentProject?.coverDesign?.params?.bgImageUrl, currentProject?.coverImageUrl]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
                <div className="animate-pulse text-slate-400 font-serif">인증 확인 중...</div>
            </div>
        );
    }

    if (!session || !currentProject) return null;

    const { fullDraft, coverImageUrl, coverDesign, title: projectTitle, author: authorName } = currentProject;

    // Extract saved cover design state
    const cd = coverDesign || {} as any;
    const cdParams = cd.params || {};
    const cdColors = cdParams.colors || { primary: '#064e3b', secondary: '#022c22', accent: '#fbbf24', textFront: '#ecfdf5', textSpine: '#ecfdf5' };
    const cdStyle = cdParams.style || { texture: 'leather', layout: 'elegant' };
    const cdTexts = cdParams.generatedTexts || {};
    const bgUrl = cdParams.bgImageUrl || coverImageUrl || '';
    const coverFont = cdParams.font || 'Noto Serif KR';
    const coverFontFamily = `"${coverFont}", serif`;
    const coverTextPos = cdParams.textPosition || 'center';
    const coverTextAlign = cdParams.textAlign || 'center';
    const coverTextColor = cdParams.customTextColor || cdColors.textFront || '#fff';
    const coverAccentColor = cdParams.customAccentColor || cdColors.accent || '#fbbf24';
    const coverTitleStyle = cdParams.titleStyle || { size: 28, weight: 700, spacing: 0, lineHeight: 140, italic: false, transform: 'none' };
    const coverSubtitleStyle = cdParams.subtitleStyle || { size: 12, weight: 400, spacing: 5, lineHeight: 150, italic: false, transform: 'uppercase' };
    const coverAuthorStyle = cdParams.authorStyle || { size: 16, weight: 400, spacing: 8, lineHeight: 140, italic: false, transform: 'none' };
    const coverShadow = cdParams.textShadow || false;
    const coverBrightness = cdParams.bgBrightness ?? (cdParams.bgOverlayOpacity != null ? (100 - cdParams.bgOverlayOpacity) : 60);
    const coverOverlay = (100 - coverBrightness);
    const coverEditTexts = cdParams.editTexts || {};
    const displayCoverTitle = coverEditTexts.title || projectTitle;
    const displayCoverAuthor = coverEditTexts.author || authorName;
    const displaySubtitle = coverEditTexts.frontSubtitle || cdTexts.frontSubtitle || '';
    // Book format info
    const formatKey = cdParams.bookFormat || 'a5';
    const bookFormat = BOOK_FORMATS.find(f => f.key === formatKey) || BOOK_FORMATS[2]; // default A5

    // Interior layout (WYSIWYG)
    const il: InteriorLayout = currentProject.coverDesign?.interiorLayout || DEFAULT_INTERIOR;

    // Parse draft into pages for ebook (800 chars) and print (charsPerPage)
    const splitIntoPages = (maxChars: number) => {
        const paragraphs = (fullDraft || '').split(/\n\n+/).filter(Boolean);
        const result: string[] = [];
        let chunk = '';
        for (const p of paragraphs) {
            if (chunk.length + p.length > maxChars) {
                if (chunk) result.push(chunk);
                chunk = p + '\n\n';
            } else {
                chunk += p + '\n\n';
            }
        }
        if (chunk) result.push(chunk);
        return result;
    };

    // Calculate chars/page from interiorLayout for WYSIWYG accuracy
    const MM_PX = 3.7795;
    const ilFontPx = il.fontSize * 1.333;
    const ilContentW = (bookFormat.w - il.marginInner - il.marginOuter) * MM_PX;
    const ilContentH = (bookFormat.h - il.marginTop - il.marginBottom - 15) * MM_PX;
    const ilCharsPerLine = Math.max(10, Math.floor(ilContentW / (ilFontPx * 0.55)));
    const ilLinesPerPage = Math.max(5, Math.floor(ilContentH / (ilFontPx * (il.lineHeight / 100))));
    const ilCharsPerPage = Math.max(bookFormat.charsPerPage, ilCharsPerLine * ilLinesPerPage);

    const ebookPages = splitIntoPages(800);
    const printPages = splitIntoPages(ilCharsPerPage);
    const pages = viewMode === 'print' ? printPages : ebookPages;

    const handleEpubDownload = async () => {
        setIsEpubLoading(true);
        try {
            const sections = (fullDraft || '').split(/\n\n+/).filter(Boolean);
            const chapters = sections.length > 0
                ? sections.map((s: string, i: number) => ({ title: `Chapter ${i + 1}`, content: s }))
                : [{ title: 'Chapter 1', content: fullDraft || '본문이 없습니다.' }];

            const response = await fetch('/api/epub', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: projectTitle,
                    author: authorName,
                    chapters,
                }),
            });

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectTitle}.epub`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('EPUB download failed:', error);
        } finally {
            setIsEpubLoading(false);
        }
    };

    const shareText = `「${projectTitle}」 — ${authorName} 저. 리프노트에서 작성된 나의 이야기`;
    const shareUrl = 'https://leafnote.co.kr';

    const handleCopyShare = () => {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = () => {
        if (navigator.share) {
            navigator.share({ title: projectTitle, text: shareText, url: shareUrl });
        } else {
            handleCopyShare();
        }
    };

    const handleTwitterShare = () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    };

    const handleFacebookShare = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
    };

    // Community publish
    const draftChapters = (fullDraft || '').split(/^## /m).filter(Boolean);
    const firstChapter = draftChapters[0] || fullDraft || '';

    const handleCommunityPublish = async () => {
        setIsPublishing(true);
        try {
            const excerptContent = publishExcerpt === 'full'
                ? fullDraft
                : publishExcerpt === 'first-chapter'
                    ? firstChapter.slice(0, 5000)
                    : (fullDraft || '').slice(0, 1000);

            const res = await fetch('/api/community/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: projectTitle,
                    content: excerptContent,
                    category: publishCategory,
                    projectId: currentProject.id,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setPublishedUrl(`/community/${data.id}`);
            }
        } catch (e) {
            console.error('Community publish failed:', e);
        } finally {
            setIsPublishing(false);
        }
    };

    // Book stats
    const charCount = (fullDraft || '').length;
    const manuscriptPages = Math.ceil(charCount / 200);
    const a4Pages = Math.round(charCount / 1600 * 10) / 10;
    const estimatedBookPages = Math.ceil(charCount / 500);
    const chapterCount = draftChapters.length || 1;
    const updatedDate = currentProject.updatedAt
        ? new Date(currentProject.updatedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    const showBgImage = bgUrl && bgImageValid;

    // Page map: ordered list of page types for navigation
    const buildPageMap = (contentPages: string[]) => {
        const map: Array<{ type: string; contentIndex?: number }> = [
            { type: 'cover' },
            { type: 'preface' },
        ];
        if (localDedication.trim()) map.push({ type: 'dedication' });
        map.push({ type: 'toc' });
        contentPages.forEach((_, i) => map.push({ type: 'content', contentIndex: i }));
        if (localAuthorBio.trim()) map.push({ type: 'authorbio' });
        map.push({ type: 'backcover' });
        return map;
    };

    const printPageMap = buildPageMap(printPages);
    const ebookPageMap = buildPageMap(ebookPages);
    const currentPageMap = viewMode === 'print' ? printPageMap : ebookPageMap;
    const totalPages = currentPageMap.length;

    // Chapter titles for TOC
    const chapTitles = (fullDraft || '').split(/^## /m).filter(Boolean).map((c, i) => {
        const firstLine = c.split('\n')[0].trim();
        return { title: firstLine || `챕터 ${i + 1}`, estimatedPage: i + 1 };
    });

    // Cover image download via html2canvas (dynamic import to avoid SSR)
    const handleDownloadCoverImage = useCallback(async () => {
        if (!coverPreviewRef.current) return;
        setIsCoverDownloading(true);
        try {
            const { default: html2canvas } = await import('html2canvas');
            const canvas = await html2canvas(coverPreviewRef.current, { useCORS: true, scale: 2, logging: false });
            const link = document.createElement('a');
            link.download = `${projectTitle}_표지.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error('Cover image download failed:', e);
        } finally {
            setIsCoverDownloading(false);
        }
    }, [coverPreviewRef, projectTitle]);

    const renderCover = () => (
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${cdColors.primary}, ${cdColors.secondary})` }}>
                {showBgImage && <div className="absolute inset-0" style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
                {coverOverlay > 0 && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${coverOverlay / 100})` }} />}
                <div className={`absolute inset-0 p-6 flex flex-col z-10 ${
                    coverTextPos === 'top' ? 'justify-start pt-10' : coverTextPos === 'bottom' ? 'justify-end pb-10' : 'justify-center'
                } ${coverTextAlign === 'left' ? 'items-start text-left' : coverTextAlign === 'right' ? 'items-end text-right' : 'items-center text-center'}`}>
                    <div className="w-full">
                        <h1 className="break-keep mb-2" style={{
                            fontFamily: coverFontFamily,
                            fontSize: `${Math.round(coverTitleStyle.size * 0.7)}px`,
                            fontWeight: coverTitleStyle.weight,
                            letterSpacing: `${coverTitleStyle.spacing / 100}em`,
                            lineHeight: `${coverTitleStyle.lineHeight}%`,
                            fontStyle: coverTitleStyle.italic ? 'italic' : 'normal',
                            textTransform: coverTitleStyle.transform as any,
                            color: coverTextColor,
                            textShadow: coverShadow ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                        }}>
                            {displayCoverTitle}
                        </h1>
                        {displaySubtitle && (
                            <p className="break-keep" style={{
                                fontFamily: coverFontFamily,
                                fontSize: `${Math.round(coverSubtitleStyle.size * 0.7)}px`,
                                fontWeight: coverSubtitleStyle.weight,
                                letterSpacing: `${coverSubtitleStyle.spacing / 100}em`,
                                color: coverAccentColor,
                                opacity: 0.8,
                            }}>
                                {displaySubtitle}
                            </p>
                        )}
                    </div>
                    <div className="mt-4">
                        {cdStyle.layout === 'classic' && <div className="w-8 h-[1px] mx-auto mb-3" style={{ backgroundColor: `${coverAccentColor}60` }} />}
                        <p style={{
                            fontFamily: coverFontFamily,
                            fontSize: `${Math.round(coverAuthorStyle.size * 0.7)}px`,
                            fontWeight: coverAuthorStyle.weight,
                            letterSpacing: `${coverAuthorStyle.spacing / 100}em`,
                            color: coverTextColor,
                            textShadow: coverShadow ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
                        }}>
                            {displayCoverAuthor}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPreface = () => (
        <div className="absolute inset-0 flex flex-col overflow-hidden"
            style={{ padding: `${il.marginTop * 0.35}% ${il.marginOuter * 0.35}% ${il.marginBottom * 0.35}% ${il.marginInner * 0.35}%` }}
        >
            <h4 className="font-bold text-slate-800 mb-3 border-b pb-2 shrink-0"
                style={{ fontFamily: `'${il.font}', serif`, fontSize: `${il.fontSize * 1.333 * 0.9}px` }}
            >서문</h4>
            <p className="text-slate-600 overflow-hidden"
                style={{ fontFamily: `'${il.font}', serif`, fontSize: `${il.fontSize * 1.333 * 0.85}px`, lineHeight: `${il.lineHeight}%` }}
            >
                이 책은 {authorName}의 소중한 기억과 경험을 담은 기록입니다.
                세상에 단 하나뿐인 특별한 이야기입니다.
            </p>
        </div>
    );

    const renderBackCover = () => (
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center p-12 text-center text-white/50">
            <div>
                <BookOpen size={32} className="mx-auto mb-4" />
                <p className="text-xs tracking-widest uppercase">Published by LeafNote</p>
            </div>
        </div>
    );

    const renderContentPage = (contentPages: string[], pageIndex: number) => (
        <div className="absolute inset-0 flex flex-col overflow-hidden"
            style={{ padding: `${il.marginTop * 0.35}% ${il.marginOuter * 0.35}% ${il.marginBottom * 0.35}% ${il.marginInner * 0.35}%` }}
        >
            <p className="whitespace-pre-wrap text-justify overflow-hidden flex-1"
                style={{
                    fontFamily: `'${il.font}', serif`,
                    fontSize: `${il.fontSize * 1.333 * 0.85}px`,
                    lineHeight: `${il.lineHeight}%`,
                    color: '#334155',
                    wordBreak: 'keep-all',
                }}
            >
                {contentPages[pageIndex] || ''}
            </p>
            <div className="text-center pt-2 shrink-0"
                style={{ fontFamily: `'${il.font}', serif`, fontSize: `${il.fontSize * 1.333 * 0.65}px`, color: '#94a3b8' }}
            >{currentPage - 1}</div>
        </div>
    );

    const renderTOC = () => (
        <div className="absolute inset-0 flex flex-col overflow-hidden"
            style={{ padding: `${il.marginTop * 0.35}% ${il.marginOuter * 0.35}% ${il.marginBottom * 0.35}% ${il.marginInner * 0.35}%` }}
        >
            <h4 className="font-bold text-slate-800 mb-2 shrink-0"
                style={{ fontFamily: `'${il.font}', serif`, fontSize: `${il.fontSize * 1.333 * 0.9}px`, letterSpacing: '0.15em' }}
            >차 례</h4>
            <div className="border-b border-slate-200 mb-3 shrink-0" />
            <div className="space-y-1.5 overflow-hidden flex-1">
                {chapTitles.map((ch, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-2">
                        <span className="text-slate-700 truncate" style={{ fontFamily: `'${il.font}', serif`, fontSize: `${il.fontSize * 1.333 * 0.8}px` }}>
                            {ch.title}
                        </span>
                        <span className="text-slate-400 shrink-0 tabular-nums" style={{ fontSize: `${il.fontSize * 1.333 * 0.72}px` }}>{ch.estimatedPage}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderDedication = () => (
        <div className="absolute inset-0 flex items-center justify-center p-10 text-center">
            <p className="text-slate-600 italic leading-relaxed"
                style={{ fontFamily: `'${il.font}', serif`, fontSize: `${il.fontSize * 1.333 * 0.9}px`, lineHeight: `${il.lineHeight}%` }}
            >
                {localDedication}
            </p>
        </div>
    );

    const renderAuthorBio = () => (
        <div className="absolute inset-0 flex flex-col overflow-hidden"
            style={{ padding: `${il.marginTop * 0.35}% ${il.marginOuter * 0.35}% ${il.marginBottom * 0.35}% ${il.marginInner * 0.35}%` }}
        >
            <h4 className="font-bold text-slate-800 mb-2 shrink-0"
                style={{ fontFamily: `'${il.font}', serif`, fontSize: `${il.fontSize * 1.333 * 0.9}px` }}
            >저자 소개</h4>
            <div className="border-b border-slate-200 mb-3 shrink-0" />
            <p className="text-slate-600 overflow-hidden"
                style={{ fontFamily: `'${il.font}', serif`, fontSize: `${il.fontSize * 1.333 * 0.82}px`, lineHeight: `${il.lineHeight}%` }}
            >
                {localAuthorBio}
            </p>
        </div>
    );

    const renderPage = (contentPages: string[]) => {
        const map = buildPageMap(contentPages);
        const entry = map[currentPage];
        if (!entry) return renderBackCover();
        switch (entry.type) {
            case 'cover': return renderCover();
            case 'preface': return renderPreface();
            case 'dedication': return renderDedication();
            case 'toc': return renderTOC();
            case 'content': return renderContentPage(contentPages, entry.contentIndex!);
            case 'authorbio': return renderAuthorBio();
            default: return renderBackCover();
        }
    };

    return (
        <div className="min-h-screen bg-[#faf9f6] flex flex-col">
            <ProgressStepper />
            <header className="p-4 md:p-6 border-b bg-white flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-lg md:text-2xl font-serif font-bold text-slate-800 tracking-tight">출판 및 배포</h1>
                <Button variant="outline" size="sm" onClick={() => router.push('/design')}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> 디자인으로
                </Button>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-6 md:space-y-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 mb-3">축하합니다, 작가님! 🎉</h2>
                    <p className="text-slate-500 max-w-lg mx-auto">
                        당신의 소중한 이야기가 한 권의 책으로 완성되었습니다. 최종본을 확인하고 출판하세요.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[2rem] md:rounded-3xl p-4 md:p-8 flex flex-col items-center justify-center min-h-[450px] md:min-h-[600px] border border-slate-200 relative overflow-hidden shadow-inner">

                        {/* View Toggle */}
                        <div className="absolute top-4 md:top-6 right-4 md:right-6 z-10 flex bg-white/90 backdrop-blur-md rounded-full p-1 shadow-md border border-slate-200">
                            <button
                                onClick={() => { setViewMode('print'); setCurrentPage(0); }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${viewMode === 'print' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <BookOpen className="h-3.5 w-3.5" />종이책
                            </button>
                            <button
                                onClick={() => { setViewMode('ebook'); setCurrentPage(0); }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${viewMode === 'ebook' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Smartphone className="h-3.5 w-3.5" />전자책
                            </button>
                        </div>

                        {viewMode === 'print' ? (
                            /* ===== 종이책 (Print) — 판형 비율 단일 페이지 ===== */
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="w-full max-w-sm mx-auto relative" style={{ aspectRatio: `${bookFormat.w} / ${bookFormat.h}` }}>
                                    {/* Paper shadow effect */}
                                    <div className="absolute -right-1 top-1 inset-0 bg-slate-300/40 rounded-sm" />
                                    <div className="absolute -right-0.5 top-0.5 inset-0 bg-slate-200/60 rounded-sm" />
                                    <div ref={coverPreviewRef} className="absolute inset-0 bg-white rounded-sm shadow-xl overflow-hidden border border-slate-200/80">
                                        <AnimatePresence mode="wait" initial={false}>
                                            <motion.div
                                                key={`print-${currentPage}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                                className="absolute inset-0 flex flex-col overflow-hidden"
                                            >
                                                {renderPage(printPages)}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-3 font-medium">{bookFormat.label} ({bookFormat.w}×{bookFormat.h}mm)</p>
                            </div>
                        ) : (
                            /* ===== 전자책 (E-book) — 단일 페이지 세로 뷰 ===== */
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="w-full max-w-sm mx-auto relative" style={{ aspectRatio: '3 / 4' }}>
                                    {/* Device frame */}
                                    <div className="absolute inset-0 rounded-2xl border-[3px] border-slate-300 bg-white shadow-2xl overflow-hidden">
                                        <AnimatePresence mode="wait" initial={false}>
                                            <motion.div
                                                key={`ebook-${currentPage}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                                className="absolute inset-0 flex flex-col overflow-hidden"
                                            >
                                                {renderPage(ebookPages)}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Page Navigation */}
                        <div className="flex justify-center items-center gap-6 mt-4">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full bg-white shadow-md hover:bg-slate-50 border-none"
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                            >
                                <ChevronLeft className="h-5 w-5 text-slate-700" />
                            </Button>
                            <div className="bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium text-slate-600 shadow-sm">
                                {(() => {
                                    const entry = currentPageMap[currentPage];
                                    if (!entry) return '뒷표지';
                                    if (entry.type === 'cover') return '표지';
                                    if (entry.type === 'preface') return '서문';
                                    if (entry.type === 'dedication') return '헌정사';
                                    if (entry.type === 'toc') return '목차';
                                    if (entry.type === 'authorbio') return '저자 소개';
                                    if (entry.type === 'backcover') return '뒷표지';
                                    return `${currentPage} / ${totalPages - 2}`;
                                })()}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full bg-white shadow-md hover:bg-slate-50 border-none"
                                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage >= totalPages - 1}
                            >
                                <ChevronRight className="h-5 w-5 text-slate-700" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-1 custom-scrollbar">

                        {/* 0. 책 세부 정보 (헌정사 / 저자 소개) */}
                        <Card className="p-5 bg-white shadow-lg border-none">
                            <h3 className="font-bold text-sm mb-3 text-slate-800 flex items-center gap-2">
                                <FileText className="text-violet-500 h-4 w-4" /> 책 세부 정보
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">헌정사</label>
                                    <textarea
                                        value={localDedication}
                                        onChange={e => setLocalDedication(e.target.value)}
                                        onBlur={() => setDedicationText(localDedication)}
                                        placeholder="예: 사랑하는 가족에게"
                                        rows={2}
                                        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-300 resize-none"
                                        style={{ fontFamily: `'${il.font}', serif` }}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-0.5">입력 시 헌정사 페이지가 추가됩니다</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">저자 소개</label>
                                    <textarea
                                        value={localAuthorBio}
                                        onChange={e => setLocalAuthorBio(e.target.value)}
                                        onBlur={() => setAuthorBio(localAuthorBio)}
                                        placeholder="저자에 대한 간단한 소개를 입력하세요..."
                                        rows={4}
                                        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-300 resize-none"
                                        style={{ fontFamily: `'${il.font}', serif` }}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-0.5">입력 시 저자 소개 페이지가 추가됩니다</p>
                                </div>
                            </div>
                        </Card>

                        {/* 1. 내 책 정보 */}
                        <Card className="p-5 bg-white shadow-lg border-none">
                            <h3 className="font-bold text-sm mb-3 text-slate-800 flex items-center gap-2">
                                <BookOpen className="text-emerald-600 h-4 w-4" /> 내 책 정보
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">제목</span>
                                    <span className="font-medium text-slate-700 text-right max-w-[60%] truncate">{projectTitle}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">작가</span>
                                    <span className="font-medium text-slate-700">{authorName}</span>
                                </div>
                                <div className="h-px bg-slate-100 my-1" />
                                <div className="flex justify-between">
                                    <span className="text-slate-400">분량</span>
                                    <span className="text-slate-600">{charCount.toLocaleString()}자</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">원고지</span>
                                    <span className="text-slate-600">약 {manuscriptPages}매 (200자)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">예상 쪽수</span>
                                    <span className="text-slate-600">약 {estimatedBookPages}p (A4 {a4Pages}매)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">챕터</span>
                                    <span className="text-slate-600">{chapterCount}개</span>
                                </div>
                                {updatedDate && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">최종 수정</span>
                                        <span className="text-slate-600">{updatedDate}</span>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* 2. 디지털 다운로드 */}
                        <Card className="p-5 bg-white shadow-lg border-none">
                            <h3 className="font-bold text-sm mb-3 text-slate-800 flex items-center gap-2">
                                <Download className="text-blue-500 h-4 w-4" /> 디지털 다운로드
                            </h3>
                            <div className="space-y-2.5">
                                {/* PDF */}
                                {canDownloadPdf ? (
                                    <PDFDownloadSection project={currentProject} />
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-11 opacity-60 cursor-not-allowed"
                                        onClick={() => router.push('/pricing')}
                                    >
                                        <Lock className="mr-3 h-4 w-4 text-slate-400" />
                                        <div className="text-left flex-1">
                                            <div className="font-bold text-sm">PDF</div>
                                            <div className="text-[10px] text-slate-400 -mt-0.5">스탠다드 플랜부터 이용 가능</div>
                                        </div>
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                    </Button>
                                )}

                                {/* EPUB */}
                                {canDownloadEpub ? (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-11"
                                        onClick={handleEpubDownload}
                                        disabled={isEpubLoading}
                                    >
                                        {isEpubLoading ? <Loader2 className="mr-3 h-4 w-4 animate-spin" /> : <FileText className="mr-3 h-4 w-4 text-orange-500" />}
                                        <div className="text-left">
                                            <div className="font-bold text-sm">EPUB (전자책)</div>
                                            <div className="text-[10px] text-slate-400 -mt-0.5">교보문고, 밀리의서재 등</div>
                                        </div>
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-11 opacity-60 cursor-not-allowed"
                                        onClick={() => router.push('/pricing')}
                                    >
                                        <Lock className="mr-3 h-4 w-4 text-slate-400" />
                                        <div className="text-left flex-1">
                                            <div className="font-bold text-sm">EPUB (전자책)</div>
                                            <div className="text-[10px] text-slate-400 -mt-0.5">베이직 플랜부터 이용 가능</div>
                                        </div>
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                    </Button>
                                )}

                                {!canDownloadPdf && (
                                    <button onClick={() => router.push('/pricing')} className="w-full text-center text-xs text-emerald-600 font-medium hover:underline py-1">
                                        플랜 업그레이드하기 &rarr;
                                    </button>
                                )}
                            </div>
                        </Card>

                        {/* 3. 이야기 숲에 발행 */}
                        <Card className="p-5 bg-white shadow-lg border-none">
                            <h3 className="font-bold text-sm mb-3 text-slate-800 flex items-center gap-2">
                                <TreePine className="text-emerald-600 h-4 w-4" /> 이야기 숲에 발행
                            </h3>
                            {publishedUrl ? (
                                <div className="text-center py-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Check className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 mb-2">발행 완료!</p>
                                    <Button size="sm" variant="outline" onClick={() => router.push(publishedUrl)} className="text-xs">
                                        <ExternalLink className="mr-1 h-3 w-3" /> 게시글 보기
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">카테고리</label>
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:border-emerald-300 transition-colors"
                                            >
                                                {publishCategory}
                                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                            </button>
                                            {showCategoryPicker && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                                                    {CATEGORIES.map(cat => (
                                                        <button
                                                            key={cat}
                                                            onClick={() => { setPublishCategory(cat); setShowCategoryPicker(false); }}
                                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 transition-colors ${publishCategory === cat ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600'}`}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1.5 block">공개 범위</label>
                                        <div className="space-y-1.5">
                                            {EXCERPT_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.key}
                                                    onClick={() => setPublishExcerpt(opt.key)}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all ${
                                                        publishExcerpt === opt.key
                                                            ? 'border-emerald-400 bg-emerald-50'
                                                            : 'border-slate-100 hover:border-slate-200'
                                                    }`}
                                                >
                                                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                                        publishExcerpt === opt.key ? 'border-emerald-600' : 'border-slate-300'
                                                    }`}>
                                                        {publishExcerpt === opt.key && <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-medium text-slate-700">{opt.label}</div>
                                                        <div className="text-[10px] text-slate-400">{opt.desc}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleCommunityPublish}
                                        disabled={isPublishing}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 shadow-md"
                                    >
                                        {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TreePine className="mr-2 h-4 w-4" />}
                                        이야기 숲에 발행하기
                                    </Button>
                                </div>
                            )}
                        </Card>

                        {/* 4. 공유하기 */}
                        <Card className="p-5 bg-white shadow-lg border-none">
                            <h3 className="font-bold text-sm mb-3 text-slate-800 flex items-center gap-2">
                                <Share2 className="text-teal-500 h-4 w-4" /> 공유하기
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={handleNativeShare} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors" title="공유">
                                    <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                        <Share2 className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="text-[10px] text-slate-500">공유</span>
                                </button>
                                <button onClick={handleTwitterShare} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors" title="X(트위터)">
                                    <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">X</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500">X</span>
                                </button>
                                <button onClick={handleFacebookShare} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors" title="페이스북">
                                    <div className="w-9 h-9 bg-[#1877F2] rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">f</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500">Facebook</span>
                                </button>
                                <button onClick={handleCopyShare} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors" title="링크 복사">
                                    <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center">
                                        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-600" />}
                                    </div>
                                    <span className="text-[10px] text-slate-500">{copied ? '복사됨' : '복사'}</span>
                                </button>
                                <button onClick={handleDownloadCoverImage} disabled={isCoverDownloading} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors" title="표지 이미지 저장">
                                    <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center">
                                        {isCoverDownloading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Download className="h-4 w-4 text-white" />}
                                    </div>
                                    <span className="text-[10px] text-slate-500">표지 저장</span>
                                </button>
                            </div>
                        </Card>

                        {/* 5. 종이책 제본 */}
                        <Card className="p-5 bg-white shadow-lg border-none">
                            <h3 className="font-bold text-sm mb-3 text-slate-800 flex items-center gap-2">
                                <Printer className="text-amber-600 h-4 w-4" /> 종이책 제본
                            </h3>
                            <div className="space-y-2">
                                {[
                                    { name: 'e북 패키지', price: '₩29,900', desc: 'PDF + EPUB + 표지 디자인', color: 'border-blue-100 bg-blue-50/50' },
                                    { name: '제본 패키지', price: '₩79,900', desc: '양장본 1권 + 무료 배송', color: 'border-amber-100 bg-amber-50/50' },
                                    { name: '작가 교정 플랜', price: '₩199,000', desc: '전문 편집 + 3권 + ISBN', color: 'border-purple-100 bg-purple-50/50' },
                                ].map(pkg => (
                                    <div key={pkg.name} className={`flex items-center justify-between p-2.5 rounded-xl border ${pkg.color}`}>
                                        <div>
                                            <div className="text-xs font-bold text-slate-700">{pkg.name}</div>
                                            <div className="text-[10px] text-slate-400">{pkg.desc}</div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 whitespace-nowrap ml-2">{pkg.price}</span>
                                    </div>
                                ))}
                            </div>
                            <Button
                                onClick={() => router.push('/pricing')}
                                className="w-full mt-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold h-10 shadow-md text-sm"
                            >
                                <Crown className="mr-2 h-4 w-4" /> 패키지 선택하기
                            </Button>
                        </Card>

                        {/* 6. 대시보드 */}
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard')}
                            className="w-full h-11 rounded-xl font-medium"
                        >
                            <Check className="mr-2 h-4 w-4 text-emerald-500" /> 대시보드로 돌아가기
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
