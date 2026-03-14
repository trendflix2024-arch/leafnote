import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    const { data, error } = await supabase
        .from('community_comments')
        .select('id, content, created_at, user_id')
        .eq('post_id', params.id)
        .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const comments = data || [];
    const userIds = Array.from(new Set(comments.map((c: any) => c.user_id as string)));
    const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, name').in('id', userIds)
        : { data: [] };
    const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));

    return NextResponse.json({
        comments: comments.map((c: any) => ({
            ...c,
            author: profileMap[c.user_id] || { id: c.user_id, name: '익명' },
        })),
    });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id as string;
    const { content } = await req.json();

    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    const postId = params.id;

    const { data: comment, error } = await supabase
        .from('community_comments')
        .insert({ post_id: postId, user_id: userId, content: content.trim() })
        .select('id, content, created_at, user_id')
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: profile } = await supabase.from('profiles').select('id, name').eq('id', userId).maybeSingle();

    const { data: post } = await supabase.from('community_posts').select('comment_count').eq('id', postId).single();
    await supabase.from('community_posts').update({ comment_count: (post?.comment_count ?? 0) + 1 }).eq('id', postId);

    return NextResponse.json({ comment: { ...comment, author: profile || { id: userId, name: '익명' } } });
}
