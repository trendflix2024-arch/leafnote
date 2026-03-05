import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const alt = '기억을 꺼내어 리프노트를 틔우다';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(160deg, #e8f5f0 0%, #f0faf5 35%, #f7fdfb 65%, #eaf6f0 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Decorative leaf watermarks */}
                {[
                    { top: 40, left: 60, size: 90, rotate: -20, opacity: 0.07 },
                    { top: 460, left: 100, size: 70, rotate: 30, opacity: 0.06 },
                    { top: 80, right: 80, size: 80, rotate: 15, opacity: 0.07 },
                    { top: 400, right: 60, size: 100, rotate: -10, opacity: 0.06 },
                    { top: 250, left: 30, size: 50, rotate: 45, opacity: 0.05 },
                    { top: 180, right: 200, size: 60, rotate: -30, opacity: 0.05 },
                ].map((leaf, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: leaf.top,
                            left: (leaf as any).left,
                            right: (leaf as any).right,
                            width: leaf.size,
                            height: leaf.size,
                            opacity: leaf.opacity,
                            transform: `rotate(${leaf.rotate}deg)`,
                            display: 'flex',
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" width={leaf.size} height={leaf.size}>
                            <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill="#059669" />
                            <path d="M12 22V2M12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                    </div>
                ))}

                {/* Content wrapper */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0,
                        zIndex: 10,
                        padding: '0 80px',
                        width: '100%',
                    }}
                >
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
                        <div
                            style={{
                                width: 44,
                                height: 44,
                                background: '#059669',
                                borderRadius: 12,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 16px rgba(5,150,105,0.25)',
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill="white" fillOpacity="0.25" />
                                <path d="M12 22V2M12 22C12 22 20 18 20 12C20 6 12 2 12 2M12 22C12 22 4 6 4 12C4 18 12 22 12 22ZM12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 15C13.5 15 15 15.5 15 17M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14M12 15C10.5 15 9 15.5 9 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span style={{ color: '#1e293b', fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
                            리프노트{' '}
                            <span style={{ color: '#059669' }}>LeafNote</span>
                        </span>
                    </div>

                    {/* Main headline */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 28 }}>
                        <span
                            style={{
                                color: '#0f172a',
                                fontSize: 80,
                                fontWeight: 900,
                                letterSpacing: -3,
                                lineHeight: 1.05,
                                textAlign: 'center',
                            }}
                        >
                            기억을 꺼내어
                        </span>
                        <span
                            style={{
                                color: '#059669',
                                fontSize: 80,
                                fontWeight: 900,
                                letterSpacing: -3,
                                lineHeight: 1.05,
                                textAlign: 'center',
                            }}
                        >
                            리프노트를 틔우다
                        </span>
                    </div>

                    {/* Subtitle */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 36 }}>
                        <span style={{ color: '#475569', fontSize: 20, textAlign: 'center', lineHeight: 1.6 }}>
                            차가운 기술이 아닌, 당신의 이야기를 들어주는 따뜻한 기록자{' '}
                            <span style={{ color: '#059669', fontWeight: 700 }}>에코(Echo)</span>.
                        </span>
                        <span style={{ color: '#475569', fontSize: 20, textAlign: 'center', lineHeight: 1.6 }}>
                            묻어둔 기억을 AI 인터뷰로 깨워 한 권의 책으로 선물해 드립니다.
                        </span>
                    </div>

                    {/* CTA row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div
                            style={{
                                padding: '16px 36px',
                                background: '#059669',
                                borderRadius: 100,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                boxShadow: '0 8px 24px rgba(5,150,105,0.3)',
                            }}
                        >
                            <span style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>기록의 시작, 씨앗 심기 →</span>
                        </div>
                        <div
                            style={{
                                padding: '16px 36px',
                                background: 'white',
                                borderRadius: 100,
                                border: '1.5px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            <span style={{ color: '#475569', fontSize: 18, fontWeight: 600 }}>브랜드 스토리 보기</span>
                        </div>
                    </div>
                </div>

                {/* Bottom domain */}
                <div style={{ position: 'absolute', bottom: 22, display: 'flex' }}>
                    <span style={{ color: '#94a3b8', fontSize: 13, letterSpacing: 1 }}>leafnote.co.kr</span>
                </div>
            </div>
        ),
        { ...size }
    );
}
