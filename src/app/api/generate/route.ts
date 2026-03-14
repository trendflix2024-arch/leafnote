import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

const FREE_DRAFT_LIMIT = 1;

export async function POST(req: Request) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다. 관리자에게 문의하세요.' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { interviewData, projectTitle, author, tone, mode, text, refineType, existingContent, chapterTitle, additionalInterviewData } = body;

        // 구독 및 사용량 체크 (refine 모드에서는 스킵)
        const session = await getServerSession(authOptions);
        let userId: string | null = null;
        let draftCountBefore = 0;

        if (session?.user) {
            userId = (session.user as any).id as string;
        }

        if (mode !== 'refine' && mode !== 'expand-chapter' && userId) {
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('plan, status, expires_at')
                .eq('user_id', userId)
                .maybeSingle();

            const now = new Date();
            const isActive = sub?.status === 'active' && sub?.expires_at && new Date(sub.expires_at) > now;
            const isPremium = isActive && (sub?.plan === 'monthly' || sub?.plan === 'yearly');

            if (!isPremium) {
                const { data: usage } = await supabase
                    .from('usage_stats')
                    .select('draft_count')
                    .eq('user_id', userId)
                    .maybeSingle();

                draftCountBefore = usage?.draft_count ?? 0;
                if (draftCountBefore >= FREE_DRAFT_LIMIT) {
                    return NextResponse.json({ error: 'upgrade_required' }, { status: 403 });
                }
            }
        }

        // Using gemini-pro for better creative writing and length
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // ── Refine mode: 원본을 보존하면서 문체만 다듬기 ──
        if (mode === 'refine') {
            if (!text?.trim()) {
                return NextResponse.json({ error: '다듬을 텍스트가 없습니다.' }, { status: 400 });
            }

            const formatRule = `\n\n[출력 규칙]
- 마크다운 서식(**, *, ##, \`\`\` 등)을 절대 사용하지 마세요. 순수 텍스트만 출력하세요.
- 한국어 맞춤법과 띄어쓰기를 정확하게 지켜주세요.
- 다듬어진 결과만 출력하세요. 설명이나 주석을 붙이지 마세요.`;

            const refinePrompts: Record<string, string> = {
                'detail': `당신은 숙련된 한국 문학 편집자입니다.
아래 원문의 핵심 내용, 사건, 인물, 구조를 반드시 그대로 유지하면서,
감각적 디테일(시각·청각·후각·촉각)과 인물의 내면 감정을 풍성하게 추가해주세요.
원문에 없는 새로운 사건이나 인물을 만들지 마세요.${formatRule}

원문:
${text}`,
                'literary': `당신은 숙련된 한국 문학 편집자입니다.
아래 원문의 핵심 내용, 사건, 인물, 구조를 반드시 그대로 유지하면서,
문학적이고 예술적인 산문체로 문장을 다듬어주세요.
은유, 비유, 리듬감 있는 문장을 활용하되 원래 말하고자 하는 바를 왜곡하지 마세요.${formatRule}

원문:
${text}`,
                'warm': `당신은 숙련된 한국 문학 편집자입니다.
아래 원문의 핵심 내용, 사건, 인물, 구조를 반드시 그대로 유지하면서,
더 따뜻하고 감성적인 톤으로 문장을 다듬어주세요.
독자가 위로받는 느낌이 들도록 하되, 원래 내용을 바꾸지 마세요.${formatRule}

원문:
${text}`,
                'concise': `당신은 숙련된 한국 문학 편집자입니다.
아래 원문의 핵심 내용과 의미를 반드시 보존하면서,
군더더기를 제거하고 간결하고 임팩트 있게 다듬어주세요.
중요한 내용이 빠지지 않도록 주의하세요.${formatRule}

원문:
${text}`,
            };

            const refinePrompt = refinePrompts[refineType] || refinePrompts['literary'];

            try {
                const result = await model.generateContent(refinePrompt);
                const responseData = await result.response;
                const refined = responseData.text();
                if (!refined) throw new Error('AI 응답이 비어있습니다.');
                return NextResponse.json({ draft: refined });
            } catch (error: any) {
                console.error('Refine error:', error?.message || error);
                const msg = error?.message || '';
                if (msg.includes('429') || msg.includes('RATE_LIMIT') || msg.includes('quota')) {
                    return NextResponse.json({ error: 'AI가 잠시 쉬고 있어요. 10초 후 다시 시도해 주세요.' }, { status: 429 });
                }
                return NextResponse.json({ error: '문장 다듬기 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
            }
        }

        // ── 챕터 확장 모드 ──
        if (mode === 'expand-chapter') {
            const qaText = (additionalInterviewData || [])
                .map((d: { question: string; answer: string }) => `에코: ${d.question}\n작가님: ${d.answer}`)
                .join('\n\n');

            const expandPrompt = `당신은 숙련된 한국 산문 작가입니다.
"${author || '작가'}"님의 책 "${projectTitle}"의 "[${chapterTitle}]" 챕터 기존 내용과 추가 인터뷰 내용입니다.

[기존 챕터 내용]
${existingContent || '(내용 없음)'}

[추가 인터뷰 내용]
${qaText}

[작성 지침]
1. 인터뷰 내용을 바탕으로 기존 챕터와 자연스럽게 이어지는 새로운 단락을 작성하세요.
2. 기존 챕터의 말투, 시점, 감성적 톤을 유지하세요.
3. 마크다운 서식(##, **, * 등)은 절대 사용하지 마세요. 순수 산문 텍스트만 출력하세요.
4. 기존 내용을 반복하거나 요약하지 마세요. 새로운 기억, 감정, 장면만 추가하세요.
5. 500자 이상 1500자 이하.
6. 새로운 단락들만 출력하세요. 제목, 설명, 주석 없이.`;

            try {
                const result = await model.generateContent(expandPrompt);
                const expandedText = (await result.response).text();
                if (!expandedText) throw new Error('AI 응답이 비어있습니다.');
                return NextResponse.json({ draft: expandedText.trim() });
            } catch (error: any) {
                console.error('Expand chapter error:', error?.message || error);
                const msg = error?.message || '';
                if (msg.includes('429') || msg.includes('RATE_LIMIT') || msg.includes('quota')) {
                    return NextResponse.json({ error: 'AI가 잠시 쉬고 있어요. 잠시 후 다시 시도해 주세요.' }, { status: 429 });
                }
                return NextResponse.json({ error: '챕터 확장 중 오류가 발생했습니다.' }, { status: 500 });
            }
        }

        // ── 기존 초고 생성 모드 ──
        if (!interviewData || interviewData.length === 0) {
            return NextResponse.json({ error: '인터뷰 데이터가 부족합니다. 인터뷰를 조금 더 진행해 주세요.' }, { status: 400 });
        }

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

        // 사용량 증가
        if (userId) {
            await supabase.from('usage_stats').upsert({
                user_id: userId,
                draft_count: draftCountBefore + 1,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
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

