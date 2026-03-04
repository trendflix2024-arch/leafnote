"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useBookStore, useCurrentProject, Project } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Printer, Share2, ArrowLeft, FileText, Loader2, BookOpen, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressStepper from '@/components/ProgressStepper';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
                <div className="animate-pulse text-slate-400 font-serif">인증 확인 중...</div>
            </div>
        );
    }

    if (!session || !currentProject) return null;

    const { fullDraft, coverImageUrl, title: projectTitle, author: authorName } = currentProject;

    // Parse draft into pages (very basic pagination for preview)
    const paragraphs = (fullDraft || '').split(/\n\n+/).filter(Boolean);
    const pages: string[] = [];
    let currentContentChunks = '';

    for (const p of paragraphs) {
        if (currentContentChunks.length + p.length > 800) {
            pages.push(currentContentChunks);
            currentContentChunks = p + '\n\n';
        } else {
            currentContentChunks += p + '\n\n';
        }
    }
    if (currentContentChunks) pages.push(currentContentChunks);

    // Total flipbook pages: Cover + Intro + Body Pages + Back Cover
    const totalPages = pages.length + 3;

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

    const copyShareLink = () => {
        navigator.clipboard.writeText(`"${projectTitle}" — ${authorName} 저. 에코북에서 작성된 나의 이야기`);
        alert('공유 링크가 클립보드에 복사되었습니다.');
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
                    <div className="lg:col-span-2 bg-slate-100 rounded-[2rem] md:rounded-3xl p-4 md:p-8 flex flex-col items-center justify-center min-h-[450px] md:min-h-[600px] border border-slate-200 relative overflow-hidden shadow-inner">
                        <div className="w-full max-w-xl aspect-[1/0.7] relative perspective-1000 flex">
                            <AnimatePresence mode="popLayout" initial={false}>
                                <motion.div
                                    key={currentPage}
                                    initial={{ rotateY: 90, opacity: 0 }}
                                    animate={{ rotateY: 0, opacity: 1 }}
                                    exit={{ rotateY: -90, opacity: 0 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                    className="absolute inset-0 flex bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-200 origin-left lg:origin-center"
                                >
                                    <div className="hidden md:flex flex-1 border-r border-slate-200 bg-gradient-to-l from-black/5 to-transparent relative p-10 flex-col justify-center items-center">
                                        <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-r from-black/10 to-transparent pointer-events-none"></div>

                                        {currentPage === 0 ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill="white" fillOpacity="0.2" />
                                                        <path d="M12 22V2M12 22C12 22 20 18 20 12C20 6 12 2 12 2M12 22C12 22 4 6 4 12C4 18 12 22 12 22ZM12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 15C13.5 15 15 15.5 15 17M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14M12 15C10.5 15 9 15.5 9 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                                    </svg>
                                                </div>
                                                <h1 className="text-xl font-serif font-bold text-slate-800">리프노트 <span className="text-emerald-600 ml-1">LeafNote</span></h1>
                                            </div>
                                        ) : currentPage === 1 ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-center">
                                                <h3 className="text-2xl font-serif font-bold text-slate-800 mb-4">{projectTitle}</h3>
                                                <div className="w-12 h-[1px] bg-slate-400 mb-4"></div>
                                                <p className="text-slate-600 font-serif">{authorName} 지음</p>
                                            </div>
                                        ) : currentPage >= totalPages - 1 ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-center">
                                                <p className="text-sm font-serif text-slate-500 italic">"The End"</p>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col">
                                                <p className="text-base font-serif text-slate-700 leading-loose whitespace-pre-wrap text-justify">
                                                    {pages[(currentPage - 2) * 2]}
                                                </p>
                                                <div className="mt-auto text-center pt-8 text-xs text-slate-400 font-serif">{(currentPage - 2) * 2 + 1}</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 bg-gradient-to-r from-black/5 to-transparent relative p-6 md:p-10 flex flex-col justify-center items-center">
                                        <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-l from-black/10 to-transparent pointer-events-none"></div>

                                        {currentPage === 0 ? (
                                            <div className="absolute inset-0 overflow-hidden bg-slate-800">
                                                {coverImageUrl && <img src={coverImageUrl} className="w-full h-full object-cover opacity-80" />}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/30 backdrop-blur-[2px]">
                                                    <h3 className="text-3xl font-serif font-bold text-white mb-6 uppercase tracking-widest">{projectTitle}</h3>
                                                    <p className="text-white/80 font-serif">{authorName}</p>
                                                </div>
                                            </div>
                                        ) : currentPage === 1 ? (
                                            <div className="w-full h-full flex flex-col">
                                                <h4 className="text-xl font-serif font-bold text-slate-800 mb-6 border-b pb-4">서문</h4>
                                                <p className="text-sm font-serif text-slate-600 leading-loose">
                                                    이 책은 {authorName}의 소중한 기억과 경험을 담은 기록입니다.
                                                    리프노트(LeafNote) AI 인터뷰를 통해 작성되었으며, 세상에 단 하나뿐인 특별한 이야기입니다.
                                                </p>
                                            </div>
                                        ) : currentPage >= totalPages - 1 ? (
                                            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center p-12 text-center text-white/50">
                                                <div>
                                                    <BookOpen size={32} className="mx-auto mb-4" />
                                                    <p className="text-xs tracking-widest uppercase">Published by LeafNote</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col">
                                                <p className="text-base font-serif text-slate-700 leading-loose whitespace-pre-wrap text-justify">
                                                    {pages[(currentPage - 2) * 2 + 1] || ''}
                                                </p>
                                                <div className="mt-auto text-center pt-8 text-xs text-slate-400 font-serif">{(currentPage - 2) * 2 + 2}</div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6">
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
                                {currentPage === 0 ? '표지' : currentPage >= totalPages - 1 ? '뒷표지' : `${currentPage} / ${totalPages - 2}`}
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

                    <div className="space-y-6">
                        <Card className="p-6 bg-white shadow-xl border-none">
                            <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                                <Download className="text-blue-500 h-5 w-5" /> 디지털 책 다운로드
                            </h3>
                            <div className="space-y-3">
                                <PDFDownloadSection project={currentProject} />

                                <Button
                                    variant="outline"
                                    className="w-full justify-start h-12"
                                    onClick={handleEpubDownload}
                                    disabled={isEpubLoading}
                                >
                                    {isEpubLoading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : <FileText className="mr-3 h-5 w-5 text-orange-500" />}
                                    <div className="text-left">
                                        <div className="font-bold">EPUB (전자책 포맷)</div>
                                        <div className="text-[10px] text-slate-400 -mt-1">교보문고, 밀리의서재 등 앱에서 읽기</div>
                                    </div>
                                </Button>
                            </div>
                        </Card>

                        <Card className="p-6 bg-white shadow-xl border-none">
                            <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                                <Printer className="text-slate-700 h-5 w-5" /> 실물 종이책 제작 (POD)
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">
                                1권부터 제작 가능한 소량 인쇄 서비스. 프리미엄 양장본으로 당신의 책을 간직하세요.
                            </p>
                            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold h-12 shadow-md">
                                인쇄 옵션 선택하기
                            </Button>
                        </Card>

                        <Card className="p-6 bg-white shadow-xl border-none">
                            <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                                <Share2 className="text-teal-500 h-5 w-5" /> 작품 공유하기
                            </h3>
                            <div className="flex gap-2">
                                <Button variant="secondary" className="flex-1" onClick={copyShareLink}>
                                    <Share2 className="mr-2 h-4 w-4" /> 링크 복사
                                </Button>
                                <Button variant="secondary" className="flex-1" onClick={() => router.push('/dashboard')}>
                                    <Check className="mr-2 h-4 w-4 text-emerald-500" /> 대시보드로
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
