"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Generates or retrieves a persistent session ID (per browser session)
function getSessionId(): string {
    if (typeof window === 'undefined') return '';
    let sid = sessionStorage.getItem('_leafnote_sid');
    if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem('_leafnote_sid', sid);
    }
    return sid;
}

export function usePageTracking() {
    const pathname = usePathname();
    const viewIdRef = useRef<string | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        const sessionId = getSessionId();
        if (!sessionId) return;

        let currentViewId: string | null = null;
        const enterTime = Date.now();
        startTimeRef.current = enterTime;

        // Track page enter
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'enter', page: pathname, sessionId }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.viewId) {
                    currentViewId = data.viewId;
                    viewIdRef.current = data.viewId;
                }
            })
            .catch(() => {});

        // Track page exit (on route change or tab close)
        const sendExit = () => {
            const id = currentViewId || viewIdRef.current;
            if (!id) return;
            const duration = Math.round((Date.now() - enterTime) / 1000);
            // Use sendBeacon for reliability on tab close
            const payload = JSON.stringify({ action: 'exit', viewId: id, duration, sessionId });
            if (navigator.sendBeacon) {
                const blob = new Blob([payload], { type: 'application/json' });
                navigator.sendBeacon('/api/analytics/track', blob);
            } else {
                fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: true,
                }).catch(() => {});
            }
        };

        // Visibility change (tab switch, minimize)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') sendExit();
        };

        window.addEventListener('beforeunload', sendExit);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            sendExit();
            window.removeEventListener('beforeunload', sendExit);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [pathname]);
}
