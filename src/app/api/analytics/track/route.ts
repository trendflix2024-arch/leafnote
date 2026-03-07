import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const body = await req.json();
        const { action, page, sessionId, viewId, duration } = body;

        if (!action || !sessionId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get user_id from profiles table if logged in
        let userId: string | null = null;
        if (session?.user?.email) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', session.user.email)
                .single();
            userId = profile?.id || null;
        }

        if (action === 'enter') {
            const { data, error } = await supabase
                .from('page_views')
                .insert({
                    page: page || '/',
                    session_id: sessionId,
                    user_id: userId,
                    referrer: req.headers.get('referer') || null,
                })
                .select('id')
                .single();

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ viewId: data.id });
        }

        if (action === 'exit' && viewId) {
            await supabase
                .from('page_views')
                .update({
                    exited_at: new Date().toISOString(),
                    duration_seconds: duration || 0,
                })
                .eq('id', viewId);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
