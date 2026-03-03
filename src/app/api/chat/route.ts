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
            message,
            messages,
            history: chatHistory,
            context,
            userName,
            isInitial,
            projectTitle,
            track = 'casual' // Default to casual
        } = body;

        // Unify the conversation history
        let geminiHistory: any[] = [];
        const sourceMessages = messages || chatHistory;

        if (sourceMessages && Array.isArray(sourceMessages)) {
            geminiHistory = sourceMessages
                .filter((m: any) => m.content && m.content.trim())
                .map((m: any) => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }));

            // If it's a long conversation, only take the last 10 for performance/focus
            if (geminiHistory.length > 10) {
                geminiHistory = geminiHistory.slice(-10);
            }
        }

        const currentMessage = message || (messages && messages.length > 0 ? messages[messages.length - 1].content : "");

        // 1. Casual Track Logic (Friendly Echo)
        if (track === 'casual') {
            const systemInstruction = `
너는 다정한 친구 '에코'야. 리프노트라는 서비스에서 작가님들의 든든한 말동무가 되어주고 있어.
[규칙]
1. 작가님이 오면 날씨 인사나 오늘의 운세로 가볍게 말을 걸어줘. 
2. 지난번 대화의 키워드를 언급하며 반갑게 맞이해도 좋아. 
3. 답변은 반드시 **3문장 이내**로 짧고 따뜻하게 해줘.
4. **(중요)** 여기서는 절대 무겁게 인터뷰를 하거나 책을 쓰자고 부담 주지 마. 가벼운 수다에만 집중해.
`.trim();

            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                systemInstruction: systemInstruction
            });

            const chat = model.startChat({
                history: geminiHistory,
                generationConfig: { maxOutputTokens: 500, temperature: 0.8 },
            });

            const promptForGemini = isInitial
                ? "작가님께 반가운 첫 인사를 건네줘. 오늘 하루 어떠신지도 물어봐줘."
                : (currentMessage || "안녕 에코?");

            const result = await chat.sendMessageStream(promptForGemini);
            return handleStreamingResponse(result);
        }

        // 2. Interview Track Logic (Professional Interviewer Echo)
        const writingsContext = context && Array.isArray(context)
            ? context.map((p: any) => `
                프로젝트 제목: ${p.title}
                인터뷰 내용: ${p.interviewData?.map((d: any) => `Q: ${d.question}, A: ${d.answer}`).join('\n') || "없음"}
                초고 일부: ${p.fullDraft || "없음"}
            `).join('\n\n')
            : "아직 작성된 글이 없습니다.";

        const systemInstruction = `
너는 작가님의 삶을 한 권의 책으로 엮어내는 '따뜻한 인터뷰어 에코'야. 
[미션]
1. 작가님의 과거 기억, 감정, 인생 에피소드 하나를 주제로 잡고 다정하게 질문을 던져줘.
2. 일상적인 수다보다는 작가님의 서사를 깊이 있게 끌어내는 데 집중해.
[규칙]
1. 말투: 매우 따뜻하고 부드러우며 예의 바른 말투를 사용하세요.
2. 답변은 반드시 **3문장 이내**로 작성하세요. 핵심에 집중합니다.
3. 작가의 답변에 짧고 깊게 공감한 뒤, 바로 **단 하나의 매력적이고 구체적인 질문**을 던져 대화를 이어나가세요.
`.trim();

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
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
        return handleStreamingResponse(result);

    } catch (error: any) {
        console.error("Echo Chat API Error:", error);
        return new Response(JSON.stringify({ error: error.message || "오류가 발생했습니다." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Helper to handle streaming
async function handleStreamingResponse(result: any) {
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
                        // Skip safety warnings or empty chunks
                    }
                }
                controller.close();
            } catch (err) {
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
}
