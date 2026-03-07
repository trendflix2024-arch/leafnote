"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Users, Eye, Clock, Activity, BarChart2,
    TrendingUp, Calendar, Loader2, RefreshCw, Monitor
} from 'lucide-react';

interface Summary {
    totalViews: number;
    uniqueSessions: number;
    uniqueUsers: number;
    avgDuration: number;
    activeNow: number;
}

interface DayData { date: string; views: number; sessions: number; }
interface PageData { page: string; label: string; views: number; avgDuration: number; }
interface DowData { label: string; count: number; }

interface AnalyticsData {
    summary: Summary;
    byHour: number[];
    byDow: DowData[];
    byDate: DayData[];
    topPages: PageData[];
}

const RANGE_OPTIONS = [
    { label: '오늘', days: 1 },
    { label: '7일', days: 7 },
    { label: '30일', days: 30 },
    { label: '90일', days: 90 },
];

function Bar({ value, max, color = 'bg-emerald-500' }: { value: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
    );
}

function StatCard({ icon, label, value, sub, color = 'text-emerald-600', bg = 'bg-emerald-50' }: {
    icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string; bg?: string;
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
                <span className="text-xs text-slate-500 font-medium">{label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </motion.div>
    );
}

function formatDuration(sec: number) {
    if (sec < 60) return `${sec}초`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function AnalyticsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [days, setDays] = useState(7);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (status === 'authenticated' && !adminEmails.includes(session?.user?.email || '')) {
            router.push('/dashboard');
        }
    }, [status, session]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/analytics?days=${days}`);
            if (res.status === 403) { router.push('/dashboard'); return; }
            const json = await res.json();
            setData(json);
            setLastRefresh(new Date());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => { if (status === 'authenticated') fetchData(); }, [status, fetchData]);

    if (status === 'loading' || (loading && !data)) {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-600" size={40} />
            </div>
        );
    }

    const maxHour = data ? Math.max(...data.byHour, 1) : 1;
    const maxDow = data ? Math.max(...data.byDow.map(d => d.count), 1) : 1;
    const maxDateViews = data ? Math.max(...data.byDate.map(d => d.views), 1) : 1;

    return (
        <div className="min-h-screen bg-[#faf9f6]">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-100">
                                <BarChart2 size={18} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-serif font-bold text-slate-800">접속자 통계</h1>
                                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Admin Dashboard</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 hidden sm:block">
                            {lastRefresh.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준
                        </span>
                        <button onClick={fetchData} disabled={loading}
                            className="p-2 hover:bg-slate-50 rounded-full text-slate-500 transition-colors disabled:opacity-50">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                {/* Range selector */}
                <div className="flex items-center gap-2">
                    {RANGE_OPTIONS.map(opt => (
                        <button key={opt.days} onClick={() => setDays(opt.days)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${days === opt.days
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Summary cards */}
                {data && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <StatCard icon={<Activity size={18} />} label="현재 접속자"
                            value={data.summary.activeNow} sub="최근 5분 이내"
                            color="text-red-500" bg="bg-red-50" />
                        <StatCard icon={<Eye size={18} />} label="총 페이지뷰"
                            value={data.summary.totalViews.toLocaleString()} sub={`최근 ${days}일`} />
                        <StatCard icon={<Users size={18} />} label="순 방문 세션"
                            value={data.summary.uniqueSessions.toLocaleString()} sub="브라우저 단위"
                            color="text-blue-600" bg="bg-blue-50" />
                        <StatCard icon={<Monitor size={18} />} label="로그인 사용자"
                            value={data.summary.uniqueUsers.toLocaleString()} sub="회원 방문"
                            color="text-amber-600" bg="bg-amber-50" />
                        <StatCard icon={<Clock size={18} />} label="평균 체류시간"
                            value={formatDuration(data.summary.avgDuration)} sub="페이지당"
                            color="text-purple-600" bg="bg-purple-50" />
                    </div>
                )}

                {data && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Daily trend */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={16} className="text-purple-600" />
                                <h2 className="font-bold text-slate-700 text-sm">일별 방문 추이</h2>
                            </div>
                            <div className="space-y-2">
                                {data.byDate.map((d, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400 w-10 shrink-0 text-right">{formatDate(d.date)}</span>
                                        <div className="flex-1">
                                            <Bar value={d.views} max={maxDateViews} color="bg-purple-400" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 w-10 text-right">{d.views}</span>
                                        <span className="text-xs text-slate-400 w-14 text-right hidden sm:block">{d.sessions}세션</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top pages */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart2 size={16} className="text-emerald-600" />
                                <h2 className="font-bold text-slate-700 text-sm">인기 페이지</h2>
                            </div>
                            <div className="space-y-3">
                                {data.topPages.slice(0, 10).map((p, i) => {
                                    const maxViews = Math.max(...data.topPages.map(x => x.views), 1);
                                    return (
                                        <div key={i} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-slate-700 truncate max-w-[160px]">
                                                    <span className="text-slate-400 mr-1">#{i + 1}</span>
                                                    {p.label}
                                                    <span className="text-slate-300 ml-1 text-[10px]">{p.page}</span>
                                                </span>
                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                    <span className="font-bold text-slate-700">{p.views}회</span>
                                                    {p.avgDuration > 0 && (
                                                        <span className="text-slate-400">{formatDuration(p.avgDuration)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Bar value={p.views} max={maxViews} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* By hour */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock size={16} className="text-blue-600" />
                                <h2 className="font-bold text-slate-700 text-sm">시간대별 접속</h2>
                            </div>
                            <div className="flex items-end gap-1 h-24">
                                {data.byHour.map((count, h) => {
                                    const pct = maxHour > 0 ? (count / maxHour) : 0;
                                    const isNight = h < 6 || h >= 22;
                                    const isMorning = h >= 6 && h < 12;
                                    const isAfternoon = h >= 12 && h < 18;
                                    const color = isNight ? 'bg-slate-400' : isMorning ? 'bg-amber-400' : isAfternoon ? 'bg-emerald-500' : 'bg-blue-400';
                                    return (
                                        <div key={h} className="flex-1 flex flex-col items-center gap-1 group relative">
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                {h}시 {count}회
                                            </div>
                                            <div className={`w-full ${color} rounded-t transition-all`}
                                                style={{ height: `${Math.max(pct * 80, count > 0 ? 4 : 0)}px` }} />
                                            {h % 3 === 0 && (
                                                <span className="text-[9px] text-slate-400">{h}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />새벽(0-5)</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />오전(6-11)</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />오후(12-17)</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />저녁(18-21)</span>
                            </div>
                        </div>

                        {/* By day of week */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar size={16} className="text-amber-600" />
                                <h2 className="font-bold text-slate-700 text-sm">요일별 접속</h2>
                            </div>
                            <div className="space-y-3">
                                {data.byDow.map((d, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className={`text-xs font-bold w-5 shrink-0 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-600'}`}>
                                            {d.label}
                                        </span>
                                        <div className="flex-1">
                                            <Bar value={d.count} max={maxDow}
                                                color={i === 0 ? 'bg-red-400' : i === 6 ? 'bg-blue-400' : 'bg-amber-400'} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 w-10 text-right">{d.count}회</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Admin links */}
                <div className="flex gap-3 pt-2 pb-8">
                    <Link href="/admin/coupons" className="text-xs text-purple-600 hover:underline">쿠폰 관리 →</Link>
                    <Link href="/admin/feedback" className="text-xs text-purple-600 hover:underline">피드백 관리 →</Link>
                </div>
            </main>
        </div>
    );
}
