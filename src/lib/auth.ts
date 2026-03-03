import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabase";
import type { NextAuthOptions } from "next-auth";
import { verifyOTP } from "@/lib/sms";

// Helper for deterministic UUID generation from numeric strings (phone, google id)
function toUUID(id: string): string {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return id;
    const clean = id.replace(/[^0-9]/g, '');
    const padded = clean.padStart(32, '0').slice(-32);
    return `${padded.slice(0, 8)}-${padded.slice(8, 12)}-${padded.slice(12, 16)}-${padded.slice(16, 20)}-${padded.slice(20, 32)}`;
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                phone: { label: "Phone Number", type: "text" },
                code: { label: "Verification Code", type: "text" },
                name: { label: "Name", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.phone || !credentials?.code) {
                    throw new Error("인증 정보가 부족합니다.");
                }

                const phone = credentials.phone.replace(/[^0-9]/g, '');

                // Verify OTP
                const isValid = verifyOTP(phone, credentials.code);

                if (!isValid) {
                    throw new Error("인증번호가 일치하지 않거나 만료되었습니다.");
                }

                const userId = toUUID(phone);
                const name = credentials.name || '작가님';

                return {
                    id: userId,
                    name: name,
                    email: `${phone}@leafnote.ai`,
                    phone: phone,
                };
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async signIn({ user, account }) {
            console.log('SignIn callback triggered for:', user?.id, 'Account type:', account?.provider);
            if (!user?.id) return true;

            const userId = toUUID(user.id);
            const phone = (user as any).phone || (user.id.length < 15 ? user.id : '');

            try {
                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        name: user.name || '작가님',
                        email: user.email || '',
                        phone: phone,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'id' });

                if (error) {
                    console.error('Supabase sync error:', error);
                }
            } catch (err) {
                console.error('Supabase sync exception:', err);
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.phone = (user as any).phone;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).phone = token.phone;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || "leafnote-staging-secret-1234567890",
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days default
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: true,
            },
        },
    },
    debug: true,
};
