import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id as string;
    const postId = params.id;

    const { data: existing } = await supabase
        .from('community_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

    // Get current count
    const { data: post } = await supabase
        .from('community_posts')
        .select('like_count')
        .eq('id', postId)
        .single();

    const currentCount = post?.like_count ?? 0;

    if (existing) {
        await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', userId);
        await supabase.from('community_posts').update({ like_count: Math.max(0, currentCount - 1) }).eq('id', postId);
        return NextResponse.json({ liked: false, likeCount: Math.max(0, currentCount - 1) });
    } else {
        await supabase.from('community_likes').insert({ post_id: postId, user_id: userId });
        await supabase.from('community_posts').update({ like_count: currentCount + 1 }).eq('id', postId);
        return NextResponse.json({ liked: true, likeCount: currentCount + 1 });
    }
}
