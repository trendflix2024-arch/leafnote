"use client";

import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'leafnote-install-dismissed';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        const ua = navigator.userAgent;
        setIsIOS(/iphone|ipad|ipod/i.test(ua));
        setIsAndroid(/android/i.test(ua));
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
        setDismissed(!!localStorage.getItem(DISMISSED_KEY));

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const install = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            dismiss();
        }
    };

    const dismiss = () => {
        localStorage.setItem(DISMISSED_KEY, '1');
        setDismissed(true);
    };

    const isMobile = isIOS || isAndroid;
    const showBanner = !isStandalone && !dismissed && isMobile;

    return { showBanner, isIOS, isAndroid, deferredPrompt, install, dismiss };
}
