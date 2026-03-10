"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Crop, Loader2, X, AlertCircle } from 'lucide-react';
import { MagicFrameLayout } from '@/components/magic-frame/MagicFrameLayout';
import { CollageMaker } from '@/components/magic-frame/CollageMaker';
import { PhotoCropper } from '@/components/magic-frame/PhotoCropper';
import { useMagicFrameAuth } from '@/hooks/useMagicFrameAuth';

type Tab = 'collage' | 'crop';

export default function MagicFrameEditPage() {
    const router = useRouter();
    const { session, loading: authLoading } = useMagicFrameAuth(true);
    const [tab, setTab] = useState<Tab>('collage');

    // Confirm popup
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
    const [pendingType, setPendingType] = useState<string>('single');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    // Preview
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFinalize = (blob: Blob, type: string) => {
        setPendingBlob(blob);
        setPendingType(type);
        setPreviewUrl(URL.createObjectURL(blob));
        setShowConfirm(true);
        setUploadError('');
    };

    const handleConfirmUpload = async () => {
        if (!pendingBlob || !session) return;
        setUploading(true);
        setUploadError('');

        try {
            // Convert blob to base64
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(pendingBlob);
            });

            const res = await fetch('/api/magic-frame/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session.userId,
                    imageBase64: base64,
                    imageType: pendingType,
                }),
            });

            const data = await res.json();
            if (data.error) {
                setUploadError(data.error);
                return;
            }

            // Store image URL for complete page
            sessionStorage.setItem('magic_frame_result', JSON.stringify({
                imageUrl: data.imageUrl,
                name: session.name,
            }));

            router.push('/magic-frame/complete');
        } catch {
            setUploadError('업로드 중 오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setShowConfirm(false);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPendingBlob(null);
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

            {/* Editor */}
            <div className="max-w-5xl mx-auto px-4 py-6">
                <AnimatePresence mode="wait">
                    {tab === 'collage' ? (
                        <motion.div key="collage" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                            <CollageMaker onFinalize={(blob) => handleFinalize(blob, 'collage')} />
                        </motion.div>
                    ) : (
                        <motion.div key="crop" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                            <PhotoCropper onFinalize={(blob) => handleFinalize(blob, 'single')} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Confirm overlay */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">이 사진으로 확정하겠습니까?</h3>
                            <p className="text-xs text-slate-400 mb-4">확정 후에는 수정이 불가합니다</p>

                            {previewUrl && (
                                <div className="rounded-xl overflow-hidden border border-slate-200 mb-5 max-h-64 overflow-y-hidden">
                                    <img src={previewUrl} alt="미리보기" className="w-full object-cover" />
                                </div>
                            )}

                            {uploadError && (
                                <p className="text-red-500 text-xs flex items-center justify-center gap-1 mb-3">
                                    <AlertCircle size={12} /> {uploadError}
                                </p>
                            )}

                            <div className="space-y-2">
                                <button onClick={handleConfirmUpload} disabled={uploading}
                                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
                                    {uploading ? <><Loader2 size={16} className="animate-spin" /> 업로드 중...</> : '확인'}
                                </button>
                                <button onClick={handleCancel} disabled={uploading}
                                    className="w-full py-3 text-slate-500 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
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
