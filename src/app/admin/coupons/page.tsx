"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Copy, RefreshCw, Tag, Users, Clock, Infinity } from 'lucide-react';
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

export default function AdminCouponsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // 신규 쿠폰 폼
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ code: '', duration_months: '1', max_uses: '' });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [copied, setCopied] = useState<string | null>(null);

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
            fetchCoupons();
        } catch {
            setFormError('네트워크 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`'${code}' 쿠폰을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
        await fetch('/api/admin/coupons', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        fetchCoupons();
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(code);
        setTimeout(() => setCopied(null), 1500);
    };

    // 랜덤 코드 생성
    const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        setForm(f => ({ ...f, code }));
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <RefreshCw className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-4xl mx-auto px-4 py-10">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Tag size={22} className="text-emerald-600" />
                            쿠폰 관리
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">쿠폰을 발급하고 사용 현황을 확인합니다</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchCoupons} className="p-2 rounded-lg hover:bg-slate-200 transition-colors" title="새로고침">
                            <RefreshCw size={16} className="text-slate-500" />
                        </button>
                        <button
                            onClick={() => setShowForm(v => !v)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                            <Plus size={16} />
                            쿠폰 발급
                        </button>
                    </div>
                </div>

                {/* 신규 쿠폰 폼 */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white border border-emerald-100 rounded-2xl p-6 mb-6 shadow-sm"
                        >
                            <h2 className="text-base font-bold text-slate-700 mb-4">새 쿠폰 발급</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-1">
                                    <label className="text-xs font-medium text-slate-500 mb-1 block">쿠폰 코드</label>
                                    <div className="flex gap-1.5">
                                        <input
                                            value={form.code}
                                            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                            placeholder="SUMMER2026"
                                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-emerald-400 outline-none uppercase"
                                        />
                                        <button onClick={generateCode} className="px-2 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs text-slate-500 transition-colors" title="랜덤 생성">
                                            🎲
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 mb-1 block">구독 기간 (개월)</label>
                                    <select
                                        value={form.duration_months}
                                        onChange={e => setForm(f => ({ ...f, duration_months: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                                    >
                                        {[1, 2, 3, 6, 12].map(m => (
                                            <option key={m} value={m}>{m}개월</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 mb-1 block">최대 사용 횟수 (빈칸 = 무제한)</label>
                                    <input
                                        value={form.max_uses}
                                        onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                                        type="number"
                                        min="1"
                                        placeholder="무제한"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                                    />
                                </div>
                            </div>
                            {formError && <p className="text-red-500 text-xs mt-3">{formError}</p>}
                            <div className="flex gap-2 mt-4 justify-end">
                                <button onClick={() => { setShowForm(false); setFormError(''); }} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                                    취소
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={isSubmitting}
                                    className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                >
                                    {isSubmitting ? '발급 중...' : '발급'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 오류 */}
                {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-4 mb-6">{error}</div>}

                {/* 요약 카드 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: '총 쿠폰', value: coupons.length, icon: Tag, color: 'text-emerald-600 bg-emerald-50' },
                        { label: '총 사용 횟수', value: coupons.reduce((s, c) => s + c.used_count, 0), icon: Users, color: 'text-blue-600 bg-blue-50' },
                        { label: '활성 쿠폰', value: coupons.filter(c => c.max_uses === null || c.used_count < c.max_uses).length, icon: Clock, color: 'text-amber-600 bg-amber-50' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                                <stat.icon size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">{stat.label}</p>
                                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 쿠폰 테이블 */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">코드</th>
                                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">기간</th>
                                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">사용 / 한도</th>
                                <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">발급일</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-400">
                                        발급된 쿠폰이 없습니다
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon, i) => {
                                    const isExhausted = coupon.max_uses !== null && coupon.used_count >= coupon.max_uses;
                                    const usageRate = coupon.max_uses ? (coupon.used_count / coupon.max_uses) * 100 : 0;
                                    return (
                                        <motion.tr
                                            key={coupon.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.03 }}
                                            className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${isExhausted ? 'opacity-50' : ''}`}
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-slate-800 tracking-wider">{coupon.code}</span>
                                                    <button
                                                        onClick={() => copyCode(coupon.code)}
                                                        className="text-slate-300 hover:text-slate-500 transition-colors"
                                                        title="복사"
                                                    >
                                                        {copied === coupon.code ? <span className="text-xs text-emerald-500">✓</span> : <Copy size={12} />}
                                                    </button>
                                                    {isExhausted && <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">소진</span>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600">{coupon.duration_months}개월</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-700">{coupon.used_count}</span>
                                                    <span className="text-slate-300">/</span>
                                                    {coupon.max_uses === null
                                                        ? <Infinity size={14} className="text-slate-400" />
                                                        : <span className="text-slate-500">{coupon.max_uses}</span>
                                                    }
                                                    {coupon.max_uses && (
                                                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-1">
                                                            <div
                                                                className={`h-full rounded-full ${usageRate >= 100 ? 'bg-red-400' : usageRate >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                                style={{ width: `${Math.min(usageRate, 100)}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-400 text-xs">
                                                {new Date(coupon.created_at).toLocaleDateString('ko-KR')}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    onClick={() => handleDelete(coupon.id, coupon.code)}
                                                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                                                    title="삭제"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
