"use client";

import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Project } from './store';

// Register Fonts
// Note: Using reliable CDN URLs for TTF fonts
Font.register({
    family: 'Playfair Display',
    src: 'https://fonts.gstatic.com/s/playfairdisplay/v30/6nuTXe5biGuVVHi_9icG6at7430ceSDeVkU.ttf',
    fontWeight: 'bold',
});

Font.register({
    family: 'EB Garamond',
    src: 'https://fonts.gstatic.com/s/ebgaramond/v26/26_df066f1-6782-4166-98a9-6e3e150f8c35.ttf', // Placeholder-ish, would use a better one in production
});

Font.register({
    family: 'Nanum Myeongjo',
    src: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_seven@1.0/NanumMyeongjo.woff', // Using a reliable web-font mirror
});

// Fallback to a single family for simplicity in @react-pdf/renderer if needed, 
// but we'll try to mix them.
const styles = StyleSheet.create({
    page: {
        padding: 50,
        backgroundColor: '#fff',
        fontFamily: 'Nanum Myeongjo', // Default to Korean Serif
    },
    // Cover Page
    coverPage: {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e293b', // Primary slate-800
        color: '#fff',
        padding: 40,
    },
    coverTitle: {
        fontSize: 36,
        fontFamily: 'Playfair Display',
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    coverAuthor: {
        fontSize: 16,
        marginTop: 20,
        opacity: 0.8,
    },
    coverImage: {
        width: '100%',
        height: 300,
        marginBottom: 40,
        objectFit: 'cover',
    },
    // TOC / Body
    sectionHeader: {
        fontSize: 24,
        fontFamily: 'Playfair Display',
        marginBottom: 30,
        marginTop: 20,
        borderBottom: '1pt solid #eee',
        paddingBottom: 10,
    },
    paragraph: {
        fontSize: 12,
        lineHeight: 1.8,
        marginBottom: 15,
        textAlign: 'justify',
    },
    chapterTitle: {
        fontSize: 18,
        fontFamily: 'Playfair Display',
        marginBottom: 20,
        marginTop: 40,
        textAlign: 'center',
        color: '#1a1a1a',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 10,
        color: '#94a3b8',
    },
});

export const MyBookPDF = ({ project }: { project: Project }) => {
    const chapters = project.fullDraft.split('---').filter(Boolean);

    return (
        <Document>
            {/* 1. Cover Page */}
            <Page size="A5" style={styles.page}>
                <View style={styles.coverPage}>
                    {project.coverImageUrl && (
                        <Image src={project.coverImageUrl} style={styles.coverImage} />
                    )}
                    <Text style={styles.coverTitle}>{project.title}</Text>
                    <View style={{ width: 40, height: 1, backgroundColor: '#fff', marginVertical: 20 }} />
                    <Text style={styles.coverAuthor}>{project.author} 저</Text>
                </View>
            </Page>

            {/* 2. Intro / TOC */}
            <Page size="A5" style={styles.page}>
                <Text style={styles.sectionHeader}>일러두기</Text>
                <Text style={styles.paragraph}>
                    이 책은 {project.author}의 소중한 기억을 바탕으로 AI 인터뷰어 '에코'와 나누었던 대화를 엮어 만든 기록입니다.
                    기록되지 않은 역사는 잊히지만, 당신의 이야기는 이 책을 통해 영원히 빛날 것입니다.
                </Text>
                <Text style={[styles.footer, { bottom: 50 }]}>LeafNote Publishing</Text>
            </Page>

            {/* 3. Main Content Chapters */}
            {chapters.map((content, index) => (
                <Page key={index} size="A5" style={styles.page}>
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
