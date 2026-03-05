import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ plan: 'free', isPremium: false, interviewCount: 0, draftCount: 0 });
    }

    const userId = (session.user as any).id as string;

    // 구독 정보 조회
    const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, status, expires_at')
        .eq('user_id', userId)
        .maybeSingle();

    // 사용량 조회
    const { data: usage } = await supabase
        .from('usage_stats')
        .select('interview_count, draft_count')
        .eq('user_id', userId)
        .maybeSingle();

    const now = new Date();
    const isActive = sub?.status === 'active' && sub?.expires_at && new Date(sub.expires_at) > now;
    const isPremium = isActive && (sub?.plan === 'monthly' || sub?.plan === 'yearly');

    return NextResponse.json({
        plan: isPremium ? sub!.plan : 'free',
        isPremium,
        expiresAt: sub?.expires_at || null,
        interviewCount: usage?.interview_count || 0,
        draftCount: usage?.draft_count || 0,
    });
}
