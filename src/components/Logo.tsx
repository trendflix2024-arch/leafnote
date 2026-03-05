"use client";

import Link from "next/link";

const LEAF_SVG_PATHS = (
    <>
        <path d="M12 22C12 22 20 18 20 12C20 6 12 2 12 2C12 2 4 6 4 12C4 18 12 22 12 22Z" fill="white" fillOpacity="0.2" />
        <path d="M12 22V2M12 22C12 22 20 18 20 12C20 6 12 2 12 2M12 22C12 22 4 6 4 12C4 18 12 22 12 22ZM12 7C14 7 16 8 16 10M12 11C15 11 17 12 17 14M12 15C13.5 15 15 15.5 15 17M12 7C10 7 8 8 8 10M12 11C9 11 7 12 7 14M12 15C10.5 15 9 15.5 9 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </>
);

interface LogoProps {
    /** sm: 헤더 nav용 / md: 기본 / lg: 로그인 등 강조용 / xl: 대형 */
    size?: "sm" | "md" | "lg" | "xl";
    /** default: 밝은 배경 / dark: 어두운 배경 (welcome 페이지 등) */
    variant?: "default" | "dark";
    /** 텍스트 표시 여부 */
    showText?: boolean;
    /** 클릭 시 이동할 href (없으면 Link 감싸지 않음) */
    href?: string;
    className?: string;
}

const SIZE_MAP = {
    sm:  { box: "w-8 h-8",   icon: 20, textClass: "text-lg font-serif font-bold tracking-tight",   subClass: "text-sm" },
    md:  { box: "w-10 h-10", icon: 24, textClass: "text-xl font-serif font-bold tracking-tight",   subClass: "text-sm" },
    lg:  { box: "w-16 h-16", icon: 36, textClass: "text-3xl font-serif font-bold tracking-tight",  subClass: "text-sm" },
    xl:  { box: "w-20 h-20", icon: 44, textClass: "text-4xl font-serif font-bold tracking-tight",  subClass: "text-base" },
};

export function Logo({ size = "md", variant = "default", showText = true, href = "/", className = "" }: LogoProps) {
    const { box, icon, textClass, subClass } = SIZE_MAP[size];

    const iconBox = variant === "dark"
        ? `${box} bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl flex items-center justify-center`
        : `${box} bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100/50`;

    const nameClass = variant === "dark"
        ? `${textClass} text-white whitespace-nowrap`
        : `${textClass} text-slate-800 whitespace-nowrap`;

    const subTextClass = variant === "dark"
        ? `${subClass} text-white/60 tracking-widest uppercase font-sans font-medium`
        : `${subClass} text-emerald-600 font-sans font-medium`;

    const isLargeLayout = size === "lg" || size === "xl";

    const inner = (
        <div className={`flex ${isLargeLayout ? "flex-col" : "flex-row"} items-center ${isLargeLayout ? "gap-3" : "gap-2 md:gap-3"} ${className}`}>
            <div className={iconBox}>
                <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {LEAF_SVG_PATHS}
                </svg>
            </div>
            {showText && (
                isLargeLayout ? (
                    <div className="text-center">
                        <p className={nameClass}>리프노트</p>
                        <p className={subTextClass}>LeafNote</p>
                    </div>
                ) : (
                    <span className={nameClass}>
                        리프노트 <span className={`${variant === "dark" ? "text-white/70" : "text-emerald-600"} font-sans`}>LeafNote</span>
                    </span>
                )
            )}
        </div>
    );

    if (!href) return inner;

    return (
        <Link href={href} className="group hover:opacity-90 transition-opacity">
            {inner}
        </Link>
    );
}
