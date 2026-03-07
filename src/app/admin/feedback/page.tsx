"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldAlert, RefreshCw, Image as ImageIcon, ExternalLink,
    Clock, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp,
    User, ArrowLeft, Search, Trash2, Mail, ArrowUpDown, X
} from "lucide-react";

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
    pending:  { label: "미확인",    color: "bg-amber-100 text-amber-700",    dot: "bg-amber-400",    icon: Clock },
    reviewed: { label: "확인 중",   color: "bg-blue-100 text-blue-700",      dot: "bg-blue-400",     icon: AlertCircle },
    resolved: { label: "처리 완료", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400",  icon: CheckCircle2 },
};

function FeedbackCard({
    item,
    onStatusChange,
    onDelete,
}: {
    item: FeedbackItem;
    onStatusChange: (id: string, status: string) => void;
    onDelete: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [showScreenshot, setShowScreenshot] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const StatusIcon = cfg.icon;
    const isResolved = item.status === "resolved";

    const formattedDate = new Date(item.created_at).toLocaleString("ko-KR", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isResolved ? "border-slate-100 opacity-70" : "border-slate-200"}`}
        >
            {/* Status top bar */}
            <div className={`h-1 w-full ${cfg.dot}`} />

            {/* Header */}
            <div className="p-5 cursor-pointer hover:bg-slate-50/60 transition-colors"
                onClick={() => setExpanded(v => !v)}>
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <User size={15} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-bold text-slate-800">{item.user_name || "익명"}</span>
                            <span className="text-xs text-slate-400 truncate max-w-[180px]">{item.user_email}</span>
                            <span className={`ml-auto px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${cfg.color}`}>
                                <StatusIcon size={10} /> {cfg.label}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{item.description}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-[11px] text-slate-400">{formattedDate}</span>
                            {item.page_url && (
                                <a href={item.page_url} target="_blank" rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5">
                                    <ExternalLink size={10} /> 해당 페이지
                                </a>
                            )}
                            {item.screenshot && (
                                <span className="text-[11px] text-purple-500 flex items-center gap-0.5">
                                    <ImageIcon size={10} /> 스크린샷
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="shrink-0 text-slate-300 mt-0.5">
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>
            </div>

            {/* Expanded content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-5 border-t border-slate-50 space-y-4 pt-4">
                            {/* Full description */}
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">접수 내용</p>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    {item.description}
                                </p>
                            </div>

                            {/* Quick actions */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {item.user_email && (
                                    <a href={`mailto:${item.user_email}?subject=리프노트 피드백 답변`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100">
                                        <Mail size={11} /> 이메일 답장
                                    </a>
                                )}
                                {item.page_url && (
                                    <a href={item.page_url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">
                                        <ExternalLink size={11} /> 페이지 열기
                                    </a>
                                )}
                            </div>

                            {/* Screenshot */}
                            {item.screenshot && (
                                <div>
                                    <button onClick={() => setShowScreenshot(v => !v)}
                                        className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 hover:text-purple-500 transition-colors">
                                        <ImageIcon size={11} /> 스크린샷 {showScreenshot ? "숨기기" : "보기"}
                                    </button>
                                    <AnimatePresence>
                                        {showScreenshot && (
                                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className="rounded-xl overflow-hidden border border-slate-200">
                                                <img src={item.screenshot} alt="스크린샷" className="w-full" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Status + Delete */}
                            <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-slate-50">
                                <div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">상태 변경</p>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {(["pending", "reviewed", "resolved"] as const).map(s => {
                                            const c = STATUS_CONFIG[s];
                                            const SIcon = c.icon;
                                            return (
                                                <button key={s} onClick={() => onStatusChange(item.id, s)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-all border ${item.status === s
                                                        ? `${c.color} border-transparent font-bold shadow-sm`
                                                        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600"
                                                    }`}>
                                                    <SIcon size={10} /> {c.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {confirmDelete ? (
                                        <motion.div key="confirm" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">삭제할까요?</span>
                                            <button onClick={() => onDelete(item.id)}
                                                className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-full font-bold hover:bg-red-600">삭제</button>
                                            <button onClick={() => setConfirmDelete(false)}
                                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                                                <X size={13} />
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            onClick={() => setConfirmDelete(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all">
                                            <Trash2 size={11} /> 삭제
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
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
    const [search, setSearch] = useState("");
    const [sortDesc, setSortDesc] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/feedback");
            if (res.status === 403) { router.push("/dashboard"); return; }
            const json = await res.json();
            setItems(json.data || []);
        } catch {
            setError("데이터를 불러오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
        if (status === "authenticated") fetchData();
    }, [status, fetchData]);

    const handleStatusChange = async (id: string, newStatus: string) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus as any } : item));
        await fetch("/api/feedback", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: newStatus }),
        });
    };

    const handleDelete = async (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
        await fetch("/api/feedback", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
    };

    const counts = {
        all: items.length,
        pending: items.filter(i => i.status === "pending").length,
        reviewed: items.filter(i => i.status === "reviewed").length,
        resolved: items.filter(i => i.status === "resolved").length,
    };

    const filtered = items
        .filter(i => filter === "all" || i.status === filter)
        .filter(i => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                i.description.toLowerCase().includes(q) ||
                (i.user_name || "").toLowerCase().includes(q) ||
                (i.user_email || "").toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            return sortDesc ? diff : -diff;
        });

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
                <Loader2 className="animate-spin text-purple-600" size={28} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf9f6]">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-100">
                                <ShieldAlert size={17} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold font-serif text-slate-800">피드백 관리</h1>
                                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Admin</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 hidden sm:block">{session?.user?.email}</span>
                        <button onClick={fetchData} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors" title="새로고침">
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
                {error ? (
                    <div className="text-center py-20">
                        <ShieldAlert size={40} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">{error}</p>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="animate-spin text-purple-500" size={28} />
                    </div>
                ) : (
                    <>
                        {/* Stats / Filter tabs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(["all", "pending", "reviewed", "resolved"] as const).map(key => {
                                const labels = { all: "전체", pending: "미확인", reviewed: "확인 중", resolved: "처리 완료" };
                                const colors = { all: "text-slate-700", pending: "text-amber-600", reviewed: "text-blue-600", resolved: "text-emerald-600" };
                                const dots = { all: "bg-slate-400", pending: "bg-amber-400", reviewed: "bg-blue-400", resolved: "bg-emerald-400" };
                                return (
                                    <button key={key} onClick={() => setFilter(key)}
                                        className={`bg-white rounded-2xl p-4 text-center border transition-all relative overflow-hidden ${filter === key ? "border-purple-200 shadow-sm" : "border-slate-100 hover:border-slate-200"}`}>
                                        {filter === key && <div className={`absolute top-0 left-0 right-0 h-0.5 ${dots[key]}`} />}
                                        <p className={`text-2xl font-bold ${colors[key]}`}>{counts[key]}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{labels[key]}</p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search + Sort */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="이름, 이메일, 내용으로 검색..."
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-300 outline-none bg-white" />
                            </div>
                            <button onClick={() => setSortDesc(v => !v)}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-500 hover:bg-slate-50 transition-colors whitespace-nowrap">
                                <ArrowUpDown size={13} />
                                <span className="hidden sm:inline">{sortDesc ? "최신순" : "오래된순"}</span>
                            </button>
                        </div>

                        {/* List */}
                        {filtered.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                                <CheckCircle2 size={36} className="mx-auto mb-3 text-slate-200" />
                                <p className="text-sm">{search ? "검색 결과가 없습니다." : "접수된 피드백이 없습니다."}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-400 px-1">{filtered.length}건</p>
                                {filtered.map((item, i) => (
                                    <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}>
                                        <FeedbackCard item={item} onStatusChange={handleStatusChange} onDelete={handleDelete} />
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
