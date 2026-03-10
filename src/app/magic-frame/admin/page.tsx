"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldAlert, RefreshCw, Loader2, Search, ArrowUpDown,
    CheckCircle2, Clock, X, RotateCcw, Trash2, ImageIcon,
    ShoppingBag, Package, Truck, XCircle, Users
} from "lucide-react";

interface MagicFrameUser {
    id: string;
    name: string;
    phone: string;
    submitted: boolean;
    image_url: string | null;
    image_type: string | null;
    updated_at: string | null;
    created_at: string;
}

interface MagicFrameOrder {
    id: string;
    user_id: string;
    product_id: string;
    product_name: string;
    amount: number;
    quantity: number;
    toss_order_id: string;
    toss_payment_key: string;
    status: "paid" | "shipped" | "cancelled";
    buyer_name: string;
    buyer_phone: string;
    created_at: string;
    updated_at: string;
}

const STATUS_CONFIG = {
    paid: { label: "결제 완료", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
    shipped: { label: "배송 완료", color: "bg-blue-100 text-blue-700", dot: "bg-blue-400" },
    cancelled: { label: "취소", color: "bg-red-100 text-red-700", dot: "bg-red-400" },
};

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

export default function MagicFrameAdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [tab, setTab] = useState<"users" | "orders">("users");

    // ── Users state ──
    const [users, setUsers] = useState<MagicFrameUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<"recent" | "name">("recent");
    const [lightbox, setLightbox] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmReset, setConfirmReset] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "submitted" | "pending">("all");

    // ── Orders state ──
    const [orders, setOrders] = useState<MagicFrameOrder[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [orderSearch, setOrderSearch] = useState("");
    const [orderFilter, setOrderFilter] = useState<"all" | "paid" | "shipped" | "cancelled">("all");
    const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);
    const [confirmStatusChange, setConfirmStatusChange] = useState<{ orderId: string; newStatus: string; label: string } | null>(null);

    const isAdmin = status === "authenticated" && ADMIN_EMAILS.includes(session?.user?.email || "");

    // ── Users fetch ──
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            params.set("sort", sort);
            const res = await fetch(`/api/magic-frame/admin?${params}`);
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setUsers(data.users || []);
        } catch {
            setError("데이터를 불러올 수 없습니다.");
        } finally {
            setLoading(false);
        }
    }, [search, sort]);

    // ── Orders fetch ──
    const fetchOrders = useCallback(async () => {
        setOrdersLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            if (orderSearch) params.set("search", orderSearch);
            if (orderFilter !== "all") params.set("status", orderFilter);
            const res = await fetch(`/api/magic-frame/admin/orders?${params}`);
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setOrders(data.orders || []);
        } catch {
            setError("주문 데이터를 불러올 수 없습니다.");
        } finally {
            setOrdersLoading(false);
        }
    }, [orderSearch, orderFilter]);

    useEffect(() => {
        if (status === "loading") return;
        if (!isAdmin) { router.replace("/magic-frame"); return; }
        fetchUsers();
    }, [status, isAdmin, router, fetchUsers]);

    useEffect(() => {
        if (!isAdmin) return;
        if (tab === "orders") fetchOrders();
    }, [tab, isAdmin, fetchOrders]);

    // ── Users handlers ──
    const handleResetSubmission = async (userId: string) => {
        setActionLoading(userId);
        try {
            const res = await fetch("/api/magic-frame/admin", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, submitted: false } : u));
        } catch {
            setError("처리 중 오류가 발생했습니다.");
        } finally {
            setActionLoading(null);
            setConfirmReset(null);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        setActionLoading(userId);
        try {
            const res = await fetch("/api/magic-frame/admin", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch {
            setError("삭제 중 오류가 발생했습니다.");
        } finally {
            setActionLoading(null);
            setConfirmDelete(null);
        }
    };

    // ── Orders handler ──
    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        setStatusUpdateLoading(orderId);
        try {
            const res = await fetch("/api/magic-frame/admin/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status: newStatus }),
            });
            const data = await res.json();
            if (data.error) { setError(data.error); return; }
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: newStatus as MagicFrameOrder["status"] } : o
            ));
        } catch {
            setError("상태 변경 중 오류가 발생했습니다.");
        } finally {
            setStatusUpdateLoading(null);
            setConfirmStatusChange(null);
        }
    };

    // ── Helpers ──
    const getResetInfo = (user: MagicFrameUser) => {
        if (!user.submitted || !user.updated_at) return { canReset: false, remaining: "" };
        const elapsed = Date.now() - new Date(user.updated_at).getTime();
        const limit = 30 * 60 * 1000;
        if (elapsed > limit) return { canReset: false, remaining: "만료" };
        const left = Math.ceil((limit - elapsed) / 60000);
        return { canReset: true, remaining: `${left}분 남음` };
    };

    const formatPhone = (phone: string) => {
        if (phone.length === 11) return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
        if (phone.length === 10) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
        return phone;
    };

    const formatDate = (d: string | null) => {
        if (!d) return "-";
        return new Date(d).toLocaleString("ko-KR", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
        });
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    if (!isAdmin) return null;

    // ── Computed ──
    const filteredUsers = users.filter(u => {
        if (filter === "submitted") return u.submitted;
        if (filter === "pending") return !u.submitted;
        return true;
    });
    const submittedCount = users.filter(u => u.submitted).length;
    const pendingCount = users.filter(u => !u.submitted).length;

    const paidOrders = orders.filter(o => o.status === "paid");
    const shippedOrders = orders.filter(o => o.status === "shipped");
    const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + o.amount, 0);

    const handleRefresh = () => {
        if (tab === "users") fetchUsers();
        else fetchOrders();
    };

    const isLoading = tab === "users" ? loading : ordersLoading;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <ShieldAlert size={18} className="text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800">매직액자 관리</h1>
                            <p className="text-xs text-slate-400">제출 사진 · 주문 관리</p>
                        </div>
                    </div>
                    <button onClick={handleRefresh} disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> 새로고침
                    </button>
                </div>

                {/* Tabs */}
                <div className="max-w-5xl mx-auto px-4 pb-3">
                    <div className="inline-flex bg-slate-100 rounded-full p-1">
                        <button onClick={() => setTab("users")}
                            className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold transition-all ${tab === "users"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"}`}>
                            <Users size={14} /> 사용자
                        </button>
                        <button onClick={() => setTab("orders")}
                            className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold transition-all ${tab === "orders"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"}`}>
                            <ShoppingBag size={14} /> 주문 관리
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-500 text-xs rounded-lg p-3 flex items-center gap-1.5">
                        <ShieldAlert size={12} /> {error}
                    </div>
                )}

                {/* ═══════════ USERS TAB ═══════════ */}
                {tab === "users" && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                                <p className="text-2xl font-bold text-slate-800">{users.length}</p>
                                <p className="text-xs text-slate-400 mt-1">전체</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                                <p className="text-2xl font-bold text-emerald-600">{submittedCount}</p>
                                <p className="text-xs text-slate-400 mt-1">제출 완료</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                                <p className="text-xs text-slate-400 mt-1">미제출</p>
                            </div>
                        </div>

                        {/* Search + Sort + Filter */}
                        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="이름 또는 연락처 검색"
                                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                </div>
                                <button onClick={() => setSort(prev => prev === "recent" ? "name" : "recent")}
                                    className="flex items-center gap-1 px-3 py-2.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
                                    <ArrowUpDown size={12} /> {sort === "recent" ? "최근순" : "이름순"}
                                </button>
                            </div>
                            <div className="flex gap-1.5">
                                {([
                                    { key: "all" as const, label: "전체" },
                                    { key: "submitted" as const, label: "제출 완료" },
                                    { key: "pending" as const, label: "미제출" },
                                ]).map(f => (
                                    <button key={f.key} onClick={() => setFilter(f.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filter === f.key
                                            ? "bg-indigo-600 text-white border-indigo-600"
                                            : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200"}`}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* User list */}
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="animate-spin text-indigo-500" size={28} />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <ImageIcon size={48} className="mb-3 opacity-40" />
                                <p className="text-sm font-medium">등록된 사용자가 없습니다</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredUsers.map(user => (
                                    <motion.div key={user.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="flex items-center gap-3 p-4">
                                            <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 cursor-pointer border border-slate-200"
                                                onClick={() => user.image_url && setLightbox(user.image_url)}>
                                                {user.image_url ? (
                                                    <img src={user.image_url} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageIcon size={16} className="text-slate-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-slate-800">{user.name}</span>
                                                    {user.submitted ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                                                            <CheckCircle2 size={10} /> 제출 완료
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                                                            <Clock size={10} /> 미제출
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400">{formatPhone(user.phone)}</p>
                                                <p className="text-[10px] text-slate-300 mt-0.5">
                                                    {user.image_type && <span className="mr-2">{user.image_type}</span>}
                                                    {formatDate(user.updated_at || user.created_at)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                {user.submitted && (() => {
                                                    const { canReset, remaining } = getResetInfo(user);
                                                    return (
                                                        <div className="flex flex-col items-end gap-0.5">
                                                            <button onClick={() => setConfirmReset(user.id)}
                                                                disabled={!canReset || actionLoading === user.id}
                                                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-40"
                                                                title={canReset ? "재제출 허용" : "30분 초과"}>
                                                                {actionLoading === user.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                                                                <span className="hidden sm:inline">재제출</span>
                                                            </button>
                                                            <span className={`text-[10px] ${canReset ? "text-indigo-400" : "text-slate-300"}`}>{remaining}</span>
                                                        </div>
                                                    );
                                                })()}
                                                <button onClick={() => setConfirmDelete(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                                                    title="삭제">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ═══════════ ORDERS TAB ═══════════ */}
                {tab === "orders" && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                                <p className="text-2xl font-bold text-slate-800">{orders.length}</p>
                                <p className="text-xs text-slate-400 mt-1">전체 주문</p>
                                <p className="text-[10px] text-slate-300 mt-0.5">₩{totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                                <p className="text-2xl font-bold text-emerald-600">{paidOrders.length}</p>
                                <p className="text-xs text-slate-400 mt-1">배송 대기</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
                                <p className="text-2xl font-bold text-blue-600">{shippedOrders.length}</p>
                                <p className="text-xs text-slate-400 mt-1">배송 완료</p>
                            </div>
                        </div>

                        {/* Search + Filter */}
                        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm space-y-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                                    placeholder="구매자명, 연락처, 상품명 검색"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                            </div>
                            <div className="flex gap-1.5">
                                {([
                                    { key: "all" as const, label: "전체" },
                                    { key: "paid" as const, label: "결제 완료" },
                                    { key: "shipped" as const, label: "배송 완료" },
                                    { key: "cancelled" as const, label: "취소" },
                                ]).map(f => (
                                    <button key={f.key} onClick={() => setOrderFilter(f.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${orderFilter === f.key
                                            ? "bg-indigo-600 text-white border-indigo-600"
                                            : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200"}`}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Order list */}
                        {ordersLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="animate-spin text-indigo-500" size={28} />
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <ShoppingBag size={48} className="mb-3 opacity-40" />
                                <p className="text-sm font-medium">주문 내역이 없습니다</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {orders.map(order => {
                                    const cfg = STATUS_CONFIG[order.status];
                                    return (
                                        <motion.div key={order.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                                            <div className="flex items-center gap-3 p-4">
                                                {/* Product icon */}
                                                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                    <Package size={20} className="text-indigo-400" />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-slate-800">{order.product_name}</span>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${cfg.color}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                            {cfg.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400">
                                                        {order.buyer_name} · {formatPhone(order.buyer_phone)}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <span className="text-xs font-bold text-indigo-600">₩{order.amount.toLocaleString()}</span>
                                                        <span className="text-[10px] text-slate-300">{formatDate(order.created_at)}</span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                {order.status === "paid" && (
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        <button onClick={() => setConfirmStatusChange({ orderId: order.id, newStatus: "shipped", label: "배송 처리" })}
                                                            disabled={statusUpdateLoading === order.id}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40">
                                                            {statusUpdateLoading === order.id ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
                                                            <span className="hidden sm:inline">배송</span>
                                                        </button>
                                                        <button onClick={() => setConfirmStatusChange({ orderId: order.id, newStatus: "cancelled", label: "주문 취소" })}
                                                            disabled={statusUpdateLoading === order.id}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40">
                                                            <XCircle size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ═══════════ MODALS ═══════════ */}

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setLightbox(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="relative max-w-2xl max-h-[85vh] w-full"
                            onClick={e => e.stopPropagation()}>
                            <img src={lightbox} alt="확대 보기" className="w-full h-full object-contain rounded-2xl" />
                            <button onClick={() => setLightbox(null)}
                                className="absolute top-3 right-3 w-9 h-9 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                                <X size={18} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reset confirm */}
            <AnimatePresence>
                {confirmReset && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <RotateCcw size={20} className="text-indigo-600" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 mb-1">재제출을 허용하시겠습니까?</h3>
                            <p className="text-xs text-slate-400 mb-4">사용자가 사진을 다시 제출할 수 있게 됩니다</p>
                            <div className="flex gap-2">
                                <button onClick={() => setConfirmReset(null)}
                                    className="flex-1 py-2.5 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm">취소</button>
                                <button onClick={() => handleResetSubmission(confirmReset)}
                                    disabled={actionLoading === confirmReset}
                                    className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-1">
                                    {actionLoading === confirmReset ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                    허용
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete confirm */}
            <AnimatePresence>
                {confirmDelete && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Trash2 size={20} className="text-red-500" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 mb-1">사용자를 삭제하시겠습니까?</h3>
                            <p className="text-xs text-slate-400 mb-4">사용자 정보와 제출 사진이 모두 삭제됩니다</p>
                            <div className="flex gap-2">
                                <button onClick={() => setConfirmDelete(null)}
                                    className="flex-1 py-2.5 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm">취소</button>
                                <button onClick={() => handleDeleteUser(confirmDelete)}
                                    disabled={actionLoading === confirmDelete}
                                    className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors text-sm flex items-center justify-center gap-1">
                                    {actionLoading === confirmDelete ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    삭제
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Order status change confirm */}
            <AnimatePresence>
                {confirmStatusChange && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${confirmStatusChange.newStatus === "shipped" ? "bg-blue-100" : "bg-red-100"}`}>
                                {confirmStatusChange.newStatus === "shipped"
                                    ? <Truck size={20} className="text-blue-600" />
                                    : <XCircle size={20} className="text-red-500" />}
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 mb-1">{confirmStatusChange.label}하시겠습니까?</h3>
                            <p className="text-xs text-slate-400 mb-4">
                                {confirmStatusChange.newStatus === "shipped" ? "배송 완료로 상태가 변경됩니다" : "주문이 취소됩니다"}
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => setConfirmStatusChange(null)}
                                    className="flex-1 py-2.5 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm">취소</button>
                                <button onClick={() => handleStatusUpdate(confirmStatusChange.orderId, confirmStatusChange.newStatus)}
                                    disabled={statusUpdateLoading === confirmStatusChange.orderId}
                                    className={`flex-1 py-2.5 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-1 ${confirmStatusChange.newStatus === "shipped"
                                        ? "bg-blue-600 hover:bg-blue-700"
                                        : "bg-red-500 hover:bg-red-600"}`}>
                                    {statusUpdateLoading === confirmStatusChange.orderId
                                        ? <Loader2 size={14} className="animate-spin" />
                                        : confirmStatusChange.newStatus === "shipped" ? <Truck size={14} /> : <XCircle size={14} />}
                                    확인
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
