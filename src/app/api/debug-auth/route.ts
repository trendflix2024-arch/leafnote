import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET() {
    return NextResponse.json({
        ok: true,
        message: 'Debug Auth endpoint reachable via GET.',
        env: {
            NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
            VERCEL_URL: process.env.VERCEL_URL || 'not set',
            HAS_SECRET: !!process.env.NEXTAUTH_SECRET
        }
    });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const credentialsProvider = authOptions.providers.find(p => p.id === 'credentials');

        if (!credentialsProvider || !('authorize' in credentialsProvider)) {
            return NextResponse.json({ error: 'Credentials provider not found' }, { status: 404 });
        }

        const user = await credentialsProvider.authorize(body, {} as any);

        return NextResponse.json({
            user,
            hasUser: !!user,
            secret_used: authOptions.secret?.substring(0, 5) + '...',
            strategy: authOptions.session?.strategy
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
