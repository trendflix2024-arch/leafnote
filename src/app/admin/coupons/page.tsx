"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Copy, RefreshCw, Tag, Users, Clock, Infinity, ArrowLeft, Search, Check, X, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Coupon {
    id: string;
    code: string;
    duration_months: number;
    max_uses: number | null;
    used_count: number;
    created_at: string;
    coupon_redemptions: { count: number }[];
}

type FilterTab = 'all' | 'active' | 'exhausted';

export default function AdminCouponsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ code: '', duration_months: '1', max_uses: '' });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [copied, setCopied] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [filterTab, setFilterTab] = useState<FilterTab>('all');
    const [successMsg, setSuccessMsg] = useState('');

    const fetchCoupons = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/coupons');
            if (res.status === 403) { router.push('/dashboard'); return; }
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setCoupons(data.coupons || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        if (status === 'loading') return;
        if (!session?.user) { router.push('/login'); return; }
        fetchCoupons();
    }, [session, status, fetchCoupons, router]);

    const handleCreate = async () => {
        setFormError('');
        if (!form.code.trim()) { setFormError('쿠폰 코드를 입력하세요.'); return; }
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: form.code,
                    duration_months: Number(form.duration_months),
                    max_uses: form.max_uses ? Number(form.max_uses) : null,
                }),
            });
            const data = await res.json();
            if (data.error) { setFormError(data.error); return; }
            setForm({ code: '', duration_months: '1', max_uses: '' });
            setShowForm(false);
            setSuccessMsg(`'${form.code.toUpperCase()}' 쿠폰이 발급되었습니다!`);
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchCoupons();
        } catch {
            setFormError('네트워크 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        await fetch('/api/admin/coupons', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        setPendingDeleteId(null);
        setDeletingId(null);
        fetchCoupons();
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(null), 1500);
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        setForm(f => ({ ...f, code }));
    };

    const filtered = coupons
        .filter(c => {
            if (filterTab === 'active') return c.max_uses === null || c.used_count < c.max_uses;
            if (filterTab === 'exhausted') return c.max_uses !== null && c.used_count >= c.max_uses;
            return true;
        })
        .filter(c => !search || c.code.includes(search.toUpperCase()));

    const stats = {
        total: coupons.length,
        used: coupons.reduce((s, c) => s + c.used_count, 0),
        active: coupons.filter(c => c.max_uses === null || c.used_count < c.max_uses).length,
        exhausted: coupons.filter(c => c.max_uses !== null && c.used_count >= c.max_uses).length,
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
                <RefreshCw className="animate-spin text-purple-500" size={28} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf9f6]">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-20">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-100">
                                <Tag size={17} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold font-serif text-slate-800">쿠폰 관리</h1>
                                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Admin</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchCoupons} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors" title="새로고침">
                            <RefreshCw size={16} />
                        </button>
                        <button
                            onClick={() => { setShowForm(v => !v); setFormError(''); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-full hover:bg-purple-700 transition-colors shadow-md shadow-purple-100"
                        >
                            <Plus size={15} /> 쿠폰 발급
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
                {/* Toast */}
                <AnimatePresence>
                    {successMsg && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-2xl px-5 py-3 flex items-center gap-2">
                            <Check size={16} /> {successMsg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            className="bg-white border border-purple-100 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Zap size={14} className="text-purple-500" /> 새 쿠폰 발급</h2>
                                <button onClick={() => { setShowForm(false); setFormError(''); }} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={16} /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-slate-500 mb-1.5 block">쿠폰 코드</label>
                                    <div className="flex gap-1.5">
                                        <input
                                            value={form.code}
                                            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                            placeholder="SUMMER2026"
                                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-purple-300 outline-none uppercase"
                                        />
                                        <button onClick={generateCode} title="랜덤 생성"
                                            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors text-xs font-bold">
                                            랜덤
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 mb-1.5 block">구독 기간</label>
                                    <select value={form.duration_months}
                                        onChange={e => setForm(f => ({ ...f, duration_months: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-300 outline-none">
                                        {[1, 2, 3, 6, 12].map(m => <option key={m} value={m}>{m}개월</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 mb-1.5 block">최대 사용 횟수 <span className="text-slate-400 font-normal">(비워두면 무제한)</span></label>
                                    <input value={form.max_uses}
                                        onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                                        type="number" min="1" placeholder="무제한"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-300 outline-none" />
                                </div>
                            </div>
                            {formError && <p className="text-red-500 text-xs mt-3 flex items-center gap-1"><AlertTriangle size={12} /> {formError}</p>}
                            <div className="flex gap-2 mt-4 justify-end">
                                <button onClick={() => { setShowForm(false); setFormError(''); }}
                                    className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">취소</button>
                                <button onClick={handleCreate} disabled={isSubmitting}
                                    className="px-5 py-2 bg-purple-600 text-white text-sm font-bold rounded-full hover:bg-purple-700 disabled:opacity-50 transition-colors">
                                    {isSubmitting ? '발급 중...' : '발급하기'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {error && <div className="bg-red-50 text-red-600 text-sm rounded-2xl p-4">{error}</div>}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: '전체 쿠폰', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-50', icon: Tag },
                        { label: '총 사용 횟수', value: stats.used, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
                        { label: '활성 쿠폰', value: stats.active, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Check },
                        { label: '소진 쿠폰', value: stats.exhausted, color: 'text-slate-400', bg: 'bg-slate-50', icon: Clock },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                                <s.icon size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">{s.label}</p>
                                <p className="text-xl font-bold text-slate-800">{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="쿠폰 코드 검색..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-purple-300 outline-none bg-white" />
                    </div>
                    <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
                        {([['all', '전체'], ['active', '활성'], ['exhausted', '소진']] as const).map(([val, label]) => (
                            <button key={val} onClick={() => setFilterTab(val)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterTab === val ? 'bg-purple-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Coupon list */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80">
                                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">코드</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">기간</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">사용 / 한도</th>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">발급일</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">쿠폰이 없습니다</td></tr>
                                ) : filtered.map((coupon, i) => {
                                    const isExhausted = coupon.max_uses !== null && coupon.used_count >= coupon.max_uses;
                                    const usageRate = coupon.max_uses ? (coupon.used_count / coupon.max_uses) * 100 : 0;
                                    const isConfirming = pendingDeleteId === coupon.id;
                                    return (
                                        <motion.tr key={coupon.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.02 }}
                                            className={`border-b border-slate-50 transition-colors ${isExhausted ? 'bg-slate-50/50' : 'hover:bg-slate-50/40'}`}>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-mono font-bold tracking-wider ${isExhausted ? 'text-slate-400' : 'text-slate-800'}`}>
                                                        {coupon.code}
                                                    </span>
                                                    <button onClick={() => copyCode(coupon.code)}
                                                        className="text-slate-300 hover:text-purple-400 transition-colors" title="복사">
                                                        {copied === coupon.code ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                                    </button>
                                                    {isExhausted
                                                        ? <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-medium">소진</span>
                                                        : <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">활성</span>
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600 text-sm">{coupon.duration_months}개월</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-700">{coupon.used_count}</span>
                                                    <span className="text-slate-300">/</span>
                                                    {coupon.max_uses === null
                                                        ? <Infinity size={13} className="text-slate-400" />
                                                        : <span className="text-slate-500">{coupon.max_uses}</span>}
                                                    {coupon.max_uses && (
                                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all ${usageRate >= 100 ? 'bg-red-400' : usageRate >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                                style={{ width: `${Math.min(usageRate, 100)}%` }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-400 text-xs">
                                                {new Date(coupon.created_at).toLocaleDateString('ko-KR')}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <AnimatePresence mode="wait">
                                                    {isConfirming ? (
                                                        <motion.div key="confirm" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                                            className="flex items-center gap-1 justify-end">
                                                            <span className="text-xs text-slate-500 mr-1">삭제할까요?</span>
                                                            <button onClick={() => handleDelete(coupon.id)} disabled={deletingId === coupon.id}
                                                                className="px-2.5 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold disabled:opacity-50">
                                                                {deletingId === coupon.id ? '삭제 중' : '삭제'}
                                                            </button>
                                                            <button onClick={() => setPendingDeleteId(null)}
                                                                className="px-2.5 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                                                                취소
                                                            </button>
                                                        </motion.div>
                                                    ) : (
                                                        <motion.button key="delete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                            onClick={() => setPendingDeleteId(coupon.id)}
                                                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                                                            <Trash2 size={14} />
                                                        </motion.button>
                                                    )}
                                                </AnimatePresence>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile card list */}
                    <div className="sm:hidden divide-y divide-slate-50">
                        {filtered.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">쿠폰이 없습니다</div>
                        ) : filtered.map(coupon => {
                            const isExhausted = coupon.max_uses !== null && coupon.used_count >= coupon.max_uses;
                            const usageRate = coupon.max_uses ? (coupon.used_count / coupon.max_uses) * 100 : 0;
                            const isConfirming = pendingDeleteId === coupon.id;
                            return (
                                <div key={coupon.id} className={`p-4 ${isExhausted ? 'opacity-60' : ''}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-slate-800 tracking-wider text-base">{coupon.code}</span>
                                            <button onClick={() => copyCode(coupon.code)} className="text-slate-300 hover:text-purple-400">
                                                {copied === coupon.code ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                                            </button>
                                        </div>
                                        {isExhausted
                                            ? <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-medium">소진</span>
                                            : <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">활성</span>
                                        }
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                                        <span>{coupon.duration_months}개월</span>
                                        <span>사용 {coupon.used_count} / {coupon.max_uses ?? '∞'}</span>
                                        <span>{new Date(coupon.created_at).toLocaleDateString('ko-KR')}</span>
                                    </div>
                                    {coupon.max_uses && (
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                                            <div className={`h-full rounded-full ${usageRate >= 100 ? 'bg-red-400' : usageRate >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                style={{ width: `${Math.min(usageRate, 100)}%` }} />
                                        </div>
                                    )}
                                    {isConfirming ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">정말 삭제할까요?</span>
                                            <button onClick={() => handleDelete(coupon.id)} disabled={deletingId === coupon.id}
                                                className="px-3 py-1 text-xs bg-red-500 text-white rounded-lg font-bold">삭제</button>
                                            <button onClick={() => setPendingDeleteId(null)}
                                                className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg">취소</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setPendingDeleteId(coupon.id)}
                                            className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors">
                                            <Trash2 size={12} /> 삭제
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
