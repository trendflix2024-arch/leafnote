import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const followerId = (session.user as any).id as string;
    const followingId = params.userId;

    if (followerId === followingId) {
        return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const { data: existing } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();

    if (existing) {
        await supabase.from('user_follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
        return NextResponse.json({ following: false });
    } else {
        await supabase.from('user_follows').insert({ follower_id: followerId, following_id: followingId });
        return NextResponse.json({ following: true });
    }
}
