"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Crop, Loader2, AlertCircle, Check, Send, ArrowLeft, ImageIcon } from 'lucide-react';
import { MagicFrameLayout } from '@/components/magic-frame/MagicFrameLayout';
import { CollageMaker } from '@/components/magic-frame/CollageMaker';
import { PhotoCropper } from '@/components/magic-frame/PhotoCropper';
import { Gallery } from '@/components/magic-frame/Gallery';
import { useMagicFrameAuth } from '@/hooks/useMagicFrameAuth';
import { useMagicFrameAdmin } from '@/hooks/useMagicFrameAdmin';

type Tab = 'collage' | 'crop' | 'gallery';

export default function MagicFrameEditPage() {
    const router = useRouter();
    const { session, loading: authLoading } = useMagicFrameAuth(true);
    const { isAdmin } = useMagicFrameAdmin();
    const [tab, setTab] = useState<Tab>('collage');

    // Step 1: Confirm photo, Step 2: Send/Upload
    const [confirmedBlob, setConfirmedBlob] = useState<Blob | null>(null);
    const [confirmedType, setConfirmedType] = useState<string>('single');
    const [confirmedPreview, setConfirmedPreview] = useState<string | null>(null);

    // Confirm popup (step 1)
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
    const [pendingType, setPendingType] = useState<string>('single');
    const [pendingPreview, setPendingPreview] = useState<string | null>(null);

    // Upload state (step 2)
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    // Called when user clicks "사진 확정하기" in editor
    const handleFinalize = (blob: Blob, type: string) => {
        setPendingBlob(blob);
        setPendingType(type);
        setPendingPreview(URL.createObjectURL(blob));
        setShowConfirm(true);
    };

    // Step 1: 확정 - saves the photo, closes popup
    const handleConfirmPhoto = () => {
        if (!pendingBlob) return;
        // Clean up previous confirmed preview if exists
        if (confirmedPreview) URL.revokeObjectURL(confirmedPreview);
        setConfirmedBlob(pendingBlob);
        setConfirmedType(pendingType);
        setConfirmedPreview(pendingPreview);
        setShowConfirm(false);
        setPendingBlob(null);
        setPendingPreview(null);
        setUploadError('');
    };

    // Step 2: 발송 - actually uploads (with 30s timeout)
    const handleSend = async () => {
        if (!confirmedBlob || !session) return;
        setUploading(true);
        setUploadError('');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        try {
            const formData = new FormData();
            formData.append('image', confirmedBlob, 'photo.jpg');
            formData.append('userId', session.userId);
            formData.append('imageType', confirmedType);

            const res = await fetch('/api/magic-frame/upload', {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });

            const data = await res.json();
            if (data.error) {
                setUploadError(data.error);
                return;
            }

            sessionStorage.setItem('magic_frame_result', JSON.stringify({
                imageUrl: data.imageUrl,
                name: session.name,
            }));

            router.push('/magic-frame/complete');
        } catch (e: any) {
            if (e.name === 'AbortError') {
                setUploadError('업로드 시간이 초과되었습니다. 다시 시도해 주세요.');
            } else {
                setUploadError('업로드 중 오류가 발생했습니다. 다시 시도해 주세요.');
            }
        } finally {
            clearTimeout(timeout);
            setUploading(false);
        }
    };

    // Cancel confirm popup
    const handleCancelConfirm = () => {
        setShowConfirm(false);
        if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        setPendingPreview(null);
        setPendingBlob(null);
    };

    // Reset confirmed photo (go back to editing)
    const handleResetConfirmed = () => {
        if (confirmedPreview) URL.revokeObjectURL(confirmedPreview);
        setConfirmedBlob(null);
        setConfirmedPreview(null);
        setUploadError('');
    };

    if (authLoading) {
        return (
            <MagicFrameLayout>
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
            </MagicFrameLayout>
        );
    }

    return (
        <MagicFrameLayout>
            {/* Tab bar */}
            <div className="flex justify-center py-4 bg-white border-b border-slate-100">
                <div className="inline-flex bg-slate-100 rounded-full p-1">
                    {([
                        { key: 'collage' as Tab, label: '콜라주 메이커', icon: Layers },
                        { key: 'crop' as Tab, label: '개별 사진 크롭', icon: Crop },
                        { key: 'gallery' as Tab, label: '갤러리', icon: ImageIcon },
                    ]).map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${tab === t.key
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}>
                            <t.icon size={15} /> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Step 2: Photo confirmed — show preview + send button */}
            {confirmedBlob && (
                <motion.div key="confirmed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="max-w-md mx-auto px-4 py-8">
                    <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 text-center space-y-5">
                        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <Check size={28} className="text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">사진이 확정되었습니다</h3>
                            <p className="text-xs text-slate-400">아래 미리보기를 확인 후 발송해 주세요</p>
                        </div>

                        {confirmedPreview && (
                            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-md">
                                <img src={confirmedPreview} alt="확정된 사진" className="w-full" />
                            </div>
                        )}

                        {uploadError && (
                            <div className="bg-red-50 rounded-xl p-3 space-y-2">
                                <p className="text-red-500 text-xs flex items-center justify-center gap-1">
                                    <AlertCircle size={12} /> {uploadError}
                                </p>
                                <button onClick={handleSend}
                                    className="text-xs text-red-600 font-bold hover:underline">
                                    다시 시도
                                </button>
                            </div>
                        )}

                        <div className="space-y-2 pt-2">
                            <button onClick={handleSend} disabled={uploading}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {uploading ? <><Loader2 size={16} className="animate-spin" /> 발송 중...</> : <><Send size={16} /> {uploadError ? '다시 발송하기' : '발송하기'}</>}
                            </button>
                            <button onClick={handleResetConfirmed} disabled={uploading}
                                className="w-full py-3 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                                <ArrowLeft size={14} /> 다시 편집하기
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Editor — always mounted, hidden when photo is confirmed */}
            <div className={confirmedBlob ? 'hidden' : ''}>
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <AnimatePresence mode="wait">
                        {tab === 'collage' && (
                            <motion.div key="collage" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                                <CollageMaker onFinalize={(blob) => handleFinalize(blob, 'collage')} />
                            </motion.div>
                        )}
                        {tab === 'crop' && (
                            <motion.div key="crop" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                <PhotoCropper onFinalize={(blob) => handleFinalize(blob, 'single')} />
                            </motion.div>
                        )}
                        {tab === 'gallery' && (
                            <motion.div key="gallery" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                <Gallery isAdmin={isAdmin} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Confirm popup (Step 1: 사진 확정) */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">이 사진으로 확정하시겠습니까?</h3>
                            <p className="text-xs text-slate-400 mb-4">확정 후 발송 버튼을 눌러야 제출됩니다</p>

                            {pendingPreview && (
                                <div className="rounded-xl overflow-hidden border border-slate-200 mb-5">
                                    <img src={pendingPreview} alt="미리보기" className="w-full" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <button onClick={handleConfirmPhoto}
                                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                                    <Check size={16} /> 사진 확정하기
                                </button>
                                <button onClick={handleCancelConfirm}
                                    className="w-full py-3 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors">
                                    취소
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </MagicFrameLayout>
    );
}
