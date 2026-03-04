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
                return NextResponse.json({ error: '조회 중 오류가 발생했습니다. 잠시 후 서버가 안정되면 다시 시도해주세요.' }, { status: 500 });
            }

            if (!data || data.length === 0) {
                return NextResponse.json({ error: '앗, 입력하신 성함으로 등록된 작가님을 찾을 수 없어요. 성함을 다시 한번 확인해주시겠어요?' }, { status: 404 });
            }

            // Mask the IDs for privacy (show first 2 chars + ***)
            const maskedIds = data.map(d => {
                const loginId = d.phone || '';
                if (loginId.length <= 2) return loginId;
                return loginId.substring(0, 2) + '*'.repeat(Math.max(loginId.length - 2, 3));
            });

            return NextResponse.json({
                message: `반갑습니다, ${name} 작가님!\n등록된 아이디는 아래와 같습니다.`,
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
                return NextResponse.json({ error: '앗, 입력하신 아이디로 등록된 계정을 찾을 수 없어요. 아이디를 정확하게 입력하셨는지 확인해주세요!' }, { status: 404 });
            }

            // Clear password in Supabase so the next login sets it anew
            const { error: resetError } = await supabase
                .from('profiles')
                .update({ password: null })
                .eq('phone', id);

            if (resetError) {
                console.error('Password reset error:', resetError);
                return NextResponse.json({ error: '비밀번호 초기화 중 문제가 발생했습니다. (서버 오류)' }, { status: 500 });
            }

            return NextResponse.json({
                message: `${data.name || '작가'}님의 비밀번호가 성공적으로 초기화되었습니다.\n이제 원하시는 '새로운 비밀번호'로 다시 로그인하시면, 해당 비밀번호가 영구적으로 새롭게 저장됩니다!`,
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
