"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { useBookStore } from "@/lib/store";

function UserSync() {
    const { data: session } = useSession();
    const { setUserProfile, userProfile, fetchProjects, fetchUserProfile } = useBookStore();

    useEffect(() => {
        if (session?.user) {
            const sessionName = session.user.name || session.user.email?.split('@')[0] || '작가님';
            const userId = (session.user as any).id || session.user.email || '';

            if (userProfile?.id !== userId) {
                // Initial set from session
                setUserProfile({
                    id: userId,
                    name: userProfile?.name || sessionName,
                    email: session.user.email || '',
                    avatar: session.user.image || '',
                });

                // Immediately fetch full profile from Supabase and sync projects
                const sync = async () => {
                    await fetchUserProfile();
                    await fetchProjects();
                };
                sync();
            }
        }
    }, [session, userProfile?.id, setUserProfile, fetchProjects, fetchUserProfile]);

    return null;
}

import { useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <SessionProvider>
            {mounted && <UserSync />}
            {children}
        </SessionProvider>
    );
}
