"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function PaymentFailPage() {
    const router = useRouter();
    return (
        <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4">
            <div className="text-center max-w-sm">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    ✕
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-800 mb-2">결제가 취소되었습니다</h2>
                <p className="text-slate-500 mb-6">결제 도중 문제가 발생했거나 취소되었습니다.</p>
                <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => router.push('/dashboard')} className="rounded-full px-6">
                        대시보드
                    </Button>
                    <Button onClick={() => router.push('/payment')} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-full px-6">
                        다시 시도
                    </Button>
                </div>
            </div>
        </div>
    );
}
