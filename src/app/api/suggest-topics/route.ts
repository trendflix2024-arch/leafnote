import { NextResponse } from 'next/server';
import { genAI } from '@/lib/openai';

export async function POST(request: Request) {
    try {
        if (!genAI) {
            return NextResponse.json({ error: 'AI is not configured. (Missing GEMINI_API_KEY)' }, { status: 500 });
        }

        // Higher temperature for more creative and varied suggestions
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { temperature: 0.9 }
        });

        const seed = Math.floor(Math.random() * 1000);

        const prompt = `
당신은 사용자가 글을 시작할 수 있도록 영감을 주는 따뜻한 에디터입니다.
사용자가 '어떤 글'을 쓸지 고민하고 있을 때, 흥미롭고 창의적인 글감(주제 제목) 6가지를 추천해주세요.
단순 자서전뿐만 아니라, 다양한 장르(에세이, 수필, 편지, 레시피북, 소설, 리뷰 등)가 어우러지게 추천해주세요.

(다양성 힌트: ${seed}) 매번 서로 다른 분위기와 주제를 제안하도록 노력하세요.

조건:
- 따뜻하고 감성적인, 혹은 흥미를 유발하는 제목이어야 합니다.
- 15자 내외로 너무 길지 않은 형태로 작성해주세요.
- 반드시 아래의 JSON 배열 형식으로만 응답하세요. 백틱(\`\`\`)이나 다른 설명 텍스트는 **절대** 포함하지 마세요.

["추천 주제 1", "추천 주제 2", "추천 주제 3", "추천 주제 4", "추천 주제 5", "추천 주제 6"]
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // 텍스트 정제 (백틱이나 여분의 공백 제거)
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const topics = JSON.parse(text);

        if (!Array.isArray(topics) || topics.length < 3) {
            throw new Error("Invalid format from AI");
        }

        return NextResponse.json({ topics });

    } catch (error) {
        console.error("Error generating topics:", error);
        // Fallback topics with some variety
        const fallbacks = [
            ["나만이 아는 특별한 레시피", "잊지 못할 20대의 풍경들", "미래의 나에게 쓰는 편지", "우리 동네 산책길의 비밀", "내가 사랑한 계절의 기록", "꿈꾸던 나의 10년 후"],
            ["오래된 일기장 속의 약속", "첫 배낭여행의 서툰 발걸음", "엄마의 앞치마에서 나는 냄새", "나를 버티게 한 한 문장", "달빛 아래서 쓴 비밀 일기", "우연히 만난 숲속의 고요"],
            ["차 한 잔과 나누는 위로", "지하철 창밖으로 흐르는 계절", "내 마음의 지도 그리기", "잃어버린 취미를 찾아서", "꿈속에서 가본 낯선 도시", "나를 웃게 만드는 작은 것들"]
        ];
        const randomSet = fallbacks[Math.floor(Math.random() * fallbacks.length)];

        return NextResponse.json({ topics: randomSet });
    }
}
