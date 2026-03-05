import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SessionWatcher } from "@/components/SessionWatcher";

export const metadata: Metadata = {
    metadataBase: new URL('https://leafnote.co.kr'),
    title: "리프노트: 모든 인생은 한 권의 책이다",
    description: "지금, 당신의 대화가 기록이 됩니다. 한정된 베타 멤버에게만 드리는 특별한 작가 경험을 시작하세요. ✨",
    keywords: ["리프노트", "LeafNote", "베타 초대", "인생 기록", "AI 인터뷰", "개인 출판", "자서전", "부모님 선물"],
    manifest: "/manifest.json",
    openGraph: {
        title: "리프노트: 모든 인생은 한 권의 책이다",
        description: "지금, 당신의 대화가 기록이 됩니다. 한정된 베타 멤버에게만 드리는 특별한 작가 경험을 시작하세요. ✨",
        type: "website",
        locale: "ko_KR",
        siteName: "리프노트 LeafNote",
    },
    twitter: {
        card: "summary_large_image",
        title: "리프노트: 모든 인생은 한 권의 책이다",
        description: "지금, 당신의 대화가 기록이 됩니다. 한정된 베타 멤버에게만 드리는 특별한 작가 경험을 시작하세요. ✨",
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
