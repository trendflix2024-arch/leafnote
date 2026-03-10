"use client";

import { useState, useRef, useCallback } from 'react';
import { Plus, RotateCcw, Check, X, LayoutGrid } from 'lucide-react';

interface CollageProps {
    onFinalize: (blob: Blob) => void;
}

const BG_COLORS = [
    { label: '화이트', value: '#FFFFFF', border: true },
    { label: '블랙', value: '#000000' },
    { label: '그레이', value: '#E2E8F0' },
    { label: '핑크', value: '#FBD5D5' },
    { label: '라벤더', value: '#DDD6FE' },
];

type LayoutType = '2x2' | '1x2' | '2x1' | '1x3';

const LAYOUTS: { key: LayoutType; label: string; slots: number; gridClass: string }[] = [
    { key: '2x2', label: '2×2', slots: 4, gridClass: 'grid-cols-2 grid-rows-2' },
    { key: '1x2', label: '1×2', slots: 2, gridClass: 'grid-cols-1 grid-rows-2' },
    { key: '2x1', label: '2×1', slots: 2, gridClass: 'grid-cols-2 grid-rows-1' },
    { key: '1x3', label: '1×3', slots: 3, gridClass: 'grid-cols-1 grid-rows-3' },
];

function getLayoutPositions(layout: LayoutType, outputW: number, outputH: number, gap: number) {
    switch (layout) {
        case '2x2': {
            const cellW = (outputW - gap * 3) / 2;
            const cellH = (outputH - gap * 3) / 2;
            return [
                { x: gap, y: gap, w: cellW, h: cellH },
                { x: gap * 2 + cellW, y: gap, w: cellW, h: cellH },
                { x: gap, y: gap * 2 + cellH, w: cellW, h: cellH },
                { x: gap * 2 + cellW, y: gap * 2 + cellH, w: cellW, h: cellH },
            ];
        }
        case '1x2': {
            const cellW = outputW - gap * 2;
            const cellH = (outputH - gap * 3) / 2;
            return [
                { x: gap, y: gap, w: cellW, h: cellH },
                { x: gap, y: gap * 2 + cellH, w: cellW, h: cellH },
            ];
        }
        case '2x1': {
            const cellW = (outputW - gap * 3) / 2;
            const cellH = outputH - gap * 2;
            return [
                { x: gap, y: gap, w: cellW, h: cellH },
                { x: gap * 2 + cellW, y: gap, w: cellW, h: cellH },
            ];
        }
        case '1x3': {
            const cellW = outputW - gap * 2;
            const cellH = (outputH - gap * 4) / 3;
            return [
                { x: gap, y: gap, w: cellW, h: cellH },
                { x: gap, y: gap * 2 + cellH, w: cellW, h: cellH },
                { x: gap, y: gap * 3 + cellH * 2, w: cellW, h: cellH },
            ];
        }
    }
}

