import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
        return NextResponse.json({ error: '쿠폰 코드를 입력해주세요.' }, { status: 400 });
    }

    // 1. 쿠폰 조회
    const { data: coupon } = await supabase
        .from('coupons')
        .select('id, duration_months, max_uses, used_count')
        .eq('code', code.trim().toUpperCase())
        .maybeSingle();

    if (!coupon) {
        return NextResponse.json({ error: 'COUPON_NOT_FOUND' }, { status: 404 });
    }

    // 2. 최대 사용 횟수 체크
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
        return NextResponse.json({ error: 'COUPON_EXHAUSTED' }, { status: 409 });
    }

    // 3. 중복 사용 체크
    const { data: existing } = await supabase
        .from('coupon_redemptions')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId)
        .maybeSingle();

    if (existing) {
        return NextResponse.json({ error: 'COUPON_ALREADY_USED' }, { status: 409 });
    }

    // 4. 구독 만료일 계산 (현재 구독 남은 기간이 있으면 연장)
    const { data: currentSub } = await supabase
        .from('subscriptions')
        .select('expires_at, status')
        .eq('user_id', userId)
        .maybeSingle();

    const now = new Date();
    const currentExpiry = currentSub?.status === 'active' && currentSub?.expires_at
        ? new Date(currentSub.expires_at)
        : null;

    // 유효한 구독이 남아있으면 거기서 연장, 아니면 지금부터
    const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const expiresAt = new Date(baseDate);
    expiresAt.setMonth(expiresAt.getMonth() + coupon.duration_months);

    // 5. 구독 upsert
    const { error: subError } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan: 'monthly',
        status: 'active',
        expires_at: expiresAt.toISOString(),
    }, { onConflict: 'user_id' });

    if (subError) {
        console.error('Coupon subscription upsert error:', subError);
        return NextResponse.json({ error: '구독 처리 실패' }, { status: 500 });
    }

    // 6. redemption 기록
    await supabase.from('coupon_redemptions').insert({
        coupon_id: coupon.id,
        user_id: userId,
    });

    // 7. used_count 증가
    await supabase
        .from('coupons')
        .update({ used_count: coupon.used_count + 1 })
        .eq('id', coupon.id);

    return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString() });
}
