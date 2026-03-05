import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '리프노트 베타 초대장 — 작가님을 오래 기다렸습니다';
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
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #022c22 0%, #064e3b 45%, #0f766e 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background decorative circles */}
                <div style={{ position: 'absolute', top: -120, left: -120, width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex' }} />
                <div style={{ position: 'absolute', bottom: -80, right: -80, width: 380, height: 380, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex' }} />
                <div style={{ position: 'absolute', top: 80, right: 120, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex' }} />

                {/* Leaf pattern dots */}
                {[
                    { top: 60, left: 200, size: 6 },
                    { top: 120, left: 900, size: 8 },
                    { top: 480, left: 150, size: 5 },
                    { top: 520, left: 1050, size: 7 },
                    { top: 300, left: 80, size: 4 },
                ].map((dot, i) => (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: dot.top,
                            left: dot.left,
                            width: dot.size,
                            height: dot.size,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                        }}
                    />
                ))}

                {/* Main card */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 28,
                        padding: '52px 80px',
                        background: 'rgba(255,255,255,0.07)',
                        borderRadius: 40,
                        border: '1px solid rgba(255,255,255,0.12)',
                        width: 960,
                    }}
                >
                    {/* Badge */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '9px 24px',
                            background: 'rgba(255,255,255,0.13)',
                            borderRadius: 100,
                            border: '1px solid rgba(255,255,255,0.18)',
                        }}
                    >
                        <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: 15, letterSpacing: 3, fontFamily: 'sans-serif' }}>
                            ✦  베타 창립 멤버 초대장  ✦
                        </span>
                    </div>

                    {/* Logo + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        {/* Leaf icon */}
                        <div
                            style={{
                                width: 80,
                                height: 80,
                                background: 'rgba(255,255,255,0.15)',
                                borderRadius: 22,
                                border: '1.5px solid rgba(255,255,255,0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                                <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill="white" fillOpacity="0.2" />
                                <path d="M12 22V2M12 22C12 22 20 18 20 12C20 6 12 2 12 2M12 22C12 22 4 6 4 12C4 18 12 22 12 22ZM12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 15C13.5 15 15 15.5 15 17M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14M12 15C10.5 15 9 15.5 9 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ color: 'white', fontSize: 58, fontWeight: 800, letterSpacing: -2, fontFamily: 'serif', lineHeight: 1 }}>리프노트</span>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, letterSpacing: 10, fontFamily: 'sans-serif' }}>LEAFNOTE</span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ width: 80, height: 1, background: 'rgba(255,255,255,0.2)', borderRadius: 1, display: 'flex' }} />

                    {/* Main message */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                        <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: 34, fontFamily: 'serif', fontWeight: 700, textAlign: 'center', letterSpacing: -0.5 }}>
                            작가님을 오래 기다렸습니다
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 19, fontFamily: 'sans-serif', textAlign: 'center', letterSpacing: 1 }}>
                            베타 기간 동안 모든 기능을 무제한 무료로 사용하실 수 있습니다
                        </span>
                    </div>

                    {/* CTA Button */}
                    <div
                        style={{
                            marginTop: 4,
                            padding: '18px 52px',
                            background: 'white',
                            borderRadius: 100,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <span style={{ color: '#064e3b', fontSize: 20, fontWeight: 800, fontFamily: 'sans-serif', letterSpacing: -0.5 }}>
                            나의 첫 이야기 시작하기  →
                        </span>
                    </div>
                </div>

                {/* Bottom tagline */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 28,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'sans-serif', letterSpacing: 2 }}>
                        leafnote.co.kr  ·  모든 인생은 한 권의 책이다
                    </span>
                </div>
            </div>
        ),
        { ...size }
    );
}
