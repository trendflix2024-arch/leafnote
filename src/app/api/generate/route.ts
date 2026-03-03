import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

export async function POST(req: Request) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다. 관리자에게 문의하세요.' }, { status: 500 });
    }

    try {
        const { interviewData, projectTitle, author, tone } = await req.json();

        if (!interviewData || interviewData.length === 0) {
            return NextResponse.json({ error: '인터뷰 데이터가 부족합니다. 인터뷰를 조금 더 진행해 주세요.' }, { status: 400 });
        }

        // Using gemini-pro for better creative writing and length
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const toneInstruction = tone ?
            `\n      **(필수 지침) 전체 글의 분위기와 문체를 반드시 '${tone}' 느낌으로 작성해주세요.**` : '';

        const prompt = `
      다음은 "${author || '작가'}"님의 책 "${projectTitle}" 주제에 대한 인터뷰 데이터입니다.
      이 데이터를 바탕으로 한 권의 완성된 책 초고를 작성해주세요.${toneInstruction}

      [작성 지침: 분량 및 묘사 강화]
      1. 기승전결이 있는 챕터 구조로 나누어 작성하세요. (예: 프롤로그, 제1장, 제2장... 에필로그)
      2. **(중요) 각 챕터의 제목은 감성적이고 시적으로 지어주세요.** (예: "제1장 | 새벽 4시, 캔트지 위의 조각가")
      3. **(핵심: 창의적 확장 - Creative Expansion)** 사용자의 답변이 짧더라도, 그 행간에 숨겨진 감정과 풍경을 깊이 있게 추론하여 묘사하세요. 
         - 인물의 심리, 주변의 날씨, 공기의 온도, 당시의 시각적/청각적/후각적 디테일을 풍성하게 덧붙이세요.
         - **한 문장의 답변을 최소 2~3개 이상의 유려한 문단으로 확장**하여, 독자가 그 현장에 있는 것처럼 느끼게 해야 합니다.
      4. **(분량 확보)** 단행본 책의 물리적 두께감을 위해 **최대한 길고 상세하게** 작성하세요. 각 챕터는 A4 용지 1~2매 이상의 충분한 호흡을 가져야 합니다.
      5. 사용자의 말투와 감성을 살리되, 요청된 문체(${tone || '전문적인 작가'})로 문학적인 품질을 구현하세요.
      6. 마크다운 헤딩 형식(예: '## 프롤로그 | 다시 붓을 들 용기')을 사용해 챕터를 구분하세요.

      [마지막 글귀 (The Closing Remark) 추가 지침]
      맨 마지막 챕터 끝에 **## 작가의 말 | 당신이라는 숲** 헤딩을 추가하고 아래 글귀를 작성하세요. 
      따옴표 안의 [서툰 선들]과 [라면 국물 자국]은 사용자의 고생/노력의 흔적을 상징하는 단어로 자연스럽게 교체하세요.

      "인생이라는 거대한 캔버스 위에서,
      우리는 때로 원치 않는 색으로 덧칠해지기도 하고
      기대했던 구도가 어긋나 길을 잃기도 합니다.

      하지만 잊지 마세요.
      당신이 꾹꾹 눌러 쓴 그 [서툰 선들]과
      차마 지우지 못한 [라면 국물 자국]마저도
      누군가에게는 세상에 단 하나뿐인
      가장 따뜻한 색감의 걸작이었다는 것을.

      참 애쓰셨습니다. 당신이라는 숲은 이미 충분히 푸릅니다."

      인터뷰 데이터:
      ${interviewData.map((d: any) => `Q: ${d.question}\nA: ${d.answer}`).join('\n\n')}
    `;

        const result = await model.generateContent(prompt);
        const responseData = await result.response;
        const draft = responseData.text();

        if (!draft) {
            throw new Error('AI 응답이 비어있습니다.');
        }

        return NextResponse.json({ draft });
    } catch (error: any) {
        console.error('Draft generation error:', error);

        let errorMessage = '원고 생성 중 오류가 발생했습니다.';
        if (error.message?.includes('429')) {
            errorMessage = 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message?.includes('500')) {
            errorMessage = 'AI 서버에 일시적인 오류가 발생했습니다.';
        } else if (error.message) {
            errorMessage = `오류: ${error.message}`;
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

