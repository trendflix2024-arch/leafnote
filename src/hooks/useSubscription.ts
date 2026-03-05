"use client";

import { useState, useEffect } from 'react';

interface SubscriptionState {
    plan: 'free' | 'monthly' | 'yearly';
    isPremium: boolean;
    expiresAt: string | null;
    interviewCount: number;
    draftCount: number;
    isLoading: boolean;
}

const FREE_INTERVIEW_LIMIT = 10;
const FREE_DRAFT_LIMIT = 1;

export function useSubscription() {
    const [state, setState] = useState<SubscriptionState>({
        plan: 'free',
        isPremium: false,
        expiresAt: null,
        interviewCount: 0,
        draftCount: 0,
        isLoading: true,
    });

    useEffect(() => {
        fetch('/api/subscription')
            .then(r => r.json())
            .then(data => setState({ ...data, isLoading: false }))
            .catch(() => setState(s => ({ ...s, isLoading: false })));
    }, []);

    const canInterview = state.isPremium || state.interviewCount < FREE_INTERVIEW_LIMIT;
    const canGenerateDraft = state.isPremium || state.draftCount < FREE_DRAFT_LIMIT;
    const remainingInterviews = state.isPremium ? Infinity : Math.max(0, FREE_INTERVIEW_LIMIT - state.interviewCount);

    return { ...state, canInterview, canGenerateDraft, remainingInterviews, FREE_INTERVIEW_LIMIT, FREE_DRAFT_LIMIT };
}
