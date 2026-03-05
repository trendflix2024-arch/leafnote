"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect, useState } from "react";
import { FeedbackWidget } from "./FeedbackWidget";

export function Providers({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <SessionProvider>
            {mounted && children}
            {mounted && <FeedbackWidget />}
        </SessionProvider>
    );
}
