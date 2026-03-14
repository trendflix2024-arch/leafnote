import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const { data: post, error } = await supabase
        .from('community_posts')
        .select('id, title, content, category, like_count, comment_count, bookmark_count, created_at, user_id')
        .eq('id', params.id)
        .single();

    if (error || !post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', post.user_id)
        .maybeSingle();

    let isLiked = false;
    let isBookmarked = false;
    let isFollowing = false;

    if (userId) {
        const [likeRes, bookmarkRes, followRes] = await Promise.all([
            supabase.from('community_likes').select('post_id').eq('post_id', params.id).eq('user_id', userId).maybeSingle(),
            supabase.from('community_bookmarks').select('post_id').eq('post_id', params.id).eq('user_id', userId).maybeSingle(),
            supabase.from('user_follows').select('follower_id').eq('follower_id', userId).eq('following_id', post.user_id).maybeSingle(),
        ]);
        isLiked = !!likeRes.data;
        isBookmarked = !!bookmarkRes.data;
        isFollowing = !!followRes.data;
    }

    return NextResponse.json({
        ...post,
        author: profile || { id: post.user_id, name: '익명' },
        isLiked,
        isBookmarked,
        isFollowing,
        isOwner: userId === post.user_id,
    });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id as string;

    // Verify ownership
    const { data: post } = await supabase
        .from('community_posts')
        .select('user_id')
        .eq('id', params.id)
        .single();

    if (!post || post.user_id !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase.from('community_posts').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
