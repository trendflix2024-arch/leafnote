"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useBookStore, useCurrentProject } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ArrowRight, ArrowLeft, BookOpen, PenTool, LayoutTemplate, AlignLeft, Info, Palette, Type, ArrowUpToLine, AlignVerticalJustifyCenter, ArrowDownToLine, ChevronDown, Italic, SlidersHorizontal, ZoomIn, ZoomOut, Ruler, Save, Home, Check, Upload, Undo2, Redo2 } from 'lucide-react';
import ProgressStepper from '@/components/ProgressStepper';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const VISUAL_STYLES = [
    { key: 'minimalist', label: '미니멀리즘', icon: '◻️', desc: '여백의 미, 심플한 오브제' },
    { key: 'illustration', label: '감성 일러스트', icon: '🎨', desc: '수채화, 따뜻한 손그림' },
    { key: 'photographic', label: '포토그래픽', icon: '📷', desc: '실사 사진, 시네마틱' },
    { key: 'vintage', label: '빈티지 & 레트로', icon: '📜', desc: '빛바랜 질감, 클래식' },
    { key: 'typographic', label: '타이포그래피', icon: '🔤', desc: '글꼴 중심, 세련된 배치' },
];

const MOOD_TONES = [
    { key: 'warm', label: '따뜻하고 잔잔한', icon: '🌅' },
    { key: 'serious', label: '진지하고 묵직한', icon: '🌑' },
    { key: 'bright', label: '밝고 경쾌한', icon: '🎉' },
    { key: 'dreamy', label: '신비롭고 몽환적인', icon: '🌌' },
];

type FontCategory = 'serif' | 'sans' | 'hand' | 'all';

const KOREAN_FONTS = [
    // 명조/바탕 계열
    { name: 'Noto Serif KR', label: '본명조', family: '"Noto Serif KR", serif', category: 'serif' as const },
    { name: 'Nanum Myeongjo', label: '나눔명조', family: '"Nanum Myeongjo", serif', category: 'serif' as const },
    { name: 'Gowun Batang', label: '고운바탕', family: '"Gowun Batang", serif', category: 'serif' as const },
    { name: 'Song Myung', label: '송명', family: '"Song Myung", serif', category: 'serif' as const },
    { name: 'Hahmlet', label: '함렛', family: '"Hahmlet", serif', category: 'serif' as const },
    // 고딕/돋움 계열
    { name: 'Noto Sans KR', label: '본고딕', family: '"Noto Sans KR", sans-serif', category: 'sans' as const },
    { name: 'Nanum Gothic', label: '나눔고딕', family: '"Nanum Gothic", sans-serif', category: 'sans' as const },
    { name: 'Gothic A1', label: 'Gothic A1', family: '"Gothic A1", sans-serif', category: 'sans' as const },
    { name: 'IBM Plex Sans KR', label: 'IBM Plex', family: '"IBM Plex Sans KR", sans-serif', category: 'sans' as const },
    { name: 'Gowun Dodum', label: '고운돋움', family: '"Gowun Dodum", sans-serif', category: 'sans' as const },
    { name: 'Black Han Sans', label: '검은한산스', family: '"Black Han Sans", sans-serif', category: 'sans' as const },
    { name: 'Do Hyeon', label: '도현', family: '"Do Hyeon", sans-serif', category: 'sans' as const },
    { name: 'Orbit', label: '오르빗', family: '"Orbit", sans-serif', category: 'sans' as const },
    // 손글씨/개성 계열
    { name: 'Nanum Pen Script', label: '나눔펜', family: '"Nanum Pen Script", cursive', category: 'hand' as const },
    { name: 'Nanum Brush Script', label: '나눔붓', family: '"Nanum Brush Script", cursive', category: 'hand' as const },
    { name: 'Gamja Flower', label: '감자꽃', family: '"Gamja Flower", cursive', category: 'hand' as const },
    { name: 'Jua', label: '주아', family: '"Jua", sans-serif', category: 'hand' as const },
    { name: 'Poor Story', label: '푸어스토리', family: '"Poor Story", cursive', category: 'hand' as const },
    { name: 'Gaegu', label: '개구', family: '"Gaegu", cursive', category: 'hand' as const },
    { name: 'East Sea Dokdo', label: '동해독도', family: '"East Sea Dokdo", cursive', category: 'hand' as const },
    { name: 'Sunflower', label: '해바라기', family: '"Sunflower", sans-serif', category: 'hand' as const },
    { name: 'Single Day', label: '싱글데이', family: '"Single Day", cursive', category: 'hand' as const },
    { name: 'Stylish', label: '스타일리시', family: '"Stylish", sans-serif', category: 'hand' as const },
    { name: 'Bagel Fat One', label: '베이글팻원', family: '"Bagel Fat One", cursive', category: 'hand' as const },
];

const loadGoogleFont = (fontName: string) => {
    if (typeof document === 'undefined') return;
    const id = `gfont-${fontName.replace(/\s+/g, '-')}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@100;300;400;500;700;900&display=swap`;
    document.head.appendChild(link);
};

const BOOK_FORMATS = [
    { key: 'b6', label: '4×6판(B6)', w: 128, h: 188, desc: '시, 에세이' },
    { key: 'irregular', label: '다짜판', w: 128, h: 210, desc: '시' },
    { key: 'a5', label: '국판(A5)', w: 148, h: 210, desc: '소설, 시, 수필' },
    { key: 'a5v', label: '국판변형', w: 136, h: 200, desc: '소설, 시, 수필' },
    { key: 'shinkook', label: '신국판', w: 152, h: 224, desc: '경제·경영, 전문서적' },
    { key: 'shinkookv', label: '신국판변형', w: 152, h: 205, desc: '경제·경영, 전문서적' },
    { key: 'crown', label: '크라운판', w: 170, h: 245, desc: '교재, 실용서' },
    { key: 'b5', label: '4×6배판(B5)', w: 182, h: 257, desc: '교재, 실용서' },
    { key: 'a4', label: '국배판(A4)', w: 210, h: 297, desc: '교재, 실용서' },
];

