"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useBookStore } from "@/lib/store";

export function SessionWatcher() {
    const { data: session, status } = useSession();
    const { setUserProfile, fetchProjects } = useBookStore();

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            setUserProfile({
                id: (session.user as any).id || session.user.email || "",
                name: session.user.name || "작가님",
                email: session.user.email || "",
                avatar: session.user.image || undefined,
            });
            fetchProjects();
        } else if (status === "unauthenticated") {
            setUserProfile(null);
        }
    }, [session, status, setUserProfile, fetchProjects]);

    return null;
}
