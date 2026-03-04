import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabase";
import type { NextAuthOptions } from "next-auth";

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

                const userId = credentials.id; // Raw ID
                const name = credentials.name || '작가님';
                const inputPassword = credentials.password;

                try {
                    // Fetch existing user
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
                        // Profile exists but password was never set (migration / google users signing in via credentials?)
                        // We will allow this one time and the signIn callback will set it.
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
                    throw err; // Proper throwing so NextAuth catches it
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

            const userId = user.id; // Use raw string ID
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
                token.id = user.id;
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
