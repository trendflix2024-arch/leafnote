"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ShieldAlert, RefreshCw, Image as ImageIcon, ExternalLink,
    Clock, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp, User
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackItem {
    id: string;
    user_name: string | null;
    user_email: string | null;
    description: string;
    page_url: string | null;
    screenshot: string | null;
    status: "pending" | "reviewed" | "resolved";
    created_at: string;
}

const STATUS_CONFIG = {
    pending: { label: "미확인", color: "bg-amber-100 text-amber-700", icon: Clock },
    reviewed: { label: "확인 중", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
    resolved: { label: "처리 완료", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

function FeedbackCard({ item, onStatusChange }: { item: FeedbackItem; onStatusChange: (id: string, status: string) => void }) {
    const [expanded, setExpanded] = useState(false);
    const [showScreenshot, setShowScreenshot] = useState(false);
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const StatusIcon = cfg.icon;

    const formattedDate = new Date(item.created_at).toLocaleString("ko-KR", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
            {/* Header */}
            <div
                className="p-5 cursor-pointer hover:bg-slate-50/60 transition-colors"
                onClick={() => setExpanded((v) => !v)}
            >
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <User size={16} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-bold text-slate-800">{item.user_name || "익명"}</span>
                            <span className="text-xs text-slate-400">{item.user_email}</span>
                            <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${cfg.color}`}>
                                <StatusIcon size={11} />
                                {cfg.label}
                            </span>
                        </div>
                        <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{item.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-[11px] text-slate-400">{formattedDate}</span>
                            {item.page_url && (
                                <a
                                    href={item.page_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[11px] text-emerald-600 hover:underline flex items-center gap-0.5"
                                >
                                    <ExternalLink size={10} /> 해당 페이지
                                </a>
                            )}
                            {item.screenshot && (
                                <span className="text-[11px] text-blue-500 flex items-center gap-0.5">
                                    <ImageIcon size={10} /> 스크린샷 있음
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="shrink-0 text-slate-400">
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="px-5 pb-5 border-t border-slate-50">
                    <div className="pt-4 space-y-4">
                        {/* Full description */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">접수 내용</p>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-3">
                                {item.description}
                            </p>
                        </div>

                        {/* Screenshot */}
                        {item.screenshot && (
                            <div>
                                <button
                                    onClick={() => setShowScreenshot((v) => !v)}
                                    className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
                                >
                                    <ImageIcon size={12} /> 스크린샷 {showScreenshot ? "숨기기" : "보기"}
                                </button>
                                {showScreenshot && (
                                    <div className="rounded-xl overflow-hidden border border-slate-100">
                                        <img src={item.screenshot} alt="스크린샷" className="w-full" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Status control */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">상태 변경</p>
                            <div className="flex gap-2 flex-wrap">
                                {(["pending", "reviewed", "resolved"] as const).map((s) => {
                                    const c = STATUS_CONFIG[s];
                                    const SIcon = c.icon;
                                    return (
                                        <button
                                            key={s}
                                            onClick={() => onStatusChange(item.id, s)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all border ${
                                                item.status === s
                                                    ? `${c.color} border-transparent font-bold`
                                                    : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                                            }`}
                                        >
                                            <SIcon size={11} /> {c.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

export default function AdminFeedbackPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [items, setItems] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "resolved">("all");

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/feedback");
            if (res.status === 403) {
                setError("접근 권한이 없습니다. 관리자 계정으로 로그인해 주세요.");
                return;
            }
            const json = await res.json();
            setItems(json.data || []);
        } catch {
            setError("데이터를 불러오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
        if (status === "authenticated") fetchData();
    }, [status]);

    const handleStatusChange = async (id: string, newStatus: string) => {
        setItems((prev) => prev.map((item) => item.id === id ? { ...item, status: newStatus as any } : item));
        await fetch("/api/feedback", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: newStatus }),
        });
    };

    const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);
    const counts = {
        all: items.length,
        pending: items.filter((i) => i.status === "pending").length,
        reviewed: items.filter((i) => i.status === "reviewed").length,
        resolved: items.filter((i) => i.status === "resolved").length,
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
                <Loader2 className="animate-spin text-emerald-600" size={28} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf9f6]">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                            <ShieldAlert size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold font-serif text-slate-800">베타 피드백 관리</h1>
                            <p className="text-xs text-slate-400">관리자 전용 페이지</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 hidden sm:block">{session?.user?.email}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchData}
                            className="gap-1.5 rounded-full text-xs"
                        >
                            <RefreshCw size={13} /> 새로고침
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/dashboard")}
                            className="text-xs text-slate-400"
                        >
                            대시보드
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {error ? (
                    <div className="text-center py-20">
                        <ShieldAlert size={40} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">{error}</p>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="animate-spin text-emerald-500" size={28} />
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            {(["all", "pending", "reviewed", "resolved"] as const).map((key) => {
                                const labels = { all: "전체", pending: "미확인", reviewed: "확인 중", resolved: "처리 완료" };
                                const colors = { all: "text-slate-700", pending: "text-amber-600", reviewed: "text-blue-600", resolved: "text-emerald-600" };
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setFilter(key)}
                                        className={`bg-white rounded-2xl p-4 text-center border transition-all ${
                                            filter === key ? "border-emerald-200 shadow-sm" : "border-slate-100 hover:border-slate-200"
                                        }`}
                                    >
                                        <p className={`text-2xl font-bold ${colors[key]}`}>{counts[key]}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{labels[key]}</p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* List */}
                        {filtered.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">
                                <CheckCircle2 size={36} className="mx-auto mb-3 text-slate-200" />
                                <p>접수된 피드백이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map((item, i) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                    >
                                        <FeedbackCard item={item} onStatusChange={handleStatusChange} />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
