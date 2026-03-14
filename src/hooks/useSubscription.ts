"use client";

import { useState, useEffect } from 'react';

type PlanId = 'free' | 'monthly' | 'yearly' | 'basic_monthly' | 'basic_yearly' | 'standard_monthly' | 'standard_yearly' | 'pro_monthly' | 'pro_yearly';
type PlanTier = 'free' | 'basic' | 'standard' | 'pro';

interface SubscriptionState {
    plan: PlanId;
    isPremium: boolean;
    expiresAt: string | null;
    interviewCount: number;
    draftCount: number;
    isLoading: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, { interview: number; project: number; correction: number; tts: number }> = {
    free:     { interview: 10,       project: 1,        correction: 1,        tts: 1 },
    basic:    { interview: 20,       project: 1,        correction: 5,        tts: 10 },
    standard: { interview: Infinity, project: 3,        correction: 20,       tts: Infinity },
    pro:      { interview: Infinity, project: Infinity, correction: Infinity, tts: Infinity },
};

export function getPlanTier(plan: string): PlanTier {
    if (plan.startsWith('pro')) return 'pro';
    if (plan.startsWith('standard') || plan === 'yearly') return 'standard';
    if (plan.startsWith('basic') || plan === 'monthly') return 'basic';
    return 'free';
}

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

    const tier = getPlanTier(state.plan);
    const limits = PLAN_LIMITS[tier];

    const isPro = () => tier === 'pro';
    const isStandard = () => tier === 'standard' || tier === 'pro';
    const isBasic = () => tier !== 'free';
    const getPlanLimits = () => limits;

    const canInterview = state.interviewCount < limits.interview;
    const canGenerateDraft = state.isPremium || state.draftCount < 1;
    const remainingInterviews = limits.interview === Infinity ? Infinity : Math.max(0, limits.interview - state.interviewCount);

    // 하위 호환
    const FREE_INTERVIEW_LIMIT = PLAN_LIMITS.free.interview;
    const FREE_DRAFT_LIMIT = 1;

    return {
        ...state,
        tier,
        canInterview,
        canGenerateDraft,
        remainingInterviews,
        isPro,
        isStandard,
        isBasic,
        getPlanLimits,
        FREE_INTERVIEW_LIMIT,
        FREE_DRAFT_LIMIT,
    };
}
