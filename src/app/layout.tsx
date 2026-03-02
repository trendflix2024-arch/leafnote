import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SessionWatcher } from "@/components/SessionWatcher";

export const metadata: Metadata = {
    title: "리프노트 LeafNote - 당신의 대화가 한 권의 잎이 되는 시간",
    description: "AI 인터뷰로 당신의 소중한 기억을 한 권의 책으로 피워내세요. 따뜻한 기록가 리프노트.",
    keywords: ["리프노트", "LeafNote", "자서전", "AI 인터뷰", "개인 출판", "기록", "부모님 선물"],
    manifest: "/manifest.json",
    openGraph: {
        title: "리프노트 LeafNote - 모든 인생은 한 권의 책이다",
        description: "흩어진 기억을 모아 당신만의 울창한 숲을 기록합니다.",
        type: "website",
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
