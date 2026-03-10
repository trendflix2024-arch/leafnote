import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { userId, imageBase64, imageType } = await req.json();

        if (!userId || !imageBase64) {
            return NextResponse.json({ error: '필수 데이터가 누락되었습니다.' }, { status: 400 });
        }

        // Get user info for filename
        const { data: user, error: userError } = await supabase
            .from('magic_frame_users')
            .select('name, phone, submitted')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        }

        if (user.submitted) {
            return NextResponse.json({ error: '이미 제출된 사용자입니다.' }, { status: 400 });
        }

        // Decode base64
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `${user.name}_${user.phone}.jpg`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('magic-frame')
            .upload(filename, buffer, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ error: '이미지 업로드에 실패했습니다.' }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('magic-frame')
            .getPublicUrl(filename);

        const publicUrl = urlData.publicUrl;

        // Update user record
        const { error: updateError } = await supabase
            .from('magic_frame_users')
            .update({
                submitted: true,
                image_url: publicUrl,
                image_type: imageType || 'single',
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (updateError) {
            return NextResponse.json({ error: '데이터 업데이트에 실패했습니다.' }, { status: 500 });
        }

        return NextResponse.json({ success: true, imageUrl: publicUrl });
    } catch (e: any) {
        console.error('Upload route error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
