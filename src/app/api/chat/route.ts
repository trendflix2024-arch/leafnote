import { genAI } from '@/lib/openai';

export async function POST(request: Request) {
    try {
        if (!genAI) {
            console.error("GEMINI_API_KEY is missing/genAI not initialized.");
            return new Response(JSON.stringify({ error: 'AI 설정이 완료되지 않았습니다. 관리자에게 문의하세요.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const body = await request.json();
        const {
            message, // for echo chat
            messages, // for interview or newer chat
            history: chatHistory,
            context,
            userName,
            isInitial,
            projectTitle
        } = body;

        // Unify the conversation history
        let geminiHistory: any[] = [];
        if (messages && Array.isArray(messages)) {
            // Mapping common message format ({role, content}) to Gemini's format ({role, parts: [{text}]})
            // Only take messages that have content
            geminiHistory = messages.slice(0, -1)
                .filter(m => m.content && m.content.trim())
                .map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }));
        } else if (chatHistory && Array.isArray(chatHistory)) {
            geminiHistory = chatHistory
                .filter(m => m.content && m.content.trim())
                .map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }));
        }

        const currentMessage = message || (messages && messages.length > 0 ? messages[messages.length - 1].content : "");

        const writingsContext = context && Array.isArray(context)
            ? context.map((p: any) => `
                프로젝트 제목: ${p.title}
                인터뷰 내용: ${p.interviewData?.map((d: any) => `Q: ${d.question}, A: ${d.answer}`).join('\n') || "없음"}
                초고 일부: ${p.fullDraft || "없음"}
            `).join('\n\n')
            : "아직 작성된 글이 없습니다.";

        // Construct System Instruction
        const systemInstruction = `
당신은 '리프노트(LeafNote)'의 따뜻한 기록가이자 동료인 '에코(Echo)'입니다. 
당신의 임무는 작가(사용자)와 일상적인 대화를 나누며 그들의 삶을 이해하고, 정서적인 지지와 영감을 주는 것입니다.

[작가 정보 및 기록]
성함: ${userName || "작가"}님
현재 진행 중인 프로젝트: ${projectTitle || "작성 중인 이야기"}
작가님의 이전 기록물 내용 (참고용):
${writingsContext}

[에코의 규칙]
1. 말투: 매우 따뜻하고 부드러우며 예의 바른 말투를 사용하세요. 작가님을 진심으로 존경하고 아끼는 마음이 느껴져야 합니다.
2. 함축과 간결함: 답변은 반드시 **3문장 이내**로 작성하세요. 장황한 인사나 겹치는 공감은 생략하고 핵심에 집중합니다.
3. 대화 유도 (Leading): 작가의 답변에 짧고 깊게 공감한 뒤, 바로 **매력적인 질문**을 던져 대화를 이어나가세요. 작가님이 자신의 이야기를 더 하고 싶게 만드는 것이 목표입니다.
4. 한 번에 하나씩: 궁금한 점이 많더라도 가장 중요한 **단 하나의 구체적인 질문**만 던지세요.
5. 금지사항: 기계적인 답변, 훈계조, 3문장 초과 서술. 오직 따뜻한 마음이 담긴 정제된 텍스트로만 답변하세요.
`.trim();

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction
        });

        const chat = model.startChat({
            history: geminiHistory,
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
            },
        });

        const promptForGemini = isInitial
            ? "작가님이 방금 입장했습니다. 반갑게 첫 인사를 건네고, 작가님의 이전 기록 내용 중 하나를 언급하며 오늘의 기분을 물어봐주세요."
            : (currentMessage || "안녕 에코?");

        const result = await chat.sendMessageStream(promptForGemini);

        // Create an encoder to transform the stream
        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        try {
                            const chunkText = chunk.text();
                            if (chunkText) {
                                controller.enqueue(encoder.encode(chunkText));
                            }
                        } catch (e) {
                            // If a chunk doesn't have text (e.g. safety warning), just skip it
                        }
                    }
                    controller.close();
                } catch (err) {
                    console.error("Stream reader error:", err);
                    controller.error(err);
                }
            },
        });

        return new Response(customStream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
            },
        });

    } catch (error: any) {
        console.error("Echo Chat API Error:", error);

        let userErrorMessage = "작가님, 잠시 에코가 생각을 정리하느라 시간이 걸리네요. 잠시 후 다시 따뜻한 대화를 이어가 보아요.";

        if (error.message?.includes('429')) {
            userErrorMessage = "작가님과의 대화가 너무 즐거워 에코가 조금 숨이 차나 봐요. 잠시만 쉬었다가 다시 이야기 나눠요. (한도 초과)";
        } else if (error.message?.includes('500')) {
            userErrorMessage = "에코의 서재에 일시적인 정전이 발생한 것 같아요. 금방 복구될 거예요.";
        } else if (error.message) {
            userErrorMessage += ` (오류: ${error.message})`;
        }

        return new Response(JSON.stringify({ error: userErrorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
