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
    const { paymentKey, orderId, amount, plan } = await req.json();

    if (!paymentKey || !orderId || !amount || !plan) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
        return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }

    // 1. Toss Payments 서버에 결제 확인
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    if (!tossRes.ok) {
        const err = await tossRes.json();
        console.error('Toss confirm error:', err);
        return NextResponse.json({ error: err.message || '결제 확인 실패' }, { status: 400 });
    }

    const tossData = await tossRes.json();

    // 2. 구독 만료일 계산
    const now = new Date();
    const expiresAt = new Date(now);
    if (plan === 'monthly') {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (plan === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    // 3. Supabase에 구독 저장
    const { error } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        toss_order_id: orderId,
        toss_payment_key: paymentKey,
        amount,
    }, { onConflict: 'user_id' });

    if (error) {
        console.error('Subscription save error:', error);
        return NextResponse.json({ error: '구독 저장 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString() });
}
