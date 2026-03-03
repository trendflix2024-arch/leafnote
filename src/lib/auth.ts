import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabase";
import type { NextAuthOptions } from "next-auth";
// SMS OTP verification removed as per user request

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
                id: { label: "ID", type: "text" },
                password: { label: "Password", type: "password" },
                name: { label: "Name", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.id || !credentials?.password) {
                    throw new Error("아이디와 비밀번호를 입력해주세요.");
                }

                // Simplified Auth: In this version, we accept the password as is.
                // For a real production app with security requirements, password hashing and checking would happen here.
                const userId = toUUID(credentials.id);
                const name = credentials.name || '작가님';

                return {
                    id: userId,
                    name: name,
                    email: `${credentials.id}@leafnote.ai`,
                    idPlain: credentials.id,
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
            const loginId = (user as any).idPlain || user.id;

            try {
                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        name: user.name || '작가님',
                        email: user.email || '',
                        phone: loginId, // Storing ID in the phone field for compatibility if needed, or we could add a new field
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
                token.loginId = (user as any).idPlain;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).loginId = token.loginId;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || "leafnote-staging-secret-1234567890",
    session: {
        strategy: "jwt",
        maxAge: 100 * 365 * 24 * 60 * 60, // 100 years = indefinite session
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
