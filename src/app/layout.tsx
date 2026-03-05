import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SessionWatcher } from "@/components/SessionWatcher";

export const metadata: Metadata = {
    title: "리프노트 LeafNote - 베타 초대장",
    description: "작가님을 오래 기다렸습니다. 리프노트 베타 창립 멤버로 참여하세요. 베타 기간 동안 초고 생성·커버 디자인·PDF 다운로드를 무제한 무료로 사용하실 수 있습니다.",
    keywords: ["리프노트", "LeafNote", "베타 초대", "인생 기록", "AI 인터뷰", "개인 출판", "자서전", "부모님 선물"],
    manifest: "/manifest.json",
    openGraph: {
        title: "리프노트 베타 초대장 — 작가님을 오래 기다렸습니다",
        description: "베타 창립 멤버로 참여하세요. 초고 생성 · 커버 디자인 · PDF 다운로드 무제한 무료. 베타 종료 후에도 창립 멤버 특별 혜택이 제공됩니다.",
        type: "website",
        locale: "ko_KR",
        siteName: "리프노트 LeafNote",
    },
    twitter: {
        card: "summary_large_image",
        title: "리프노트 베타 초대장 — 작가님을 오래 기다렸습니다",
        description: "베타 창립 멤버로 참여하세요. 모든 기능 무제한 무료.",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    themeColor: "#1e293b",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/icon-192.png" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="format-detection" content="telephone=no" />
                <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.png" />
            </head>
            <body className="antialiased">
                <Providers>
                    <SessionWatcher />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
