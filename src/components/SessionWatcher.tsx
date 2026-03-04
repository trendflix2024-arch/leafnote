"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useBookStore } from "@/lib/store";

export function SessionWatcher() {
    const { data: session, status } = useSession();
    const { setUserProfile, fetchProjects, fetchUserProfile, resetAll, userProfile } = useBookStore();
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            const userId = (session.user as any).id || session.user.email || "";
            const sessionName = session.user.name || session.user.email?.split('@')[0] || "작가님";

            if (userProfile?.id !== userId || !hasFetchedRef.current) {
                setUserProfile({
                    id: userId,
                    name: userProfile?.name || sessionName,
                    email: session.user.email || "",
                    avatar: session.user.image || undefined,
                });

                // Fetch real data from cloud
                const sync = async () => {
                    await fetchUserProfile();
                    await fetchProjects();
                };
                sync();
                hasFetchedRef.current = true;
            }
        } else if (status === "unauthenticated") {
            resetAll();
            hasFetchedRef.current = false;
        }
    }, [session, status, setUserProfile, fetchProjects, fetchUserProfile, resetAll, userProfile?.id]);

    return null;
}
