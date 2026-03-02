import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { title, author, content } = await req.json();

        if (!content || typeof content !== 'string') {
            return NextResponse.json(
                { error: 'Valid content (manuscript) is required to generate suggestions.' },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            generationConfig: {
                temperature: 0.7,
            },
        });

        // Prompt Gemini to analyze the manuscript and suggest cover design details
        const prompt = `
당신은 베테랑 시니어 출판 편집자이자 북 디자이너인 '에코'입니다.
저자의 원고(인터뷰 기록)를 읽고, 이 책에 가장 잘 어울리는 3D 표지 디자인 아이디어를 제안해 주세요.
사용자(주로 시니어)가 복잡한 고민 없이 바로 표지를 만들 수 있도록, 구체적이고 감성적인 내용을 제안해야 합니다.

책 제목: ${title}
저자명: ${author}

[원고 내용 요약 및 주요 부분]
${content.substring(0, 3000)} /* 보통 인터뷰 내용의 앞부분이나 전체가 들어옵니다. 너무 길면 잘라서 컨텍스트 제공. */

위 내용을 바탕으로 아래의 JSON 형식에 맞게 디자인 아이디어를 추천해 주세요.
영문이나 다른 언어 말고 반드시 한국어로 작성해 주세요. (단, JSON 키는 영문 유지)

{
  "concept": "전체적인 분위기와 느낌을 나타내는 한 줄 문구 (예: 따뜻한 봄햇살 아래 핀 꽃처럼 포근한 느낌)",
  "frontDesc": "앞면 여백이나 제목 배치 등 디자인적인 요구사항 (예: 제목은 중앙에 큼직하게 들어가고, 배경은 여백의 미를 살려주세요)",
  "spineDesc": "책등(Spine)에 대한 요구사항 (예: 깔끔한 고딕체로 한눈에 읽기 쉽게 배치)",
  "backDesc": "뒷면에 들어갈 감성적인 추천사나 책 소개글 (예: '당신의 삶의 한 조각이 누군가에게는 큰 위로가 됩니다.' 독자의 마음을 울리는 짧은 문구)"
}

반드시 순수한 JSON 객체만 반환하세요. 마크다운 기호(\`\`\`)나 다른 텍스트는 포함하지 마세요.
`;

        const result = await model.generateContent(prompt);
        let rawResponse = result.response.text().trim();

        // Clean up markdown wrapping if Gemini includes it
        if (rawResponse.startsWith('```json')) {
            rawResponse = rawResponse.replace(/^```json\n|\n```$/g, '');
        } else if (rawResponse.startsWith('```')) {
            rawResponse = rawResponse.replace(/^```\n|\n```$/g, '');
        }

        const suggestions = JSON.parse(rawResponse);

        return NextResponse.json({ suggestions });

    } catch (error: any) {
        console.error('Error suggesting cover content:', error);
        return NextResponse.json(
            { error: 'Failed to generate cover suggestions.', details: error.message },
            { status: 500 }
        );
    }
}
