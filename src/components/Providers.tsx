"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { useBookStore } from "@/lib/store";

function UserSync() {
    const { data: session } = useSession();
    const { setUserProfile, userProfile, fetchProjects, projects } = useBookStore();

    useEffect(() => {
        if (session?.user) {
            const sessionName = session.user.name || session.user.email?.split('@')[0] || '작가';
            const userId = (session.user as any).id || '';

            if (userProfile?.id !== userId) {
                setUserProfile({
                    id: userId,
                    name: sessionName,
                    email: session.user.email || '',
                    avatar: session.user.image || '',
                });

                // Fetch projects from Supabase. 
                // We use a small timeout to allow Zustand to settle.
                setTimeout(() => {
                    fetchProjects();
                }, 100);
            }
        }
    }, [session, userProfile?.id, setUserProfile, fetchProjects]);

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
