import { NextResponse } from 'next/server';
import { generateOTP, sendSMS, storeOTP } from '@/lib/sms';

export async function POST(req: Request) {
    try {
        const { phone } = await req.json();

        if (!phone || phone.length < 10) {
            return NextResponse.json({ error: '유효한 휴대폰 번호를 입력해주세요.' }, { status: 400 });
        }

        const cleanPhone = phone.replace(/[^0-9]/g, '');

        // Use a fixed code for easy testing in development, random in production
        const code = process.env.NODE_ENV === 'production' ? generateOTP() : '123456';

        storeOTP(cleanPhone, code);

        console.log(`[OTP SENT] ${cleanPhone}: ${code}`);

        const success = await sendSMS(cleanPhone, `[리프노트] 인증번호는 [${code}] 입니다. 5분 내에 입력해주세요.`);

        if (!success) {
            return NextResponse.json({ error: '문자 발송에 실패했습니다. 다시 시도해주세요.' }, { status: 500 });
        }

        return NextResponse.json({ message: '인증번호가 발송되었습니다.' });
    } catch (error) {
        console.error('OTP Route Error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