const GENRE_TEMPLATES = [
    {
        key: 'autobiography', label: '자서전', icon: '📖',
        colors: { primary: '#1e3a5f', secondary: '#0f2340', accent: '#c9a84c', textFront: '#f0e6d3', textSpine: '#f0e6d3' },
        font: 'Nanum Myeongjo', textPosition: 'center' as const,
        titleStyle: { size: 32, weight: 700, spacing: 2, lineHeight: 130, italic: false, transform: 'none' as const },
        bgBrightness: 55,
    },
    {
        key: 'essay', label: '에세이', icon: '✍️',
        colors: { primary: '#f5f0e8', secondary: '#e8ddd0', accent: '#8b5e3c', textFront: '#3d2b1f', textSpine: '#3d2b1f' },
        font: 'Gowun Batang', textPosition: 'bottom' as const,
        titleStyle: { size: 26, weight: 400, spacing: 8, lineHeight: 150, italic: false, transform: 'none' as const },
        bgBrightness: 90,
    },
    {
        key: 'travel', label: '여행기', icon: '✈️',
        colors: { primary: '#2d4a3e', secondary: '#1a2e27', accent: '#f0c040', textFront: '#f9f5e9', textSpine: '#f9f5e9' },
        font: 'Noto Serif KR', textPosition: 'top' as const,
        titleStyle: { size: 28, weight: 700, spacing: 4, lineHeight: 140, italic: false, transform: 'uppercase' as const },
        bgBrightness: 50,
    },
    {
        key: 'love', label: '사랑이야기', icon: '💌',
        colors: { primary: '#6b2d3e', secondary: '#4a1f2b', accent: '#f4b8c1', textFront: '#fff0f3', textSpine: '#fff0f3' },
        font: 'Hahmlet', textPosition: 'center' as const,
        titleStyle: { size: 30, weight: 400, spacing: 6, lineHeight: 155, italic: true, transform: 'none' as const },
        bgBrightness: 55,
    },
    {
        key: 'memoir', label: '회고록', icon: '🏛️',
        colors: { primary: '#2c2c2c', secondary: '#1a1a1a', accent: '#d4af37', textFront: '#f5f5f5', textSpine: '#f5f5f5' },
        font: 'Noto Sans KR', textPosition: 'center' as const,
        titleStyle: { size: 26, weight: 700, spacing: 15, lineHeight: 130, italic: false, transform: 'uppercase' as const },
        bgBrightness: 40,
    },
    {
        key: 'family', label: '가족이야기', icon: '👨‍👩‍👧',
        colors: { primary: '#5c4033', secondary: '#3d2a22', accent: '#e8c49a', textFront: '#fdf6ee', textSpine: '#fdf6ee' },
        font: 'Gowun Batang', textPosition: 'bottom' as const,
        titleStyle: { size: 28, weight: 700, spacing: 3, lineHeight: 145, italic: false, transform: 'none' as const },
        bgBrightness: 60,
    },
];

type OrnamentKey = 'none' | 'thin-line' | 'double-line' | 'corner' | 'vintage-border' | 'diamond';

