"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Bell, Shield, Monitor, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookStore } from "@/lib/store";

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { settings, updateSettings, resetAll } = useBookStore();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    if (status === 'loading' || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
                <div className="animate-pulse text-emerald-600 font-serif font-bold tracking-widest text-lg">기록을 펼치는 중...</div>
            </div>
        );
    }

    const handleDeleteAccount = () => {
        if (confirm('정말로 계정을 삭제하시겠습니까? 기록된 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.')) {
            alert('데모 환경에서는 계정 삭제가 제한되어 있습니다.');
        }
    };

    return (
        <div className="min-h-screen bg-[#faf9f6] paper-texture flex flex-col items-center relative overflow-hidden isolate">
            {/* Background Decorative Blur */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-100/40 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-amber-50/50 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

            {/* Header */}
            <header className="w-full bg-white/60 backdrop-blur-md border-b border-paper-edge sticky top-0 z-20">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')} className="rounded-full text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-xl font-serif font-bold text-slate-800 tracking-tight">앱 설정</h1>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-2xl px-4 py-8 md:py-20 flex-1 z-10">
                <div className="text-center mb-10">
                    <h2 className="text-xl md:text-3xl font-serif font-bold text-slate-800 mb-2">환경 설정</h2>
                    <p className="text-slate-500 text-sm font-medium tracking-wide">리프노트를 더 편안하게 사용하기 위한 설정</p>
                </div>

                <div className="space-y-6">
                    {/* 알림 설정 */}
                    <section className="bg-white/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-emerald-900/5 border border-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <h2 className="text-lg font-bold text-slate-800 font-serif mb-6 flex items-center gap-3 relative z-10">
                            <div className="p-2 bg-emerald-100/50 rounded-xl text-emerald-600">
                                <Bell className="w-5 h-5" />
                            </div>
                            알림 설정
                        </h2>

                        <div className="flex items-center justify-between py-2 relative z-10">
                            <div>
                                <p className="font-bold text-slate-700">이메일 알림</p>
                                <p className="text-sm text-slate-400 font-medium">새로운 기능 및 중요 소식을 받아봅니다.</p>
                            </div>
                            <button
                                onClick={() => updateSettings({ notifications: !settings.notifications })}
                                className={`w-14 h-7 rounded-full transition-colors relative shadow-inner ${settings.notifications ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${settings.notifications ? 'left-8' : 'left-1'}`} />
                            </button>
                        </div>
                    </section>

                    {/* 화면 설정 */}
                    <section className="bg-white/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-emerald-900/5 border border-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <h2 className="text-lg font-bold text-slate-800 font-serif mb-6 flex items-center gap-3 relative z-10">
                            <div className="p-2 bg-amber-100/50 rounded-xl text-amber-600">
                                <Monitor className="w-5 h-5" />
                            </div>
                            화면 설정
                        </h2>

                        <div className="flex items-center justify-between py-2 relative z-10">
                            <div>
                                <p className="font-bold text-slate-700">어두운 테마 (다크 모드)</p>
                                <p className="text-sm text-slate-400 font-medium">눈이 편안한 어두운 배경을 사용합니다.</p>
                            </div>
                            <button
                                onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                                className={`w-14 h-7 rounded-full transition-colors relative shadow-inner ${settings.darkMode ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${settings.darkMode ? 'left-8' : 'left-1'}`} />
                            </button>
                        </div>
                    </section>

                    {/* 데이터 및 보안 */}
                    <section className="bg-white/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-emerald-900/5 border border-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/80 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <h2 className="text-lg font-bold text-slate-800 font-serif mb-6 flex items-center gap-3 relative z-10">
                            <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
                                <Shield className="w-5 h-5" />
                            </div>
                            개인정보 위탁 및 보안
                        </h2>

                        <div className="space-y-2 relative z-10">
                            <button className="w-full text-left py-4 font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 px-4 rounded-xl transition-all break-keep">
                                개인정보 처리방침 읽기
                            </button>
                            <button className="w-full text-left py-4 font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 px-4 rounded-xl transition-all break-keep">
                                서비스 이용약관 읽기
                            </button>
                            <div className="h-px w-full bg-slate-100 my-4"></div>
                            <button
                                onClick={handleDeleteAccount}
                                className="w-full py-4 px-4 font-bold text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-between transition-all group"
                            >
                                계정 회원탈퇴 및 기록 영구 삭제
                                <Trash2 className="w-5 h-5 text-red-400 group-hover:text-red-500 transition-colors" />
                            </button>
                        </div>
                    </section>
                </div>

                <p className="text-center text-xs text-slate-400 mt-12 font-medium font-serif">LeafNote • 모든 인생은 한 권의 책이다</p>
            </main>
        </div>
    );
}
