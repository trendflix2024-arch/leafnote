"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useBookStore } from "@/lib/store";

const CATEGORIES = ["에세이", "자서전", "소설", "시", "여행"];

export default function CommunityWritePage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { projects } = useBookStore();

    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("에세이");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showProjectPicker, setShowProjectPicker] = useState(false);

    const activeProjects = projects.filter((p) => !p.isDeleted);
    const selectedProject = activeProjects.find((p) => p.id === selectedProjectId);

    const handleProjectSelect = (projectId: string) => {
        setSelectedProjectId(projectId);
        setShowProjectPicker(false);

        const project = activeProjects.find((p) => p.id === projectId);
        if (!project) return;

        // Pre-fill title from project title
        if (!title) setTitle(project.title);

        // Pre-fill content from fullDraft or interview answers
        if (project.fullDraft && !content) {
            // Use first ~1000 chars of draft as excerpt
            setContent(project.fullDraft.slice(0, 1000));
        } else if (project.interviewData?.length > 0 && !content) {
            const excerpt = project.interviewData
                .slice(0, 5)
                .map((d) => d.answer)
                .filter(Boolean)
                .join("\n\n");
            setContent(excerpt.slice(0, 1000));
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/community/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    category,
                    projectId: selectedProjectId || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "게시 실패");

            router.push(`/community/${data.id}`);
        } catch (err: any) {
            alert(err.message || "게시 중 오류가 발생했어요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
                <Loader2 size={28} className="text-emerald-500 animate-spin" />
            </div>
        );
    }

    if (!session?.user) {
        router.push("/login");
        return null;
    }

    return (
        <div className="min-h-screen bg-[#faf9f6]">
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-serif font-bold text-slate-800 flex-1">이야기 올리기</h1>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !title.trim() || !content.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5 text-sm font-bold"
                    >
                        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "게시하기"}
                    </Button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
                {/* Project picker */}
                {activeProjects.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                        <button
                            onClick={() => setShowProjectPicker((v) => !v)}
                            className="w-full flex items-center gap-3 px-5 py-4"
                        >
                            <BookOpen size={18} className="text-emerald-500 shrink-0" />
                            <span className="flex-1 text-left text-sm">
                                {selectedProject
                                    ? <span className="font-bold text-slate-800">{selectedProject.title}</span>
                                    : <span className="text-slate-400">내 프로젝트에서 불러오기 (선택)</span>
                                }
                            </span>
                            <ChevronDown
                                size={16}
                                className={`text-slate-400 transition-transform ${showProjectPicker ? "rotate-180" : ""}`}
                            />
                        </button>

                        {showProjectPicker && (
                            <div className="border-t border-slate-100 divide-y divide-slate-50">
                                {activeProjects.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => handleProjectSelect(project.id)}
                                        className={`w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors ${
                                            selectedProjectId === project.id ? "bg-emerald-50" : ""
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                                            {project.title[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{project.title}</p>
                                            <p className="text-xs text-slate-400">
                                                {project.interviewData?.length || 0}개 인터뷰
                                                {project.fullDraft ? " · 원고 있음" : ""}
                                            </p>
                                        </div>
                                        {selectedProjectId === project.id && (
                                            <span className="text-xs font-bold text-emerald-600">선택됨</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Category */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4"
                >
                    <p className="text-xs font-bold text-slate-400 mb-3">카테고리</p>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    category === cat
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4"
                >
                    <p className="text-xs font-bold text-slate-400 mb-2">제목</p>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="이야기 제목을 입력하세요"
                        maxLength={100}
                        className="w-full text-lg font-serif font-bold text-slate-800 placeholder:text-slate-200 outline-none bg-transparent"
                    />
                    <p className="text-right text-xs text-slate-300 mt-1">{title.length}/100</p>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4"
                >
                    <p className="text-xs font-bold text-slate-400 mb-2">내용</p>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="나누고 싶은 이야기를 자유롭게 써보세요..."
                        rows={12}
                        maxLength={3000}
                        className="w-full text-sm text-slate-700 leading-relaxed placeholder:text-slate-200 outline-none bg-transparent resize-none"
                    />
                    <p className="text-right text-xs text-slate-300 mt-1">{content.length}/3000</p>
                </motion.div>

                <p className="text-center text-xs text-slate-300 pb-4">
                    게시한 이야기는 이야기 숲에 전체 공개됩니다
                </p>
            </main>
        </div>
    );
}
