"use client";

import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Project, InteriorLayout } from './store';

// Register Fonts
Font.register({
    family: 'Playfair Display',
    src: 'https://fonts.gstatic.com/s/playfairdisplay/v30/6nuTXe5biGuVVHi_9icG6at7430ceSDeVkU.ttf',
    fontWeight: 'bold',
});

Font.register({
    family: 'Nanum Myeongjo',
    src: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_seven@1.0/NanumMyeongjo.woff',
});

Font.register({
    family: 'Nanum Gothic',
    src: 'https://fonts.gstatic.com/s/nanumgothic/v23/PN_oRfi-oW3hYwmKDpxS7F_z_tLfxno73g.ttf',
});

const BOOK_FORMATS = [
    { key: 'b6', w: 128, h: 188 },
    { key: 'irregular', w: 128, h: 210 },
    { key: 'a5', w: 148, h: 210 },
    { key: 'a5v', w: 136, h: 200 },
    { key: 'shinkook', w: 152, h: 224 },
    { key: 'shinkookv', w: 152, h: 205 },
    { key: 'crown', w: 170, h: 245 },
    { key: 'b5', w: 182, h: 257 },
    { key: 'a4', w: 210, h: 297 },
];

// Map font names to registered PDF fonts
function getPDFFont(fontName: string): string {
    const sansKeywords = ['Gothic', 'Sans', 'Dodum', 'Han'];
    if (sansKeywords.some(k => fontName.includes(k))) return 'Nanum Gothic';
    return 'Nanum Myeongjo';
}

// mm to pt conversion (1mm = 2.8346pt)
const mmToPt = (mm: number) => mm * 2.8346;

const DEFAULT_IL: InteriorLayout = {
    font: 'Noto Serif KR', fontSize: 11, lineHeight: 165,
    marginInner: 16, marginOuter: 14, marginTop: 18, marginBottom: 22,
    chapterStyle: 'classic',
    letterSpacing: 0,
    paragraphIndent: 1,
};

export const MyBookPDF = ({
    project,
    interiorLayout,
    bookFormatKey,
}: {
    project: Project;
    interiorLayout?: InteriorLayout;
    bookFormatKey?: string;
}) => {
    const il = interiorLayout || DEFAULT_IL;
    const fmt = BOOK_FORMATS.find(f => f.key === (bookFormatKey || 'a5')) || BOOK_FORMATS[2];
    const bodyFont = getPDFFont(il.font);

    // Page size in pt
    const pageSize: [number, number] = [mmToPt(fmt.w), mmToPt(fmt.h)];

    const styles = StyleSheet.create({
        page: {
            width: pageSize[0],
            height: pageSize[1],
            paddingTop: mmToPt(il.marginTop),
            paddingBottom: mmToPt(il.marginBottom),
            paddingLeft: mmToPt(il.marginInner),
            paddingRight: mmToPt(il.marginOuter),
            backgroundColor: '#fff',
            fontFamily: bodyFont,
        },
        coverPage: {
            width: pageSize[0],
            height: pageSize[1],
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1e293b',
            color: '#fff',
            padding: 40,
        },
        coverTitle: {
            fontSize: 28,
            fontFamily: 'Playfair Display',
            fontWeight: 'bold',
            marginBottom: 16,
            textAlign: 'center',
        },
        coverAuthor: {
            fontSize: 14,
            marginTop: 16,
            opacity: 0.8,
            fontFamily: bodyFont,
        },
        coverImage: {
            width: '100%',
            height: 250,
            marginBottom: 32,
            objectFit: 'cover',
        },
        sectionHeader: {
            fontSize: il.fontSize * 1.4,
            fontFamily: bodyFont,
            marginBottom: 16,
            marginTop: 8,
            borderBottom: '0.5pt solid #e2e8f0',
            paddingBottom: 8,
        },
        paragraph: {
            fontSize: il.fontSize,
            lineHeight: il.lineHeight / 100,
            marginBottom: 10,
            textAlign: 'justify',
            fontFamily: bodyFont,
        },
        chapterTitle: {
            fontSize: il.fontSize * 1.5,
            fontFamily: bodyFont,
            fontWeight: 'bold',
            marginBottom: 16,
            marginTop: 20,
            textAlign: il.chapterStyle === 'minimal' ? 'left' : 'center',
        },
        footer: {
            position: 'absolute',
            bottom: mmToPt(10),
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: il.fontSize * 0.75,
            color: '#94a3b8',
            fontFamily: bodyFont,
        },
    });

    const chapters = project.fullDraft.split('---').filter(Boolean);

    return (
        <Document>
            {/* 1. Cover Page */}
            <Page size={pageSize} style={styles.page}>
                <View style={styles.coverPage}>
                    {project.coverImageUrl && (
                        <Image src={project.coverImageUrl} style={styles.coverImage} />
                    )}
                    <Text style={styles.coverTitle}>{project.title}</Text>
                    <View style={{ width: 40, height: 1, backgroundColor: '#fff', marginVertical: 16 }} />
                    <Text style={styles.coverAuthor}>{project.author} 저</Text>
                </View>
            </Page>

            {/* 2. Intro */}
            <Page size={pageSize} style={styles.page}>
                <Text style={styles.sectionHeader}>일러두기</Text>
                <Text style={styles.paragraph}>
                    이 책은 {project.author}의 소중한 기억과 경험을 담은 기록입니다.
                    기록되지 않은 역사는 잊히지만, 당신의 이야기는 이 책을 통해 영원히 빛날 것입니다.
                </Text>
                <Text style={[styles.footer, { bottom: mmToPt(12) }]}>LeafNote Publishing</Text>
            </Page>

            {/* 3. Main Content Chapters */}
            {chapters.map((content, index) => (
                <Page key={index} size={pageSize} style={styles.page}>
                    <Text style={styles.chapterTitle}>제 {index + 1}장</Text>
                    <Text style={styles.paragraph}>{content.trim()}</Text>
                    <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                        `${pageNumber} / ${totalPages}`
                    )} fixed />
                </Page>
            ))}
        </Document>
    );
};
