import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

function isAdmin(email: string | null | undefined) {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: coupons, error } = await supabase
        .from('coupons')
        .select('*, coupon_redemptions(count)')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { code, duration_months, max_uses } = await req.json();

    if (!code || !duration_months) {
        return NextResponse.json({ error: '코드와 기간은 필수입니다.' }, { status: 400 });
    }

    const { data, error } = await supabase.from('coupons').insert({
        code: String(code).trim().toUpperCase(),
        duration_months: Number(duration_months),
        max_uses: max_uses ? Number(max_uses) : null,
    }).select().single();

    if (error) {
        const msg = error.code === '23505' ? '이미 존재하는 쿠폰 코드입니다.' : error.message;
        return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ coupon: data });
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user?.email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await req.json();
    const { error } = await supabase.from('coupons').delete().eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
