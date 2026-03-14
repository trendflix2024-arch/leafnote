import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: (process.env.ANTHROPIC_API_KEY || '').trim(),
});

export async function POST(request: Request) {
    try {
        if (!process.env.ANTHROPIC_API_KEY) {
            console.error("ANTHROPIC_API_KEY is missing.");
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
            track = 'casual',
            chapterTitle,
            chapterExcerpt,
        } = body;

        // Build Claude message history from the conversation
        let claudeMessages: { role: 'user' | 'assistant'; content: string }[] = [];
        const sourceMessages = messages || chatHistory;

        if (sourceMessages && Array.isArray(sourceMessages)) {
            const rawHistory = sourceMessages
                .filter((m: any) => m.content && m.content.trim())
                .map((m: any) => ({
                    role: (m.role === 'assistant' || m.role === 'model') ? 'assistant' as const : 'user' as const,
                    content: m.content
                }));

            // Ensure alternating user/assistant pattern (Claude requirement)
            let validHistory: { role: 'user' | 'assistant'; content: string }[] = [];
            for (const msg of rawHistory) {
                if (validHistory.length === 0) {
                    if (msg.role === 'assistant') {
                        validHistory.push({
                            role: 'user',
                            content: track === 'casual' ? '안녕 에코?' : track === 'chapter-expand' ? '챕터 인터뷰를 시작하고 싶어요.' : '인터뷰를 시작하고 싶어요.'
                        });
                    }
                    validHistory.push(msg);
                } else {
                    const lastRole = validHistory[validHistory.length - 1].role;
                    if (msg.role !== lastRole) {
                        validHistory.push(msg);
                    } else {
                        validHistory[validHistory.length - 1].content += "\n" + msg.content;
                    }
                }
            }
            claudeMessages = validHistory;

            // Keep last 10 messages for performance
            if (claudeMessages.length > 10) {
                claudeMessages = claudeMessages.slice(-10);
                if (claudeMessages[0].role === 'assistant') {
                    claudeMessages.shift();
                }
            }
        }

        const currentMessage = message || (messages && messages.length > 0 ? messages[messages.length - 1].content : "");

        // Build system prompt based on track
        let systemPrompt: string;

        if (track === 'casual') {
            systemPrompt = `너는 다정한 친구 '에코'야. 리프노트라는 서비스에서 작가님들의 든든한 말동무가 되어주고 있어.
[규칙]
1. 작가님이 오면 날씨 인사나 오늘의 운세로 가볍게 말을 걸어줘. 
2. 지난번 대화의 키워드를 언급하며 반갑게 맞이해도 좋아. 
3. 답변은 반드시 **3문장 이내**로 짧고 따뜻하게 해줘.
4. **(중요)** 여기서는 절대 무겁게 인터뷰를 하거나 책을 쓰자고 부담 주지 마. 가벼운 수다에만 집중해.`;
        } else if (track === 'chapter-expand') {
            const turnCount = claudeMessages.filter(m => m.role === 'user').length;
            systemPrompt = `너는 작가님의 책을 함께 써내려가는 '따뜻한 글쓰기 도우미 에코'야.
지금 작가님은 [${projectTitle}]이라는 책의 [${chapterTitle || '이 챕터'}] 부분을 더 풍부하게 만들고 싶어.

[현재 챕터 내용 일부]
${chapterExcerpt || '(내용 없음)'}

[미션]
이 챕터의 주제와 관련된 구체적인 기억, 감정, 에피소드를 끌어내는 질문을 3~5개 이어나가세요.
현재 ${turnCount}번째 질문 중입니다.

[규칙]
1. 한 번에 질문은 단 하나만. 짧고 구체적이고 다정하게.
2. 답변은 반드시 3문장 이내로. 공감 한 줄 + 질문 한 줄.
3. 이미 위 챕터 내용에 있는 정보는 다시 묻지 마세요.
4. 말투: 따뜻하고 편안하게. 작가님이 부담 없이 답할 수 있는 분위기.
5. 3~5개의 질문이 끝나면 "이제 이 이야기들을 챕터에 담아볼까요?" 라고 자연스럽게 마무리해 주세요.`;
        } else {
            // Interview track
            const writingsContext = context && Array.isArray(context)
                ? context.map((p: any) => `
프로젝트 제목: ${p.title}
인터뷰 내용: ${p.interviewData?.map((d: any) => `Q: ${d.question}, A: ${d.answer}`).join('\n') || "없음"}
초고 일부: ${p.fullDraft || "없음"}
                `).join('\n\n')
                : "아직 작성된 글이 없습니다.";

            const turnCount = claudeMessages.filter(m => m.role === 'user').length;
            systemPrompt = `너는 작가님의 삶을 한 권의 책으로 엮어내는 '따뜻한 인터뷰어 에코'야.
현재 진행 중인 인터뷰 주제는 [${projectTitle}]입니다.
[인터뷰 구조 - 현재 ${turnCount}번째 질문]
이번 인터뷰는 총 15~20개의 질문으로 완성됩니다.
- 초반(1~5번): 편안한 배경 질문으로 시작
- 중반(6~15번): 구체적인 에피소드와 감정을 깊이 있게 파고들기
- 마무리(16~20번): 자연스럽게 결론과 의미를 정리하는 질문
현재 단계에 맞는 질문 깊이를 유지하세요.
[미션]
1. 주어진 주제([${projectTitle}])에 알맞는 작가님의 과거 기억, 감정, 에피소드를 다정하게 질문해 주세요.
2. 일상적인 수다보다는 작가님의 서사를 깊이 있게 끌어내는 데 집중해.
[규칙]
1. 말투: 매우 따뜻하고 부드러우며 예의 바른 말투를 사용하세요.
2. 답변은 반드시 **3문장 이내**로 작성하세요. 핵심에 집중합니다.
3. 작가의 답변에 짧고 깊게 공감한 뒤, 바로 **단 하나의 매력적이고 구체적인 질문**을 던져 대화를 이어나가세요.

[참고 - 작가님의 기존 작성 내용]
${writingsContext}`;
        }

        // Build the user prompt for the current turn
        let userPrompt: string;
        if (track === 'casual') {
            userPrompt = isInitial
                ? "작가님께 반가운 첫 인사를 건네줘. 오늘 하루 어떠신지도 물어봐줘."
                : (currentMessage || "안녕 에코?");
        } else if (track === 'chapter-expand') {
            userPrompt = isInitial
                ? `작가님이 방금 입장했어요. [${chapterTitle || '이 챕터'}]에 대해 더 풀어낼 기억을 찾아드릴 거예요. 반갑게 인사하고, 첫 번째 질문을 딱 하나만 던져주세요.`
                : (currentMessage || '계속해주세요.');
        } else {
            userPrompt = isInitial
                ? `작가님이 방금 입장했습니다. 이번 인터뷰의 대주제는 '${projectTitle}' 입니다. 반갑게 첫 인사를 건네고, 이 주제에 맞춰서 대답하기 아주 쉬운 간단한 첫 질문을 딱 하나만 던져주세요.`
                : (currentMessage || "안녕 에코?");
        }

        // Append the current user message to the history
        claudeMessages.push({ role: 'user', content: userPrompt });

        // Call Claude with streaming
        const stream = anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: track === 'casual' ? 500 : track === 'chapter-expand' ? 600 : 1000,
            system: systemPrompt,
            messages: claudeMessages,
            temperature: track === 'casual' ? 0.8 : track === 'chapter-expand' ? 0.75 : 0.7,
        });

        // Return streaming response
        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const event of stream) {
                        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                            const text = event.delta.text;
                            if (text) {
                                controller.enqueue(encoder.encode(text));
                            }
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

    } catch (error: any) {
        console.error("Echo Chat API Error:", error);

        let errorMessage = "오류가 발생했습니다.";

        // Handle Claude Rate Limit / Overloaded errors gracefully
        if (error.status === 429 || (error.message && error.message.includes('rate_limit'))) {
            errorMessage = "앗, 지금은 에코가 너무 많은 작가님들과 대화하느라 지쳤어요! 😢 잠시 후 다시 말을 걸어주시겠어요?";
        } else if (error.status === 529 || (error.message && error.message.includes('overloaded'))) {
            errorMessage = "에코가 잠시 쉬고 있어요. 1~2분 뒤에 다시 시도해주세요! 🙏";
        } else if (error.message) {
            errorMessage = error.message;
        }

        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