export default function DesignPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const currentProject = useCurrentProject();
    const { setCoverDesign, setCoverImageUrl } = useBookStore();

    const [isGenerating, setIsGenerating] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false); // To track the actual image load
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);

    // Style Selection State
    const [visualStyle, setVisualStyle] = useState<string | null>(null);
    const [moodTone, setMoodTone] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // User Input State
    const [formData, setFormData] = useState({
        concept: '',
        frontDesc: '',
        spineDesc: '',
        backDesc: ''
    });

    // Viewer State
    const [viewAngle, setViewAngle] = useState<'front' | 'spine' | 'back' | '2d'>('2d');
    const [bookFormat] = useState(
        () => (currentProject?.coverDesign?.params as any)?.bookFormat ?? 'shinkook'
    );
    const [zoomLevel, setZoomLevel] = useState(1);

    // Typography and Layout State
    const [selectedFont, setSelectedFont] = useState('Noto Serif KR');
    const [fontCategory, setFontCategory] = useState<FontCategory>('all');
    const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('center');
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
    const [customTextColor, setCustomTextColor] = useState<string | null>(null);
    const [customAccentColor, setCustomAccentColor] = useState<string | null>(null);

    // Per-element typography styles
    const [editTarget, setEditTarget] = useState<'title' | 'subtitle' | 'backBlurb' | 'spineTitle' | 'author'>('title');
    const [titleStyle, setTitleStyle] = useState({ size: 28, weight: 700, spacing: 0, lineHeight: 140, italic: false, transform: 'none' as 'none' | 'uppercase' | 'lowercase' });
    const [subtitleStyle, setSubtitleStyle] = useState({ size: 12, weight: 400, spacing: 5, lineHeight: 150, italic: false, transform: 'uppercase' as 'none' | 'uppercase' | 'lowercase' });
    const [authorStyle, setAuthorStyle] = useState({ size: 16, weight: 400, spacing: 8, lineHeight: 140, italic: false, transform: 'none' as 'none' | 'uppercase' | 'lowercase' });
    const [backBlurbStyle, setBackBlurbStyle] = useState({ size: 14, weight: 400, spacing: 0, lineHeight: 170, italic: false, transform: 'none' as 'none' | 'uppercase' | 'lowercase' });
    const [spineTitleStyle, setSpineTitleStyle] = useState({ size: 12, weight: 700, spacing: 10, lineHeight: 140, italic: false, transform: 'none' as 'none' | 'uppercase' | 'lowercase' });

    // Effects
    const [textShadow, setTextShadow] = useState(false);
    const [bgBrightness, setBgBrightness] = useState(60);

    // Editable generated texts
    const [editTexts, setEditTexts] = useState({ title: '', frontSubtitle: '', backBlurb: '', spineTitle: '', author: '' });

    const [isSaved, setIsSaved] = useState(false);

    // Local image upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingBg, setIsUploadingBg] = useState(false);

    // Design Undo/Redo
    type DesignSnapshot = {
        designParams: any; selectedFont: string; textPosition: 'top' | 'center' | 'bottom';
        textAlign: 'left' | 'center' | 'right'; titleStyle: typeof titleStyle;
        subtitleStyle: typeof subtitleStyle; authorStyle: typeof authorStyle;
        bgBrightness: number; textShadow: boolean; customTextColor: string | null;
        customAccentColor: string | null; textGroupPos: { x: number; y: number } | null;
        selectedOrnament: OrnamentKey; bgImageUrl: string | null;
    };
    const [designHistory, setDesignHistory] = useState<DesignSnapshot[]>([]);
    const [designHistoryIndex, setDesignHistoryIndex] = useState(-1);

    // Drag text group positioning
    const frontCoverRef = useRef<HTMLDivElement>(null);
    const [textGroupPos, setTextGroupPos] = useState<{ x: number; y: number } | null>(
        currentProject?.coverDesign?.params?.textGroupPos || null
    );
    const [isDraggingText, setIsDraggingText] = useState(false);
    const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; elemX: number; elemY: number } | null>(null);

    // Ornament overlay
    const [selectedOrnament, setSelectedOrnament] = useState<OrnamentKey>(
        currentProject?.coverDesign?.params?.selectedOrnament || 'none'
    );

    // Design generated by AI
    const [designParams, setDesignParams] = useState<any>(currentProject?.coverDesign?.params || null);

    // Load default font on mount + initialize editable title/author
    useEffect(() => {
        loadGoogleFont('Noto Serif KR');
        if (currentProject) {
            setEditTexts(prev => ({
                ...prev,
                title: prev.title || currentProject.title || '',
                author: prev.author || currentProject.author || '',
            }));
        }
    }, [currentProject]);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status, router]);

    // Redirect if no project selected
    useEffect(() => {
        if (status === 'authenticated' && !currentProject) router.push('/dashboard');
    }, [currentProject, status, router]);

    if (status === 'loading' || !session || !currentProject) {
        return (
            <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500 w-8 h-8" />
            </div>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGenerate = async () => {
        pushDesignHistory();
        setIsGenerating(true);
        setViewAngle('2d');
        try {
            const res = await fetch('/api/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: currentProject.title,
                    author: currentProject.author,
                    visualStyle,
                    moodTone,
                    ...formData
                })
            });
            const data = await res.json();
            if (data.designParams) {
                setDesignParams(data.designParams);
                setCoverDesign({ params: data.designParams });

                // Update editable texts from AI
                if (data.designParams.generatedTexts) {
                    setEditTexts(prev => ({
                        title: prev.title || currentProject.title || '',
                        frontSubtitle: data.designParams.generatedTexts.frontSubtitle || '',
                        backBlurb: data.designParams.generatedTexts.backBlurb || '',
                        spineTitle: data.designParams.generatedTexts.spineTitle || '',
                        author: prev.author || currentProject.author || '',
                    }));
                }

                // Use Replicate image URL
                if (data.imageUrl) {
                    setBgImageUrl(data.imageUrl);
                    setCoverImageUrl(data.imageUrl);
                } else {
                    setBgImageUrl(null);
                }
            } else if (data.error) {
                alert(`디자인 생성 실패: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("디자인 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSuggest = async () => {
        if (!currentProject?.fullDraft) {
            alert("원고 내용이 부족하여 추천을 받기 어렵습니다. 인터뷰를 조금 더 진행하거나 원고를 작성해 주세요.");
            return;
        }
        setIsSuggesting(true);
        try {
            const res = await fetch('/api/suggest-cover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: currentProject.title,
                    author: currentProject.author,
                    content: currentProject.fullDraft
                })
            });
            const data = await res.json();
            if (data.suggestions) {
                setFormData({
                    concept: data.suggestions.concept || '',
                    frontDesc: data.suggestions.frontDesc || '',
                    spineDesc: data.suggestions.spineDesc || '',
                    backDesc: data.suggestions.backDesc || ''
                });
            } else if (data.error) {
                alert(`에코 추천 실패: ${data.error}`);
            }
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            alert("추천을 받아오는데 실패했습니다. 잠시 후 다시 시도해 주세요.");
        } finally {
            setIsSuggesting(false);
        }
    };

    // View angle is now 2D only (front/spine/back/2d)

    // --- Default Design Fallback ---
    const design = designParams || {
        colors: { primary: '#064e3b', secondary: '#022c22', accent: '#fbbf24', textFront: '#ecfdf5', textSpine: '#ecfdf5' },
        style: { texture: 'leather', layout: 'elegant' },
        generatedTexts: { frontSubtitle: "A story waiting to be told...", backBlurb: "질문 폼을 채워나눔으로써 세상에 하나뿐인 나만의 표지를 디자인해보세요. 에코는 당신의 이야기에 가장 잘 어울리는 색상과 텍스처를 찾아낼 것입니다.", spineTitle: currentProject.title }
    };

    const { colors, style, generatedTexts: aiTexts } = design;
    // Use editable texts if set, otherwise fall back to AI-generated
    const generatedTexts = {
        frontSubtitle: editTexts.frontSubtitle || aiTexts.frontSubtitle,
        backBlurb: editTexts.backBlurb || aiTexts.backBlurb,
        spineTitle: editTexts.spineTitle || aiTexts.spineTitle,
    };
    // Resolved colors (custom overrides AI)
    const resolvedTextColor = customTextColor || colors.textFront;
    const resolvedAccentColor = customAccentColor || colors.accent;
    const selectedFontFamily = KOREAN_FONTS.find(f => f.name === selectedFont)?.family || '"Noto Serif KR", serif';

    // Book format calculations
    const format = BOOK_FORMATS.find(f => f.key === bookFormat)!;
    const baseH = viewAngle === '2d' ? 400 : 540;
    const fmtScale = baseH / format.h;
    const panelW = Math.round(format.w * fmtScale);
    const panelH = baseH;
    const spineW = Math.round(panelW * 0.13);
    const formatScale = format.h / 225; // text scale relative to 신국판

    // Editable display values
    const displayTitle = editTexts.title || currentProject.title;
    const displayAuthor = editTexts.author || currentProject.author;

    const textureUrl = style.texture === 'leather'
        ? 'url("https://www.transparenttextures.com/patterns/leather.png")'
        : style.texture === 'canvas'
            ? 'url("https://www.transparenttextures.com/patterns/cream-paper.png")'
            : 'none';

    const saveCoverState = () => {
        setCoverDesign({
            params: {
                ...designParams,
                bgImageUrl: bgImageUrl || '',
                font: selectedFont,
                textPosition,
                textAlign,
                customTextColor: customTextColor || '',
                customAccentColor: customAccentColor || '',
                titleStyle,
                subtitleStyle,
                authorStyle,
                backBlurbStyle,
                spineTitleStyle,
                textShadow,
                bgBrightness,
                editTexts,
                bookFormat,
                textGroupPos,
                selectedOrnament,
            },
        });
        if (bgImageUrl) setCoverImageUrl(bgImageUrl);
    };

    const handleSave = () => {
        saveCoverState();
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handlePublish = () => {
        saveCoverState();
        router.push('/export');
    };

    const captureSnapshot = useCallback((): DesignSnapshot => ({
        designParams, selectedFont, textPosition, textAlign,
        titleStyle, subtitleStyle, authorStyle,
        bgBrightness, textShadow, customTextColor, customAccentColor,
        textGroupPos, selectedOrnament, bgImageUrl,
    }), [designParams, selectedFont, textPosition, textAlign, titleStyle, subtitleStyle, authorStyle, bgBrightness, textShadow, customTextColor, customAccentColor, textGroupPos, selectedOrnament, bgImageUrl]);

    const pushDesignHistory = useCallback(() => {
        const snap = captureSnapshot();
        setDesignHistory(prev => {
            const trimmed = prev.slice(0, designHistoryIndex + 1);
            return [...trimmed, snap].slice(-30);
        });
        setDesignHistoryIndex(prev => Math.min(prev + 1, 29));
    }, [captureSnapshot, designHistoryIndex]);

    const applySnapshot = (snap: DesignSnapshot) => {
        setDesignParams(snap.designParams);
        setSelectedFont(snap.selectedFont);
        setTextPosition(snap.textPosition);
        setTextAlign(snap.textAlign);
        setTitleStyle(snap.titleStyle);
        setSubtitleStyle(snap.subtitleStyle);
        setAuthorStyle(snap.authorStyle);
        setBgBrightness(snap.bgBrightness);
        setTextShadow(snap.textShadow);
        setCustomTextColor(snap.customTextColor);
        setCustomAccentColor(snap.customAccentColor);
        setTextGroupPos(snap.textGroupPos);
        setSelectedOrnament(snap.selectedOrnament);
        setBgImageUrl(snap.bgImageUrl);
    };

    const handleUndo = () => {
        if (designHistoryIndex <= 0) return;
        const newIndex = designHistoryIndex - 1;
        applySnapshot(designHistory[newIndex]);
        setDesignHistoryIndex(newIndex);
    };

    const handleRedo = () => {
        if (designHistoryIndex >= designHistory.length - 1) return;
        const newIndex = designHistoryIndex + 1;
        applySnapshot(designHistory[newIndex]);
        setDesignHistoryIndex(newIndex);
    };

    const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        pushDesignHistory();
        setIsUploadingBg(true);
        try {
            const ext = file.name.split('.').pop();
            const fileName = `cover-bg-${Date.now()}.${ext}`;
            const { data, error } = await supabase.storage
                .from('cover-images')
                .upload(fileName, file, { upsert: true });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('cover-images').getPublicUrl(data.path);
            setBgImageUrl(publicUrl);
            setCoverImageUrl(publicUrl);
        } catch (err) {
            console.error('Image upload failed:', err);
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setIsUploadingBg(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const applyGenreTemplate = (tmpl: typeof GENRE_TEMPLATES[0]) => {
        pushDesignHistory();
        setDesignParams((prev: any) => ({ ...(prev || {}), colors: tmpl.colors }));
        setSelectedFont(tmpl.font);
        loadGoogleFont(tmpl.font);
        setTextPosition(tmpl.textPosition);
        setTitleStyle(prev => ({ ...prev, ...tmpl.titleStyle }));
        setBgBrightness(tmpl.bgBrightness);
        setTextGroupPos(null);
    };

    const handleTextMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const rect = frontCoverRef.current?.getBoundingClientRect();
        if (!rect) return;
        const currentX = textGroupPos ? textGroupPos.x : 50;
        const currentY = textGroupPos ? textGroupPos.y : (textPosition === 'top' ? 22 : textPosition === 'bottom' ? 78 : 50);
        setDragStart({ mouseX: e.clientX, mouseY: e.clientY, elemX: currentX, elemY: currentY });
        setIsDraggingText(true);
    };

    const handleCoverMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingText || !dragStart || !frontCoverRef.current) return;
        const rect = frontCoverRef.current.getBoundingClientRect();
        const dx = ((e.clientX - dragStart.mouseX) / rect.width) * 100;
        const dy = ((e.clientY - dragStart.mouseY) / rect.height) * 100;
        setTextGroupPos({
            x: Math.max(5, Math.min(95, dragStart.elemX + dx)),
            y: Math.max(5, Math.min(95, dragStart.elemY + dy)),
        });
    };

    const handleCoverMouseUp = () => {
        setIsDraggingText(false);
        setDragStart(null);
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
            <ProgressStepper />
            <header className="p-4 md:p-6 border-b bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center sticky top-0 z-50 shadow-sm gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-serif font-bold text-slate-800">표지 디자인</h1>
                    <p className="text-xs text-slate-400">에코(AI)와 함께 나만의 표지를 디자인합니다.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="hidden sm:flex text-slate-500 hover:text-slate-800">
                        <Home className="mr-1 h-4 w-4" /> 대시보드
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleUndo} disabled={designHistoryIndex <= 0} title="실행 취소" className="hidden sm:flex">
                        <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleRedo} disabled={designHistoryIndex >= designHistory.length - 1} title="다시 실행" className="hidden sm:flex">
                        <Redo2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSave} className="flex-1 sm:flex-none">
                        {isSaved ? <><Check className="mr-1 h-4 w-4 text-emerald-500" /> 저장됨</> : <><Save className="mr-1 h-4 w-4" /> 저장</>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push('/editor')} className="flex-1 sm:flex-none">
                        <ArrowLeft className="mr-1 h-4 w-4" /> 원고 교정
                    </Button>
                    <Button size="sm" onClick={handlePublish} className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 text-white shadow-md">
                        출판 및 배포 <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>
            </header>

            <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8">

                {/* Left: Input Form */}
                <aside className="w-full lg:w-[450px] flex flex-col gap-6 shrink-0 lg:h-[calc(100vh-140px)] lg:overflow-y-auto pr-0 lg:pr-2 pb-8 scrollbar-hide">
                    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-emerald-900/5 border border-emerald-100">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Sparkles className="text-emerald-600 h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 break-keep">AI 커버 디자이너, 에코</h2>
                                <p className="text-sm text-slate-500 font-medium break-keep">원하시는 책의 느낌을 알려주세요.</p>
                            </div>
                        </div>

                        <Button
                            onClick={handleSuggest}
                            disabled={isSuggesting || isGenerating}
                            className="w-full mb-6 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl py-6 font-bold text-sm sm:text-base shadow-sm hover:shadow transition-all group relative overflow-hidden"
                            variant="outline"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/0 via-emerald-100/30 to-emerald-100/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                            {isSuggesting ? (
                                <><Loader2 className="animate-spin mr-2 h-5 w-5" /> 에코가 원고를 읽고 아이디어를 떠올리는 중...</>
                            ) : (
                                <><Sparkles className="mr-2 h-5 w-5 text-emerald-500" /> ✨ 인터뷰 내용을 바탕으로 에코에게 추천받기</>
                            )}
                        </Button>

                        <div className="space-y-5">
                            {/* Visual Style Selection - Pill */}
                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2.5 block">표현 스타일</label>
                                <div className="flex flex-wrap gap-2">
                                    {VISUAL_STYLES.map(s => (
                                        <button
                                            key={s.key}
                                            onClick={() => setVisualStyle(visualStyle === s.key ? null : s.key)}
                                            className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${visualStyle === s.key
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            <span className="mr-1">{s.icon}</span>{s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mood & Tone Selection - Pill */}
                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2.5 block">분위기</label>
                                <div className="flex flex-wrap gap-2">
                                    {MOOD_TONES.map(m => (
                                        <button
                                            key={m.key}
                                            onClick={() => setMoodTone(moodTone === m.key ? null : m.key)}
                                            className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${moodTone === m.key
                                                ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            <span className="mr-1">{m.icon}</span>{m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Collapsible Details */}
                            <div className="border-t border-slate-100 pt-3">
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors w-full"
                                >
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                                    세부 요청사항 (선택)
                                </button>
                                {showDetails && (
                                    <div className="mt-3 space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">컨셉 설명</label>
                                            <input
                                                name="concept" value={formData.concept} onChange={handleInputChange}
                                                placeholder="예: 따뜻하고 부드러운 가을 느낌"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">앞면 요구사항</label>
                                            <input
                                                name="frontDesc" value={formData.frontDesc} onChange={handleInputChange}
                                                placeholder="예: 제목을 중앙에 크게 배치"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">책등 요구사항</label>
                                            <input
                                                name="spineDesc" value={formData.spineDesc} onChange={handleInputChange}
                                                placeholder="예: 깔끔한 고딕체로 세로 줄바꿈 없이"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">뒷면 요구사항</label>
                                            <input
                                                name="backDesc" value={formData.backDesc} onChange={handleInputChange}
                                                placeholder="예: 독자에게 건네는 따뜻한 위로의 한마디"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating || isImageLoading || (!visualStyle && !moodTone && !formData.concept)}
                                className="w-full h-14 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all mt-2"
                            >
                                {isGenerating || isImageLoading ? (
                                    <><Loader2 className="animate-spin mr-2 h-5 w-5" /> {isImageLoading ? 'AI 배경 그리는 중...' : '커버 디자인 생성 중...'}</>
                                ) : (
                                    <><PenTool className="mr-2 h-5 w-5" /> 에코에게 커버 디자인 맡기기</>
                                )}
                            </Button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingBg}
                                className="w-full mt-2 border-dashed border-2 border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-700 rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                            >
                                {isUploadingBg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                {isUploadingBg ? '업로드 중...' : '내 사진으로 배경 설정'}
                            </button>
                            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleBgImageUpload} className="hidden" />
                        </div>
                    </div>

                    {/* 디자인 직접하기 */}
                    <div className="bg-white rounded-3xl p-6 shadow-xl shadow-emerald-900/5 border border-emerald-100 flex flex-col gap-4">
                        <div className="flex items-center gap-3 mb-2 pb-4 border-b border-slate-100">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                <PenTool className="text-slate-600 h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 break-keep">디자인 직접하기</h2>
                                <p className="text-sm text-slate-500 font-medium break-keep">서체, 배치, 스타일을 직접 조절합니다.</p>
                            </div>
                        </div>

                        {/* 장르 템플릿 */}
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <LayoutTemplate className="h-4 w-4 text-emerald-500" /> 장르 템플릿
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {GENRE_TEMPLATES.map(tmpl => (
                                <button
                                    key={tmpl.key}
                                    onClick={() => applyGenreTemplate(tmpl)}
                                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-xs font-bold text-slate-600 hover:text-emerald-700"
                                >
                                    <span className="text-xl">{tmpl.icon}</span>
                                    {tmpl.label}
                                </button>
                            ))}
                        </div>

                        {/* 판형 */}
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-emerald-500" /> 판형
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-white">
                                {BOOK_FORMATS.find(f => f.key === bookFormat)?.label ?? '신국판'}
                            </span>
                            <span className="text-xs text-slate-400">
                                {format.w}×{format.h}mm · {format.desc}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 -mt-1">판형은 원고 편집 단계에서 변경할 수 있습니다.</p>

                        {/* 장식 요소 */}
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-1">
                            <Sparkles className="h-4 w-4 text-emerald-500" /> 장식 요소
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {(['none', 'thin-line', 'double-line', 'corner', 'vintage-border', 'diamond'] as OrnamentKey[]).map(key => {
                                const labels: Record<OrnamentKey, string> = { none: '없음', 'thin-line': '가는선', 'double-line': '이중선', corner: '코너', 'vintage-border': '빈티지', diamond: '다이아' };
                                return (
                                    <button key={key} onClick={() => setSelectedOrnament(key)}
                                        className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${selectedOrnament === key ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                                        {labels[key]}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 서체 */}
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-1">
                            <Type className="h-4 w-4 text-emerald-500" /> 서체 <span className="text-xs text-slate-400 font-normal">({KOREAN_FONTS.length}종)</span>
                        </h3>
                        <div className="grid grid-cols-4 gap-1">
                            {([['all', '전체'], ['serif', '명조'], ['sans', '고딕'], ['hand', '손글씨']] as const).map(([cat, label]) => (
                                <button key={cat} onClick={() => setFontCategory(cat)} className={`h-8 rounded-lg text-xs font-bold transition-all ${fontCategory === cat ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="max-h-[200px] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 divide-y divide-slate-100">
                            {KOREAN_FONTS.filter(f => fontCategory === 'all' || f.category === fontCategory).map(font => (
                                <button
                                    key={font.name}
                                    onClick={() => { loadGoogleFont(font.name); setSelectedFont(font.name); }}
                                    onMouseEnter={() => loadGoogleFont(font.name)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-all hover:bg-emerald-50 ${selectedFont === font.name ? 'bg-emerald-50 border-l-2 border-emerald-500' : ''}`}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] text-slate-400">{font.label}</span>
                                        <span className="text-sm text-slate-700" style={{ fontFamily: font.family }}>가나다라 Book</span>
                                    </div>
                                    {selectedFont === font.name && <span className="text-emerald-600 text-xs font-bold">✓</span>}
                                </button>
                            ))}
                        </div>

                        {/* 배치 */}
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-1">
                            <LayoutTemplate className="h-4 w-4 text-emerald-500" /> 배치
                        </h3>
                        {textGroupPos && (
                            <button onClick={() => setTextGroupPos(null)} className="text-xs text-emerald-600 hover:text-emerald-800 font-bold -mt-2 flex items-center gap-1">
                                ↺ 텍스트 위치 초기화
                            </button>
                        )}
                        <p className="text-[10px] text-slate-400 -mt-1">앞면 텍스트를 드래그하여 자유롭게 배치하세요</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">위치</label>
                                <div className="grid grid-cols-3 gap-1">
                                    <button onClick={() => setTextPosition('top')} className={`h-8 rounded-lg flex items-center justify-center ${textPosition === 'top' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><ArrowUpToLine className="h-4 w-4" /></button>
                                    <button onClick={() => setTextPosition('center')} className={`h-8 rounded-lg flex items-center justify-center ${textPosition === 'center' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><AlignVerticalJustifyCenter className="h-4 w-4" /></button>
                                    <button onClick={() => setTextPosition('bottom')} className={`h-8 rounded-lg flex items-center justify-center ${textPosition === 'bottom' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><ArrowDownToLine className="h-4 w-4" /></button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">정렬</label>
                                <div className="grid grid-cols-3 gap-1">
                                    {(['left', 'center', 'right'] as const).map(a => (
                                        <button key={a} onClick={() => setTextAlign(a)} className={`h-8 rounded-lg text-xs font-bold transition-all ${textAlign === a ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                            {a === 'left' ? '왼쪽' : a === 'center' ? '중앙' : '오른쪽'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 요소별 스타일 */}
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-1">
                            <SlidersHorizontal className="h-4 w-4 text-emerald-500" /> 요소별 스타일
                        </h3>
                        <div className="grid grid-cols-5 gap-1">
                            {([['title', '제목'], ['subtitle', '부제'], ['backBlurb', '추천사'], ['spineTitle', '책등'], ['author', '저자']] as const).map(([key, label]) => (
                                <button key={key} onClick={() => setEditTarget(key)} className={`h-9 rounded-lg text-xs font-bold transition-all ${editTarget === key ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                        {(() => {
                            const styleMap = { title: titleStyle, subtitle: subtitleStyle, backBlurb: backBlurbStyle, spineTitle: spineTitleStyle, author: authorStyle };
                            const setterMap = { title: setTitleStyle, subtitle: setSubtitleStyle, backBlurb: setBackBlurbStyle, spineTitle: setSpineTitleStyle, author: setAuthorStyle };
                            const sizeRangeMap: Record<string, [number, number]> = { title: [16, 48], subtitle: [8, 24], backBlurb: [10, 28], spineTitle: [8, 24], author: [10, 28] };
                            const current = styleMap[editTarget];
                            const setCurrent = setterMap[editTarget];
                            const update = (field: string, val: number | boolean | string) => setCurrent(prev => ({ ...prev, [field]: val }));
                            const sizeRange = sizeRangeMap[editTarget];
                            const WEIGHT_LABELS: Record<number, string> = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };

                            return (
                                <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-bold text-slate-500">크기</span>
                                            <span className="text-slate-400 tabular-nums">{current.size}px</span>
                                        </div>
                                        <input type="range" min={sizeRange[0]} max={sizeRange[1]} step={1} value={current.size} onChange={e => update('size', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-bold text-slate-500">굵기</span>
                                            <span className="text-slate-400 tabular-nums">{WEIGHT_LABELS[current.weight] || current.weight}</span>
                                        </div>
                                        <input type="range" min={100} max={900} step={100} value={current.weight} onChange={e => update('weight', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-bold text-slate-500">자간</span>
                                            <span className="text-slate-400 tabular-nums">{(current.spacing / 100).toFixed(2)}em</span>
                                        </div>
                                        <input type="range" min={-5} max={30} step={1} value={current.spacing} onChange={e => update('spacing', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-bold text-slate-500">줄간격</span>
                                            <span className="text-slate-400 tabular-nums">{current.lineHeight}%</span>
                                        </div>
                                        <input type="range" min={100} max={220} step={5} value={current.lineHeight} onChange={e => update('lineHeight', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600" />
                                    </div>
                                    <div className="flex gap-3 items-center pt-1">
                                        <button onClick={() => update('italic', !current.italic)} className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${current.italic ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                                            <Italic className="h-3.5 w-3.5" /> 이탤릭
                                        </button>
                                        <div className="flex gap-1 flex-1">
                                            {([['none', 'Aa'], ['uppercase', 'ABC'], ['lowercase', 'abc']] as const).map(([val, label]) => (
                                                <button key={val} onClick={() => update('transform', val)} className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all ${current.transform === val ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 텍스트 편집 */}
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-1">
                            <AlignLeft className="h-4 w-4 text-emerald-500" /> 텍스트 편집
                        </h3>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">책 제목</label>
                            <input value={editTexts.title} onChange={e => setEditTexts(p => ({ ...p, title: e.target.value }))} placeholder={currentProject.title} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">부제</label>
                            <input value={editTexts.frontSubtitle} onChange={e => setEditTexts(p => ({ ...p, frontSubtitle: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">뒷면 추천사</label>
                            <textarea value={editTexts.backBlurb} onChange={e => setEditTexts(p => ({ ...p, backBlurb: e.target.value }))} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">책등 제목</label>
                            <input value={editTexts.spineTitle} onChange={e => setEditTexts(p => ({ ...p, spineTitle: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">작가명</label>
                            <input value={editTexts.author} onChange={e => setEditTexts(p => ({ ...p, author: e.target.value }))} placeholder={currentProject.author} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>

                        {/* 효과 */}
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-1">
                            <Sparkles className="h-4 w-4 text-emerald-500" /> 효과
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-500">텍스트 그림자</label>
                                <button onClick={() => setTextShadow(!textShadow)} className={`h-7 px-3 rounded-full text-xs font-bold transition-all ${textShadow ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                    {textShadow ? 'ON' : 'OFF'}
                                </button>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-bold text-slate-500">배경 밝기</span>
                                    <span className="text-slate-400 tabular-nums">{bgBrightness}%</span>
                                </div>
                                <input type="range" min={20} max={100} step={5} value={bgBrightness} onChange={e => setBgBrightness(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600" />
                            </div>
                        </div>

                        {/* 색상 */}
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mt-1">
                            <Palette className="h-4 w-4 text-emerald-500" /> 색상
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">제목색</label>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCustomTextColor(null)} className={`h-8 w-8 rounded-lg border-2 ${!customTextColor ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200'}`} style={{ backgroundColor: colors.textFront }} title="AI 추천" />
                                    <input type="color" value={customTextColor || colors.textFront} onChange={e => setCustomTextColor(e.target.value)} className="h-8 w-8 rounded-lg cursor-pointer border-0 p-0" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block">강조색</label>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCustomAccentColor(null)} className={`h-8 w-8 rounded-lg border-2 ${!customAccentColor ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200'}`} style={{ backgroundColor: colors.accent }} title="AI 추천" />
                                    <input type="color" value={customAccentColor || colors.accent} onChange={e => setCustomAccentColor(e.target.value)} className="h-8 w-8 rounded-lg cursor-pointer border-0 p-0" />
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right: Book Preview */}
                <div className="flex-1 min-h-[400px] sm:min-h-[500px] lg:h-[calc(100vh-140px)] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 rounded-3xl relative overflow-hidden flex flex-col items-center border border-slate-200 shadow-inner">

                    {/* 2D Book Preview */}
                    <div className="flex-1 w-full flex items-center justify-center overflow-auto p-4">
                        <div className="transition-transform duration-300 origin-center" style={{ transform: `scale(${zoomLevel})` }}>
                            <div className="flex items-stretch gap-0 shadow-2xl overflow-hidden transition-all duration-500">
                                {/* 2D FRONT */}
                                {(viewAngle === '2d' || viewAngle === 'front') && <div
                                    ref={frontCoverRef}
                                    className="relative overflow-hidden"
                                    style={{
                                        width: `${viewAngle === 'front' ? Math.round(panelW * 1.35) : panelW}px`,
                                        height: `${viewAngle === 'front' ? Math.round(panelH * 1.35) : panelH}px`,
                                        background: bgImageUrl ? `url(${bgImageUrl}) center/cover no-repeat` : `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                                        cursor: isDraggingText ? 'grabbing' : 'default',
                                    }}
                                    onMouseMove={handleCoverMouseMove}
                                    onMouseUp={handleCoverMouseUp}
                                    onMouseLeave={handleCoverMouseUp}
                                >
                                    {bgImageUrl && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(100 - bgBrightness) / 100})` }}></div>}
                                    <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundImage: textureUrl }}></div>

                                    {/* Ornament overlay */}
                                    {selectedOrnament === 'thin-line' && (
                                        <div style={{ position: 'absolute', top: '20%', left: '8%', right: '8%', height: 1, backgroundColor: resolvedAccentColor, opacity: 0.6, zIndex: 5 }} />
                                    )}
                                    {selectedOrnament === 'double-line' && (<>
                                        <div style={{ position: 'absolute', top: '18%', left: '8%', right: '8%', height: 1, backgroundColor: resolvedAccentColor, opacity: 0.5, zIndex: 5 }} />
                                        <div style={{ position: 'absolute', top: '21%', left: '8%', right: '8%', height: 1, backgroundColor: resolvedAccentColor, opacity: 0.5, zIndex: 5 }} />
                                    </>)}
                                    {selectedOrnament === 'corner' && (<>
                                        <div style={{ position: 'absolute', top: 12, left: 12, width: 28, height: 28, borderTop: `2px solid ${resolvedAccentColor}`, borderLeft: `2px solid ${resolvedAccentColor}`, opacity: 0.7, zIndex: 5 }} />
                                        <div style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderTop: `2px solid ${resolvedAccentColor}`, borderRight: `2px solid ${resolvedAccentColor}`, opacity: 0.7, zIndex: 5 }} />
                                        <div style={{ position: 'absolute', bottom: 12, left: 12, width: 28, height: 28, borderBottom: `2px solid ${resolvedAccentColor}`, borderLeft: `2px solid ${resolvedAccentColor}`, opacity: 0.7, zIndex: 5 }} />
                                        <div style={{ position: 'absolute', bottom: 12, right: 12, width: 28, height: 28, borderBottom: `2px solid ${resolvedAccentColor}`, borderRight: `2px solid ${resolvedAccentColor}`, opacity: 0.7, zIndex: 5 }} />
                                    </>)}
                                    {selectedOrnament === 'vintage-border' && (
                                        <div style={{ position: 'absolute', inset: 10, border: `1px solid ${resolvedAccentColor}`, opacity: 0.5, zIndex: 5, pointerEvents: 'none' }} />
                                    )}
                                    {selectedOrnament === 'diamond' && (
                                        <div style={{ position: 'absolute', top: '19%', left: '50%', transform: 'translate(-50%, -50%) rotate(45deg)', width: 10, height: 10, backgroundColor: resolvedAccentColor, opacity: 0.7, zIndex: 5 }} />
                                    )}

                                    {/* Draggable text group */}
                                    {textGroupPos ? (
                                        <div
                                            className="absolute z-10"
                                            style={{
                                                left: `${textGroupPos.x}%`,
                                                top: `${textGroupPos.y}%`,
                                                transform: 'translate(-50%, -50%)',
                                                cursor: isDraggingText ? 'grabbing' : 'grab',
                                                userSelect: 'none',
                                                padding: '6px',
                                                borderRadius: '4px',
                                                border: '1px dashed rgba(255,255,255,0.35)',
                                                textAlign: textAlign === 'left' ? 'left' : textAlign === 'right' ? 'right' : 'center',
                                                width: '80%',
                                            }}
                                            onMouseDown={handleTextMouseDown}
                                        >
                                            <div className={`${style.layout === 'elegant' ? 'border p-5' : ''} w-full`} style={{ borderColor: `${resolvedAccentColor}40` }}>
                                                {style.layout === 'elegant' && <p className="text-xs italic mb-4 opacity-80" style={{ color: resolvedTextColor, fontFamily: selectedFontFamily }}>Memoir Collection</p>}
                                                <h1 className="break-keep mb-3" style={{ fontFamily: selectedFontFamily, fontSize: `${Math.round(titleStyle.size * formatScale)}px`, fontWeight: titleStyle.weight, letterSpacing: `${titleStyle.spacing / 100}em`, lineHeight: `${titleStyle.lineHeight}%`, fontStyle: titleStyle.italic ? 'italic' : 'normal', textTransform: titleStyle.transform, color: resolvedTextColor, textShadow: textShadow ? '0 2px 8px rgba(0,0,0,0.5)' : 'none' }}>{displayTitle}</h1>
                                                <p className="break-keep" style={{ fontFamily: selectedFontFamily, fontSize: `${Math.round(subtitleStyle.size * formatScale)}px`, fontWeight: subtitleStyle.weight, letterSpacing: `${subtitleStyle.spacing / 100}em`, lineHeight: `${subtitleStyle.lineHeight}%`, fontStyle: subtitleStyle.italic ? 'italic' : 'normal', textTransform: subtitleStyle.transform, color: resolvedAccentColor, opacity: 0.8, textShadow: textShadow ? '0 1px 4px rgba(0,0,0,0.4)' : 'none' }}>{generatedTexts.frontSubtitle}</p>
                                            </div>
                                            <div className="mt-4">
                                                {style.layout === 'classic' && <div className="w-10 h-[1px] mx-auto mb-3" style={{ backgroundColor: resolvedAccentColor }}></div>}
                                                <p style={{ fontFamily: selectedFontFamily, fontSize: `${Math.round(authorStyle.size * formatScale)}px`, fontWeight: authorStyle.weight, letterSpacing: `${authorStyle.spacing / 100}em`, lineHeight: `${authorStyle.lineHeight}%`, fontStyle: authorStyle.italic ? 'italic' : 'normal', textTransform: authorStyle.transform, color: resolvedTextColor, textShadow: textShadow ? '0 1px 4px rgba(0,0,0,0.4)' : 'none' }}>{displayAuthor}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={`absolute inset-0 p-8 flex flex-col z-10 ${textPosition === 'top' ? 'justify-start mt-6' : textPosition === 'bottom' ? 'justify-end mb-6' : 'justify-center'} ${textAlign === 'left' ? 'items-start text-left' : textAlign === 'right' ? 'items-end text-right' : 'items-center text-center'}`}
                                            style={{ cursor: 'grab', userSelect: 'none' }}
                                            onMouseDown={handleTextMouseDown}
                                            title="드래그하여 텍스트 위치 변경"
                                        >
                                            <div className={`${style.layout === 'elegant' ? 'border p-5' : ''} w-full`} style={{ borderColor: `${resolvedAccentColor}40` }}>
                                                {style.layout === 'elegant' && <p className="text-xs italic mb-4 opacity-80" style={{ color: resolvedTextColor, fontFamily: selectedFontFamily }}>Memoir Collection</p>}
                                                <h1 className="break-keep mb-3" style={{
                                                    fontFamily: selectedFontFamily,
                                                    fontSize: `${Math.round(titleStyle.size * formatScale)}px`,
                                                    fontWeight: titleStyle.weight,
                                                    letterSpacing: `${titleStyle.spacing / 100}em`,
                                                    lineHeight: `${titleStyle.lineHeight}%`,
                                                    fontStyle: titleStyle.italic ? 'italic' : 'normal',
                                                    textTransform: titleStyle.transform,
                                                    color: resolvedTextColor,
                                                    textShadow: textShadow ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                                                }}>
                                                    {displayTitle}
                                                </h1>
                                                <p className="break-keep" style={{
                                                    fontFamily: selectedFontFamily,
                                                    fontSize: `${Math.round(subtitleStyle.size * formatScale)}px`,
                                                    fontWeight: subtitleStyle.weight,
                                                    letterSpacing: `${subtitleStyle.spacing / 100}em`,
                                                    lineHeight: `${subtitleStyle.lineHeight}%`,
                                                    fontStyle: subtitleStyle.italic ? 'italic' : 'normal',
                                                    textTransform: subtitleStyle.transform,
                                                    color: resolvedAccentColor,
                                                    opacity: 0.8,
                                                    textShadow: textShadow ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
                                                }}>
                                                    {generatedTexts.frontSubtitle}
                                                </p>
                                            </div>
                                            <div className="mt-8">
                                                {style.layout === 'classic' && <div className="w-10 h-[1px] mx-auto mb-4" style={{ backgroundColor: resolvedAccentColor }}></div>}
                                                <p style={{
                                                    fontFamily: selectedFontFamily,
                                                    fontSize: `${Math.round(authorStyle.size * formatScale)}px`,
                                                    fontWeight: authorStyle.weight,
                                                    letterSpacing: `${authorStyle.spacing / 100}em`,
                                                    lineHeight: `${authorStyle.lineHeight}%`,
                                                    fontStyle: authorStyle.italic ? 'italic' : 'normal',
                                                    textTransform: authorStyle.transform,
                                                    color: resolvedTextColor,
                                                    textShadow: textShadow ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
                                                }}>
                                                    {displayAuthor}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>}

                                {/* 2D SPINE */}
                                {(viewAngle === '2d' || viewAngle === 'spine') && <div
                                    className="relative flex flex-col items-center justify-between py-6"
                                    style={{
                                        width: `${viewAngle === 'spine' ? Math.round(spineW * 2.5) : spineW}px`,
                                        height: `${viewAngle === 'spine' ? Math.round(panelH * 1.35) : panelH}px`,
                                        backgroundColor: colors.primary,
                                        boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.3), inset -4px 0 10px rgba(0,0,0,0.3)',
                                    }}
                                >
                                    <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundImage: textureUrl }}></div>
                                    <div className="relative z-10 text-[9px] font-mono font-bold tracking-widest uppercase origin-center transform rotate-90 whitespace-nowrap" style={{ color: colors.textSpine, opacity: 0.8 }}>
                                        {displayAuthor}
                                    </div>
                                    <div className="relative z-10 flex-1 flex items-center justify-center overflow-hidden w-full">
                                        <span className="drop-shadow-sm whitespace-nowrap" style={{
                                            fontFamily: selectedFontFamily,
                                            color: colors.textSpine,
                                            fontSize: `${Math.max(10, Math.round(spineTitleStyle.size * formatScale))}px`,
                                            fontWeight: spineTitleStyle.weight,
                                            letterSpacing: `${spineTitleStyle.spacing / 100}em`,
                                            fontStyle: spineTitleStyle.italic ? 'italic' : 'normal',
                                            textTransform: spineTitleStyle.transform,
                                            transform: 'rotate(90deg)',
                                            transformOrigin: 'center center',
                                        }}>
                                            {generatedTexts.spineTitle}
                                        </span>
                                    </div>
                                    <div className="relative z-10 w-3 h-3 rounded-full border-[2px]" style={{ borderColor: resolvedAccentColor }}></div>
                                </div>}

                                {/* 2D BACK */}
                                {(viewAngle === '2d' || viewAngle === 'back') && <div
                                    className="relative overflow-hidden flex flex-col items-center justify-center p-8"
                                    style={{
                                        width: `${viewAngle === 'back' ? Math.round(panelW * 1.35) : panelW}px`,
                                        height: `${viewAngle === 'back' ? Math.round(panelH * 1.35) : panelH}px`,
                                        background: bgImageUrl ? `url(${bgImageUrl}) center/cover no-repeat` : colors.primary,
                                    }}
                                >
                                    {bgImageUrl && <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(100 - bgBrightness) / 100})` }}></div>}
                                    <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundImage: textureUrl }}></div>
                                    <div className="relative z-10 text-center flex flex-col items-center justify-between h-full py-6">
                                        <Sparkles className="mx-auto mb-6 opacity-60" style={{ color: resolvedAccentColor, width: 24, height: 24 }} />
                                        <p className="break-keep" style={{
                                            fontFamily: selectedFontFamily,
                                            color: resolvedTextColor,
                                            fontSize: `${Math.round(backBlurbStyle.size * formatScale)}px`,
                                            fontWeight: backBlurbStyle.weight,
                                            letterSpacing: `${backBlurbStyle.spacing / 100}em`,
                                            lineHeight: `${backBlurbStyle.lineHeight}%`,
                                            fontStyle: backBlurbStyle.italic ? 'italic' : 'normal',
                                            textTransform: backBlurbStyle.transform,
                                            textShadow: textShadow ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
                                        }}>
                                            &ldquo;{generatedTexts.backBlurb}&rdquo;
                                        </p>
                                        <div className="mt-12 text-[9px] font-mono tracking-[0.2em] opacity-50" style={{ color: resolvedTextColor }}>
                                            PUBLISHED BY LEAFNOTE
                                        </div>
                                    </div>
                                </div>}
                            </div>
                        </div>
                    </div>

                    {/* View Controls + Zoom */}
                    <div className="absolute bottom-4 sm:bottom-8 left-0 w-full flex justify-center items-center gap-3 px-4 z-20">
                        <div className="bg-white/90 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl shadow-xl border border-white/50 flex gap-0.5 sm:gap-1 isolate scale-90 sm:scale-100">
                            <Button variant={viewAngle === '2d' ? 'default' : 'ghost'} onClick={() => setViewAngle('2d')} className={`rounded-xl font-bold ${viewAngle === '2d' ? 'bg-slate-800 text-white shadow-inner' : 'text-slate-600 hover:text-slate-900'}`}>
                                <BookOpen className="mr-2 h-4 w-4" /> 전체
                            </Button>
                            <div className="w-px bg-slate-200 my-2 mx-1"></div>
                            <Button variant={viewAngle === 'front' ? 'secondary' : 'ghost'} onClick={() => setViewAngle('front')} className={`rounded-xl font-bold ${viewAngle === 'front' ? 'bg-emerald-100 text-emerald-900' : 'text-slate-600'}`}>앞면</Button>
                            <Button variant={viewAngle === 'spine' ? 'secondary' : 'ghost'} onClick={() => setViewAngle('spine')} className={`rounded-xl font-bold ${viewAngle === 'spine' ? 'bg-emerald-100 text-emerald-900' : 'text-slate-600'}`}>책등</Button>
                            <Button variant={viewAngle === 'back' ? 'secondary' : 'ghost'} onClick={() => setViewAngle('back')} className={`rounded-xl font-bold ${viewAngle === 'back' ? 'bg-emerald-100 text-emerald-900' : 'text-slate-600'}`}>뒷면</Button>
                        </div>
                        <div className="hidden lg:flex bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-white/50 items-center gap-1">
                            <button onClick={() => setZoomLevel(z => Math.max(+(z - 0.1).toFixed(1), 0.5))} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-lg">
                                <ZoomOut className="h-4 w-4" />
                            </button>
                            <span className="text-xs font-bold text-slate-500 tabular-nums w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                            <button onClick={() => setZoomLevel(z => Math.min(+(z + 0.1).toFixed(1), 1.5))} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-lg">
                                <ZoomIn className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
