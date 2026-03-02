"use client";

import { usePathname } from 'next/navigation';
import { BookOpen, PenTool, Sparkles, Printer } from 'lucide-react';

const STEPS = [
    { path: '/interview', label: '인터뷰', icon: BookOpen },
    { path: '/editor', label: '원고 편집', icon: PenTool },
    { path: '/design', label: '표지 디자인', icon: Sparkles },
    { path: '/export', label: '출판', icon: Printer },
];

export default function ProgressStepper() {
    const pathname = usePathname();
    const currentIndex = STEPS.findIndex((s) => s.path === pathname);

    return (
        <div className="flex items-center justify-center gap-1 py-3 bg-white/60 backdrop-blur-sm border-b">
            {STEPS.map((step, i) => {
                const Icon = step.icon;
                const isActive = i === currentIndex;
                const isCompleted = i < currentIndex;

                return (
                    <div key={step.path} className="flex items-center">
                        <a
                            href={step.path}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive
                                    ? 'bg-slate-800 text-white shadow-sm'
                                    : isCompleted
                                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Icon size={16} />
                            <span className="hidden md:inline">{step.label}</span>
                            {isCompleted && <span className="text-green-600">✓</span>}
                        </a>
                        {i < STEPS.length - 1 && (
                            <div className={`w-8 h-[2px] mx-1 ${i < currentIndex ? 'bg-green-300' : 'bg-slate-200'
                                }`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
