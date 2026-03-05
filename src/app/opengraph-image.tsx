import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const alt = '기억을 꺼내어 리프노트를 틔우다';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function fetchGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`;
    const css = await (await fetch(cssUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (bb10; Touch) AppleWebKit/537.1+' },
    })).text();
    const url = css.match(/src: url\(([^)]+)\)/)?.[1];
    if (!url) throw new Error(`Font URL not found: ${family} ${weight}`);
    return (await fetch(url)).arrayBuffer();
}

export default async function Image() {
    const [fontBold, fontBlack] = await Promise.all([
        fetchGoogleFont('Noto+Serif+KR', 700),
        fetchGoogleFont('Noto+Serif+KR', 900),
    ]);

    return new ImageResponse(
        (
            <div
                style={{
                    width: '1200px',
                    height: '630px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(160deg, #e8f5f0 0%, #f0faf5 40%, #f7fdfb 70%, #eaf6f0 100%)',
                    fontFamily: '"Noto Serif KR"',
                }}
            >
                {/* Logo row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '36px' }}>
                    <div
                        style={{
                            width: '52px',
                            height: '52px',
                            background: '#059669',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 20px rgba(5,150,105,0.3)',
                        }}
                    >
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z"
                                fill="white"
                                fillOpacity="0.25"
                            />
                            <path
                                d="M12 22V2M12 22C12 22 20 18 20 12C20 6 12 2 12 2M12 22C12 22 4 6 4 12C4 18 12 22 12 22ZM12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 15C13.5 15 15 15.5 15 17M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14M12 15C10.5 15 9 15.5 9 17"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ color: '#0f172a', fontSize: '30px', fontWeight: 700 }}>리프노트</span>
                        <span style={{ color: '#059669', fontSize: '22px', fontWeight: 600 }}>LeafNote</span>
                    </div>
                </div>

                {/* Main headline */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '28px' }}>
                    <span
                        style={{
                            color: '#0f172a',
                            fontSize: '84px',
                            fontWeight: 900,
                            letterSpacing: '-3px',
                            lineHeight: '1',
                        }}
                    >
                        기억을 꺼내어
                    </span>
                    <span
                        style={{
                            color: '#059669',
                            fontSize: '84px',
                            fontWeight: 900,
                            letterSpacing: '-3px',
                            lineHeight: '1',
                        }}
                    >
                        리프노트를 틔우다
                    </span>
                </div>

                {/* Subtitle */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '36px' }}>
                    <span style={{ color: '#475569', fontSize: '20px', textAlign: 'center', fontWeight: 700 }}>
                        차가운 기술이 아닌, 당신의 이야기를 들어주는 따뜻한 기록자 에코(Echo).
                    </span>
                    <span style={{ color: '#475569', fontSize: '20px', textAlign: 'center', fontWeight: 700 }}>
                        묻어둔 기억을 AI 인터뷰로 깨워 한 권의 책으로 선물해 드립니다.
                    </span>
                </div>

                {/* CTA row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                        style={{
                            padding: '16px 40px',
                            background: '#059669',
                            borderRadius: '100px',
                            display: 'flex',
                            alignItems: 'center',
                            boxShadow: '0 8px 24px rgba(5,150,105,0.35)',
                        }}
                    >
                        <span style={{ color: 'white', fontSize: '19px', fontWeight: 700 }}>기록의 시작, 씨앗 심기 →</span>
                    </div>
                    <div
                        style={{
                            padding: '16px 40px',
                            background: 'white',
                            borderRadius: '100px',
                            border: '1.5px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <span style={{ color: '#64748b', fontSize: '19px', fontWeight: 700 }}>브랜드 스토리 보기</span>
                    </div>
                </div>

                {/* Bottom domain */}
                <div style={{ display: 'flex', marginTop: '32px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '14px', letterSpacing: '1px', fontWeight: 700 }}>
                        leafnote.co.kr · 모든 인생은 한 권의 책이다
                    </span>
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
                { name: 'Noto Serif KR', data: fontBold, weight: 700, style: 'normal' },
                { name: 'Noto Serif KR', data: fontBlack, weight: 900, style: 'normal' },
            ],
        }
    );
}
