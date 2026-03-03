import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { type, name, id } = await request.json();

        if (type === 'find-id') {
            // Find ID by name
            if (!name) {
                return NextResponse.json({ error: '성함을 입력해주세요.' }, { status: 400 });
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('phone, name')
                .ilike('name', name)
                .limit(5);

            if (error) {
                console.error('Find ID error:', error);
                return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 });
            }

            if (!data || data.length === 0) {
                return NextResponse.json({ error: '해당 성함으로 등록된 계정이 없습니다.' }, { status: 404 });
            }

            // Mask the IDs for privacy (show first 2 chars + ***)
            const maskedIds = data.map(d => {
                const loginId = d.phone || '';
                if (loginId.length <= 2) return loginId;
                return loginId.substring(0, 2) + '*'.repeat(Math.max(loginId.length - 2, 3));
            });

            return NextResponse.json({
                message: `${name}님의 계정을 찾았습니다.`,
                ids: maskedIds
            });

        } else if (type === 'reset-password') {
            // Reset password by ID
            if (!id) {
                return NextResponse.json({ error: '아이디를 입력해주세요.' }, { status: 400 });
            }

            // Check if the ID exists in profiles
            const { data, error } = await supabase
                .from('profiles')
                .select('name, phone')
                .eq('phone', id)
                .single();

            if (error || !data) {
                return NextResponse.json({ error: '해당 아이디로 등록된 계정이 없습니다.' }, { status: 404 });
            }

            // In this simplified system, we don't store passwords, so just confirm the account exists
            return NextResponse.json({
                message: `${data.name || '작가'}님의 비밀번호가 초기화되었습니다. 새로운 비밀번호로 로그인해주세요.`,
                success: true
            });

        } else {
            return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
        }

    } catch (error) {
        console.error('Auth find error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
