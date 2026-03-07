import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

function isAdmin(email: string | null | undefined) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}

const PAGE_LABELS: Record<string, string> = {
    '/': '홈',
    '/dashboard': '대시보드',
    '/interview': '인터뷰',
    '/editor': '에디터',
    '/design': '표지 디자인',
    '/export': '내보내기',
    '/chat': '에코 채팅',
    '/profile': '프로필',
    '/settings': '설정',
    '/payment': '결제',
    '/payment/success': '결제 완료',
    '/pricing': '요금제',
    '/login': '로그인',
    '/onboarding': '온보딩',
    '/welcome': '웰컴',
    '/community': '커뮤니티',
};

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7');

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    // Fetch all page views in range
    const { data: views, error } = await supabase
        .from('page_views')
        .select('id, page, session_id, user_id, duration_seconds, entered_at, exited_at')
        .gte('entered_at', sinceISO)
        .order('entered_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!views) return NextResponse.json({ error: 'No data' }, { status: 500 });

    // --- 1. Total stats ---
    const totalViews = views.length;
    const uniqueSessions = new Set(views.map(v => v.session_id)).size;
    const uniqueUsers = new Set(views.filter(v => v.user_id).map(v => v.user_id)).size;
    const avgDuration = views.filter(v => v.duration_seconds > 0).length > 0
        ? Math.round(views.filter(v => v.duration_seconds > 0).reduce((s, v) => s + v.duration_seconds, 0) / views.filter(v => v.duration_seconds > 0).length)
        : 0;

    // --- 2. Views by hour (0~23) ---
    const byHour: number[] = Array(24).fill(0);
    views.forEach(v => {
        const h = new Date(v.entered_at).getHours();
        byHour[h]++;
    });

    // --- 3. Views by day of week (0=Sun ~ 6=Sat) ---
    const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
    const byDow: { label: string; count: number }[] = DOW_LABELS.map(label => ({ label, count: 0 }));
    views.forEach(v => {
        const d = new Date(v.entered_at).getDay();
        byDow[d].count++;
    });

    // --- 4. Views by date (daily trend) ---
    const byDateMap: Record<string, number> = {};
    const sessionByDate: Record<string, Set<string>> = {};
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        byDateMap[key] = 0;
        sessionByDate[key] = new Set();
    }
    views.forEach(v => {
        const key = v.entered_at.split('T')[0];
        if (byDateMap[key] !== undefined) {
            byDateMap[key]++;
            sessionByDate[key].add(v.session_id);
        }
    });
    const byDate = Object.entries(byDateMap).map(([date, views]) => ({
        date,
        views,
        sessions: sessionByDate[date]?.size || 0,
    }));

    // --- 5. Top pages ---
    const pageMap: Record<string, { views: number; totalDuration: number; durationCount: number }> = {};
    views.forEach(v => {
        const p = v.page || '/';
        if (!pageMap[p]) pageMap[p] = { views: 0, totalDuration: 0, durationCount: 0 };
        pageMap[p].views++;
        if (v.duration_seconds > 0) {
            pageMap[p].totalDuration += v.duration_seconds;
            pageMap[p].durationCount++;
        }
    });
    const topPages = Object.entries(pageMap)
        .map(([page, s]) => ({
            page,
            label: PAGE_LABELS[page] || page,
            views: s.views,
            avgDuration: s.durationCount > 0 ? Math.round(s.totalDuration / s.durationCount) : 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 15);

    // --- 6. Active users now (last 5 min) ---
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: activeNow } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('entered_at', fiveMinAgo)
        .is('exited_at', null);

    return NextResponse.json({
        summary: { totalViews, uniqueSessions, uniqueUsers, avgDuration, activeNow: activeNow || 0 },
        byHour,
        byDow,
        byDate,
        topPages,
    });
}
