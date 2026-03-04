import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabase";
import type { NextAuthOptions } from "next-auth";

// Helper for deterministic UUID generation from ANY string
// Handles: numeric Google IDs, Korean text IDs, alphanumeric IDs
function toUUID(id: string): string {
    // Already a valid UUID → return as-is
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return id;

    // For numeric-only strings (phone numbers, Google IDs), use legacy zero-padding
    const digits = id.replace(/[^0-9]/g, '');
    if (digits.length > 0 && digits.length === id.length) {
        const padded = digits.padStart(32, '0').slice(-32);
        return `${padded.slice(0, 8)}-${padded.slice(8, 12)}-${padded.slice(12, 16)}-${padded.slice(16, 20)}-${padded.slice(20, 32)}`;
    }

    // For ANY other string (Korean, alphanumeric, mixed): character-code hashing
    // Generates 32 hex chars deterministically from the string
    let hex = '';
    for (let round = 0; hex.length < 32; round++) {
        let h = 0x811c9dc5 + round; // FNV offset + round salt
        for (let i = 0; i < id.length; i++) {
            h ^= id.charCodeAt(i);
            h = Math.imul(h, 0x01000193); // FNV prime
        }
        hex += (h >>> 0).toString(16).padStart(8, '0');
    }
    hex = hex.slice(0, 32);
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
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

                // CRITICAL: Convert to UUID here so profile lookup matches what signIn stores
                const userId = toUUID(credentials.id);
                const name = credentials.name || '작가님';
                const inputPassword = credentials.password;

                try {
                    // Fetch existing user by UUID
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('password')
                        .eq('id', userId)
                        .maybeSingle();

                    if (error) {
                        console.error('Auth verification query error:', error);
                        throw new Error("서버와의 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.");
                    }

                    if (!profile) {
                        // Profile does not exist at all
                        throw new Error("등록되지 않은 아이디이거나, 비밀번호가 일치하지 않습니다.");
                    }

                    // Profile exists, check password
                    if (profile.password && profile.password !== inputPassword) {
                        throw new Error("등록되지 않은 아이디이거나, 비밀번호가 일치하지 않습니다.");
                    } else if (!profile.password) {
                        // Profile exists but password was never set
                        // Allow this one time and the signIn callback will set it.
                    }

                    return {
                        id: userId,
                        name: name,
                        email: `${credentials.id}@leafnote.ai`,
                        idPlain: credentials.id,
                        password: inputPassword
                    };

                } catch (err: any) {
                    console.error('Login Authorization failed:', err.message);
                    throw err;
                }
            },
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async signIn({ user, account }) {
            if (!user?.id) return true;

            const userId = toUUID(user.id);
            const loginId = (user as any).idPlain || user.id;
            const password = (user as any).password;

            try {
                const payload: any = {
                    id: userId,
                    name: user.name || '작가님',
                    email: user.email || '',
                    phone: loginId,
                    updated_at: new Date().toISOString(),
                };

                // Only set password if it was passed through from credentials authorize
                if (password) {
                    payload.password = password;
                }

                const { error } = await supabase
                    .from('profiles')
                    .upsert(payload, { onConflict: 'id' });

                if (error) console.error('Supabase signIn sync error:', error);
            } catch (err) {
                console.error('Supabase sync exception:', err);
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = toUUID(user.id);
                token.loginId = (user as any).idPlain || user.id;
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
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 100 * 365 * 24 * 60 * 60, // 100 years
    },
    // Removed explicit cookies block to let NextAuth handle it based on NEXTAUTH_URL
    debug: process.env.NODE_ENV === "development",
};
