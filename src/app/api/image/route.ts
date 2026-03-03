import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다. 관리자에게 문의하세요.' }, { status: 500 });
  }

  try {
    const { title, author, concept, frontDesc, spineDesc, backDesc } = await req.json();

    // Use gemini-pro for design parameter generation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
      당신은 수석 출판 북 디자이너입니다. 사용자가 입력한 내용을 바탕으로 세련된 3D 책 표지 디자인 명세서를 작성해야 합니다.
      
      [도서 정보]
      제목: "${title}"
      저자: "${author}"
      핵심 컨셉 및 분위기: "${concept}"
      앞면 요구사항: "${frontDesc}"
      책등 요구사항: "${spineDesc}"
      뒷면 요구사항: "${backDesc}"
      
      이 정보를 바탕으로 아래 구조의 JSON 데이터를 생성하세요. 다른 설명 없이 오직 유효한 JSON 포맷만 반환해야 합니다.
      텍스트는 한국어로 감성적이고 수려하게 작성해주세요.
      
      [JSON 구조]
      {
        "colors": {
          "primary": "HEX 코드 (전반적인 베이스 색상, 책등 포함)",
          "secondary": "HEX 코드 (앞면 그라데이션 또는 보조 색상)",
          "accent": "HEX 코드 (포인트 디자인 요소 및 띠지 색상)",
          "textFront": "HEX 코드 (앞면 텍스트 색상, 배경과 높은 대비)",
          "textSpine": "HEX 코드 (책등 텍스트 색상, primary와 대비)"
        },
        "style": {
          "texture": "solid, leather, canvas 중에 하나",
          "layout": "modern, classic, elegant 중에 하나"
        },
        "generatedTexts": {
          "frontSubtitle": "앞면에 어울리는 매우 짧은 1문장 부제",
          "backBlurb": "뒷면에 들어갈 2~3문장의 감성적인 추천사 또는 책 소개말",
          "spineTitle": "책등에 들어갈 세로형 제목 (줄바꿈 없이 짧게)"
        },
        "imagePrompt": "A highly detailed, aesthetic English prompt for a text-to-image AI to generate the book cover background. Must NOT contain any text or words. Describe the visual elements, lighting, mood, color palette, and art style. Example: 'A serene pastel watercolor painting of cherry blossoms gently falling in a warm spring breeze, soft glowing light, ethereal atmosphere, minimalist composition, masterpiece, 8k resolution, highly detailed.'"
      }
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Clean JSON formatting if present
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    let designParams;
    try {
      designParams = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON parse failed, returning fallback");
      designParams = {
        colors: { primary: '#1e293b', secondary: '#334155', accent: '#f59e0b', textFront: '#f1f5f9', textSpine: '#f8fafc' },
        style: { texture: 'canvas', layout: 'elegant' },
        generatedTexts: { frontSubtitle: "당신의 이야기가 잎사귀가 되어", backBlurb: "평범한 일상이 모여 위대한 기록이 됩니다. 당신의 삶을 담은 이 책은 누군가에게 따뜻한 위로가 될 것입니다.", spineTitle: title || "나의 이야기" },
        imagePrompt: "A minimalist abstract painting of a single golden leaf on a dark teal background, subtle textures, elegant, moody, 8k resolution."
      };
    }

    return NextResponse.json({ designParams, success: true });
  } catch (error: any) {
    console.error('3D Design generation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate design' }, { status: 500 });
  }
}
