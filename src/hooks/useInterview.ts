"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useBookStore, useCurrentProject } from '@/lib/store';

interface Message {
    role: string;
    content: string;
}

interface UseInterviewOptions {
    onResponseComplete?: (text: string) => void;
}

export function useInterview(options?: UseInterviewOptions) {
    const currentProject = useCurrentProject();
    const { addInterviewStep, undoInterviewStep } = useBookStore();

    // Initialize messages from store if available
    const [messages, setMessages] = useState<Message[]>(() => {
        if (!currentProject) return [];
        return currentProject.interviewData.flatMap(step => [
            { role: 'user', content: step.answer },
            { role: 'assistant', content: step.question }
        ]);
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesRef = useRef<Message[]>([]);
    messagesRef.current = messages;

    const sendMessage = useCallback(async (content: string) => {
        if (!currentProject) {
            setError("활성화된 프로젝트가 없습니다.");
            return;
        }

        const userMessage: Message = { role: 'user', content };
        const currentMessages = [...messagesRef.current, userMessage];

        setMessages(currentMessages);
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: currentMessages,
                    projectTitle: currentProject.title,
                    track: 'interview'
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: '서버 오류가 발생했습니다.' }));
                const errMsg = errData.error || `서버 오류 (${response.status})`;
                setError(errMsg);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `⚠️ ${errMsg}\n\n다시 시도해주세요.`
                }]);
                return;
            }

            const reader = response.body?.getReader();
            if (!reader) {
                setError('스트리밍 응답을 받을 수 없습니다.');
                return;
            }

            const decoder = new TextDecoder();
            let assistantContent = '';

            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                assistantContent += chunk;

                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        role: 'assistant',
                        content: assistantContent,
                    };
                    return updated;
                });
            }

            // Immediately trigger TTS callback BEFORE React re-render
            if (options?.onResponseComplete && assistantContent) {
                options.onResponseComplete(assistantContent);
            }

            // Persist to store (assistant question, user answer)
            await addInterviewStep(assistantContent, content);

        } catch (err: any) {
            console.error('Interview error:', err);
            const errMsg = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
            setError(errMsg);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ ${errMsg}`
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [currentProject, addInterviewStep, options]);

    const continueConversation = useCallback(async () => {
        if (!currentProject || messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role !== 'assistant') return;

        setIsLoading(true);
        setError(null);

        // We don't add a new user message to the UI to keep it seamless
        // but we send the "continue" prompt to the API
        const continuationMessages = [
            ...messages,
            { role: 'user', content: '이어서 계속 말씀해주세요.' }
        ];

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: continuationMessages,
                    projectTitle: currentProject.title,
                    track: 'interview'
                }),
            });

            if (!response.ok) throw new Error("계속하기 요청 중 오류가 발생했습니다.");

            const reader = response.body?.getReader();
            if (!reader) throw new Error('스트리밍 응답을 받을 수 없습니다.');

            const decoder = new TextDecoder();
            let addedContent = '';
            const originalContent = lastMessage.content;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                addedContent += chunk;

                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        role: 'assistant',
                        content: originalContent + addedContent,
                    };
                    return updated;
                });
            }

            // Sync the full combined content to the store
            const { updateLastInterviewQuestion } = useBookStore.getState();
            await updateLastInterviewQuestion(originalContent + addedContent);

        } catch (err: any) {
            console.error('Continue error:', err);
            setError(err.message || '오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [currentProject, messages]);

    const undo = useCallback(async () => {
        if (!currentProject || messages.length < 2) return;

        // Update local state (remove last user and assistant message)
        setMessages(prev => prev.slice(0, -2));

        // Revert in store/cloud
        await undoInterviewStep();
    }, [currentProject, messages.length, undoInterviewStep]);

    return { messages, sendMessage, continueConversation, undo, isLoading, error };
}
