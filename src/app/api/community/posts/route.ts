import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const cursor = searchParams.get('cursor');
    const limit = 20;

    let query = supabase
        .from('community_posts')
        .select('id, title, content, category, like_count, comment_count, bookmark_count, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (category && category !== '전체') query = query.eq('category', category);
    if (cursor) query = query.lt('created_at', cursor);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const posts = data || [];

    // Fetch author profiles
    const userIds = Array.from(new Set(posts.map((p: any) => p.user_id as string)));
    const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, name').in('id', userIds)
        : { data: [] };
    const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));

    // Check current user's likes/bookmarks
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    let likedIds = new Set<string>();
    let bookmarkedIds = new Set<string>();

    if (userId && posts.length > 0) {
        const postIds = posts.map((p: any) => p.id);
        const [likesRes, bookmarksRes] = await Promise.all([
            supabase.from('community_likes').select('post_id').eq('user_id', userId).in('post_id', postIds),
            supabase.from('community_bookmarks').select('post_id').eq('user_id', userId).in('post_id', postIds),
        ]);
        likedIds = new Set((likesRes.data || []).map((r: any) => r.post_id));
        bookmarkedIds = new Set((bookmarksRes.data || []).map((r: any) => r.post_id));
    }

    const result = posts.map((p: any) => ({
        ...p,
        author: profileMap[p.user_id] || { id: p.user_id, name: '익명' },
        isLiked: likedIds.has(p.id),
        isBookmarked: bookmarkedIds.has(p.id),
    }));

    return NextResponse.json({ posts: result, hasMore: posts.length === limit });
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id as string;
    const { title, content, category, projectId } = await req.json();

    if (!title?.trim() || !content?.trim() || !category) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('community_posts')
        .insert({ user_id: userId, project_id: projectId || null, title: title.trim(), content: content.trim(), category })
        .select('id')
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id });
}