export function CollageMaker({ onFinalize }: CollageProps) {
    const [layout, setLayout] = useState<LayoutType>('2x2');
    const currentLayout = LAYOUTS.find(l => l.key === layout)!;
    const [images, setImages] = useState<(string | null)[]>([null, null, null, null]);
    const [ratio, setRatio] = useState<'3:4' | '4:3'>('3:4');
    const [spacing, setSpacing] = useState(8);
    const [bgColor, setBgColor] = useState('#000000');
    const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

    const slotImages = images.slice(0, currentLayout.slots);

    const handleLayoutChange = (newLayout: LayoutType) => {
        setLayout(newLayout);
        const newSlots = LAYOUTS.find(l => l.key === newLayout)!.slots;
        setImages(prev => {
            const next = [...prev];
            while (next.length < newSlots) next.push(null);
            return next;
        });
    };

    const handleAddImage = (index: number) => {
        fileRefs.current[index]?.click();
    };

    const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setImages(prev => {
                const next = [...prev];
                next[index] = reader.result as string;
                return next;
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const next = [...prev];
            next[index] = null;
            return next;
        });
    };

    const reset = () => {
        setImages(Array(currentLayout.slots).fill(null));
        setSpacing(8);
        setBgColor('#000000');
    };

    const hasAnyImage = slotImages.some(Boolean);
    const isPortrait = ratio === '3:4';
    const previewW = isPortrait ? 320 : 400;
    const previewH = isPortrait ? Math.round(320 * 4 / 3) : 300;

    const renderCollage = useCallback(async (): Promise<Blob | null> => {
        const outputW = isPortrait ? 900 : 1200;
        const outputH = isPortrait ? 1200 : 900;
        const gap = spacing * 3;

        const canvas = document.createElement('canvas');
        canvas.width = outputW;
        canvas.height = outputH;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, outputW, outputH);

        const positions = getLayoutPositions(layout, outputW, outputH, gap);

        const loadImg = (src: string): Promise<HTMLImageElement> =>
            new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });

        for (let i = 0; i < positions.length; i++) {
            if (!images[i]) continue;
            try {
                const img = await loadImg(images[i]!);
                const { x: cx, y: cy, w: cellW, h: cellH } = positions[i];
                const imgRatio = img.width / img.height;
                const cellRatio = cellW / cellH;
                let sw = img.width, sh = img.height, sx = 0, sy = 0;
                if (imgRatio > cellRatio) {
                    sw = img.height * cellRatio;
                    sx = (img.width - sw) / 2;
                } else {
                    sh = img.width / cellRatio;
                    sy = (img.height - sh) / 2;
                }
                ctx.drawImage(img, sx, sy, sw, sh, cx, cy, cellW, cellH);
            } catch { /* skip bad images */ }
        }

        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92);
        });
    }, [images, bgColor, spacing, isPortrait, layout]);

    const handleFinalize = async () => {
        const blob = await renderCollage();
        if (blob) onFinalize(blob);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Preview */}
            <div className="flex-1 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 inline-block">
                    <div className={`grid ${currentLayout.gridClass} gap-[var(--gap)]`}
                        style={{
                            '--gap': `${spacing}px`,
                            width: `${previewW}px`,
                            height: `${previewH}px`,
                            backgroundColor: bgColor,
                            borderRadius: '12px',
                            padding: `${spacing}px`,
                        } as React.CSSProperties}>
                        {slotImages.map((img, i) => (
                            <div key={i}
                                className="relative rounded-lg overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors group"
                                style={{ backgroundColor: img ? 'transparent' : (bgColor === '#FFFFFF' ? '#f8fafc' : 'rgba(255,255,255,0.1)') }}
                                onClick={() => !img && handleAddImage(i)}>
                                {img ? (
                                    <>
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button onClick={e => { e.stopPropagation(); removeImage(i); }}
                                            className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <X size={12} className="text-white" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <Plus size={20} className={bgColor === '#000000' ? 'text-white/50 mx-auto' : 'text-slate-400 mx-auto'} />
                                        <p className={`text-[10px] mt-1 ${bgColor === '#000000' ? 'text-white/50' : 'text-slate-400'}`}>사진 추가</p>
                                    </div>
                                )}
                                <input ref={el => { fileRefs.current[i] = el; }}
                                    type="file" accept="image/*" className="hidden"
                                    onChange={e => handleFileChange(i, e)} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="lg:w-72 space-y-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm h-fit">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="text-base">&#9881;</span> 콜라주 설정
                </h3>

                {/* Layout */}
                <div>
                    <label className="text-xs font-medium text-slate-500 mb-2 block flex items-center gap-1">
                        <LayoutGrid size={12} /> 레이아웃
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                        {LAYOUTS.map(l => (
                            <button key={l.key} onClick={() => handleLayoutChange(l.key)}
                                className={`py-2 rounded-lg text-xs font-bold transition-all border ${layout === l.key
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'}`}>
                                {l.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ratio */}
                <div>
                    <label className="text-xs font-medium text-slate-500 mb-2 block">콜라주 비율</label>
                    <div className="flex gap-2">
                        {(['3:4', '4:3'] as const).map(r => (
                            <button key={r} onClick={() => setRatio(r)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${ratio === r
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'}`}>
                                {r === '3:4' ? '3 : 4 (세로)' : '4 : 3 (가로)'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Spacing */}
                <div>
                    <label className="text-xs font-medium text-slate-500 mb-2 block">여백</label>
                    <input type="range" min={0} max={20} value={spacing}
                        onChange={e => setSpacing(Number(e.target.value))}
                        className="w-full accent-indigo-600" />
                </div>

                {/* BG Color */}
                <div>
                    <label className="text-xs font-medium text-slate-500 mb-2 block">배경색</label>
                    <div className="flex gap-2">
                        {BG_COLORS.map(c => (
                            <button key={c.value} onClick={() => setBgColor(c.value)}
                                className={`w-9 h-9 rounded-full transition-all ${bgColor === c.value ? 'ring-2 ring-indigo-500 ring-offset-2' : ''} ${c.border ? 'border border-slate-200' : ''}`}
                                style={{ backgroundColor: c.value }}
                                title={c.label} />
                        ))}
                    </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2 pt-2">
                    <button onClick={handleFinalize} disabled={!hasAnyImage}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                        <Check size={16} /> 사진 확정하기
                    </button>
                    <button onClick={reset}
                        className="w-full py-3 text-slate-400 font-medium rounded-xl hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm">
                        <RotateCcw size={14} /> 초기화
                    </button>
                </div>
            </div>
        </div>
    );
}
