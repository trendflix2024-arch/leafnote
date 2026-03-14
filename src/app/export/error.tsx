'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExportError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        console.error('Export page error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
                <p className="text-slate-700 font-medium mb-2">출판 페이지를 불러오지 못했습니다.</p>
                <p className="text-slate-400 text-sm mb-6">{error.message || '일시적인 오류가 발생했습니다.'}</p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                        다시 시도
                    </button>
                    <button
                        onClick={() => router.push('/design')}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                        디자인으로
                    </button>
                </div>
            </div>
        </div>
    );
}
