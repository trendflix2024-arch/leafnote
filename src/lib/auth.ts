import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabase";
import type { NextAuthOptions } from "next-auth";
// SMS OTP verification removed as per user request

// Helper for deterministic UUID generation from numeric strings (phone, google id)
// Helper for deterministic UUID generation
function toUUID(id: string): string {
    // If already a UUID, return as is
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return id;

    // Deterministic hashing for any string to UUID format
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    const hex = Math.abs(hash).toString(16).padStart(32, '0');
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

                const userId = toUUID(credentials.id);
                const name = credentials.name || '작가님';
                const inputPassword = credentials.password;

                try {
                    // Try to fetch existing user
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('password')
                        .eq('id', userId)
                        .maybeSingle();

                    if (error && error.code !== 'PGRST116') {
                        console.error('Auth check error:', error);
                        throw new Error("서버 오류가 발생했습니다.");
                    }

                    if (profile) {
                        // User exists, verify password
                        if (profile.password && profile.password !== inputPassword) {
                            throw new Error("비밀번호가 일치하지 않습니다.");
                        } else if (!profile.password) {
                            // Migration case: user exists but never had a password set
                            // We allow them in, and the signIn callback will save this password
                            console.log('User has no password, accepting and will set it.');
                        }
                    }
                    // If profile doesn't exist, it's a new registration, allow and create later.
                } catch (err: any) {
                    if (err.message === "비밀번호가 일치하지 않습니다.") {
                        throw err;
                    }
                    console.error('Supabase query failed during auth:', err);
                    // If the 'password' column doesn't exist yet, the query will fail.
                    // For safety during deployment, if it fails, we fall back to accepting the login
                    // so we don't lock everyone out, but we still log it.
                }

                return {
                    id: userId,
                    name: name,
                    email: `${credentials.id}@leafnote.ai`,
                    idPlain: credentials.id,
                    password: inputPassword // Passing this to the token so the signIn callback can save it
                };
            },
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login", // Redirect to login on error
    },
    callbacks: {
        async signIn({ user, account }) {
            if (!user?.id) return true;

            const userId = toUUID(user.id);
            const loginId = (user as any).idPlain || user.id;
            const password = (user as any).password; // From authorize callback

            try {
                // Prepare upsert payload. If we successfully authorized, we should save the password
                // if it was provided (for new accounts or migrations).
                const payload: any = {
                    id: userId,
                    name: user.name || '작가님',
                    email: user.email || '',
                    phone: loginId,
                    updated_at: new Date().toISOString(),
                };

                if (password) {
                    payload.password = password;
                }

                const { error } = await supabase
                    .from('profiles')
                    .upsert(payload, { onConflict: 'id' });

                if (error) console.error('Supabase sync error:', error);
            } catch (err) {
                console.error('Supabase sync exception:', err);
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                // Ensure ID is always in UUID format
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
