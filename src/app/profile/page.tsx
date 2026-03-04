"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, User, Mail, Camera, Save, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

// Compress and crop image to a square JPEG ≤ 200×200px
function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                const SIZE = 200;
                const canvas = document.createElement('canvas');
                canvas.width = SIZE;
                canvas.height = SIZE;
                const ctx = canvas.getContext('2d')!;
                const min = Math.min(img.width, img.height);
                const sx = (img.width - min) / 2;
                const sy = (img.height - min) / 2;
                ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
                resolve(canvas.toDataURL('image/jpeg', 0.75));
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
}

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { userProfile, updateUserProfile } = useBookStore();
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState<string | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status, router]);

    useEffect(() => {
        if (userProfile?.name) setName(userProfile.name);
        else if (session?.user?.name) setName(session.user.name);

        if (userProfile?.avatar) setAvatar(userProfile.avatar);
        else if (session?.user?.image) setAvatar(session.user.image);
    }, [userProfile, session]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            setAvatar(compressed);
        } catch {
            console.error('Image compression failed');
        }
        // Reset so same file can be re-selected
        e.target.value = '';
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            await updateUserProfile({ name: name.trim(), avatar });
            setShowSuccess(true);
        } catch (error) {
            console.error('Failed to save profile:', error);
            alert('저장에 실패했습니다. 다시 시도해 주세요.');
        } finally {
            setIsSaving(false);
        }
    };

    if (status === 'loading' || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
                <div className="animate-pulse text-emerald-600 font-serif font-bold tracking-widest text-lg">기록을 펼치는 중...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#faf9f6] paper-texture flex flex-col items-center relative overflow-hidden isolate">
            {/* Success Modal */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                            className="bg-white rounded-3xl p-8 max-w-xs w-full shadow-2xl border border-emerald-100 text-center"
                        >
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold font-serif text-slate-800 mb-2">저장 완료!</h3>
                            <p className="text-sm text-slate-500 mb-6">프로필이 성공적으로 저장되었습니다.</p>
                            <Button
                                onClick={() => router.push('/dashboard')}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 font-bold"
                            >
                                확인
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        <h1 className="text-xl font-serif font-bold text-slate-800 tracking-tight">프로필 관리</h1>
                    </div>
                </div>
            </header>

            <main className="w-full max-w-2xl px-4 py-8 md:py-20 flex-1 z-10">
                <div className="text-center mb-10">
                    <h2 className="text-xl md:text-3xl font-serif font-bold text-slate-800 mb-2">당신의 조각들</h2>
                    <p className="text-slate-500 text-sm font-medium tracking-wide">리프노트에 남겨진 작가님의 소중한 기록</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-2xl shadow-emerald-900/5 border border-white flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-emerald-50/80 to-transparent pointer-events-none"></div>

                    <div className="relative z-10 w-full flex flex-col items-center">
                        {/* Avatar Upload */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                        />
                        <div
                            className="relative group cursor-pointer mb-8 md:mb-12"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-28 h-28 md:w-36 md:h-36 bg-slate-50 rounded-full border-[6px] border-white shadow-xl shadow-slate-200/50 overflow-hidden flex items-center justify-center relative z-10">
                                {avatar ? (
                                    <img src={avatar} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <User className="w-14 h-14 text-slate-300" />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-slate-900/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-[2px]">
                                <Camera className="w-8 h-8 text-white drop-shadow-md" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-md border border-slate-100 z-30">
                                <div className="bg-emerald-100 text-emerald-600 rounded-full p-1.5">
                                    <Camera className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 -mt-6 mb-8 font-medium">사진을 클릭하여 변경하세요</p>

                        <div className="w-full space-y-8 max-w-sm">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-700 font-serif flex items-center gap-2">
                                    <User className="w-4 h-4 text-emerald-600" /> 작가명 (이름)
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all text-slate-800 font-bold shadow-sm placeholder:text-slate-300"
                                    placeholder="기록될 이름을 적어주세요"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-700 font-serif flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-emerald-600" /> 이메일 주소
                                </label>
                                <input
                                    type="email"
                                    value={session.user?.email || ''}
                                    disabled
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-slate-400 font-medium cursor-not-allowed shadow-inner"
                                />
                                <p className="text-[11px] text-slate-400 mt-1.5 text-right font-medium">연동된 이메일 계정입니다.</p>
                            </div>

                            <div className="pt-8 flex justify-center w-full">
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving || !name.trim()}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-14 font-bold text-base shadow-lg shadow-emerald-200 transition-all hover:translate-y-[-2px] hover:shadow-xl flex items-center justify-center gap-2 group"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    )}
                                    저장
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-8 font-medium font-serif">LeafNote • 모든 인생은 한 권의 책이다</p>
            </main>
        </div>
    );
}
