"use client";

import { useState, useCallback, useRef } from 'react';

export function useTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const speak = useCallback(async (text: string) => {
        if (!text?.trim()) return;

        // Stop any current audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        window.speechSynthesis?.cancel();

        setIsLoading(true);
        setIsSpeaking(true);

        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                console.warn('TTS API failed, using browser fallback');
                fallbackBrowserTTS(text);
                return;
            }

            const data = await response.json();

            // Check if server tells us to use browser fallback
            if (data.useBrowserFallback) {
                fallbackBrowserTTS(text);
                return;
            }

            if (data.audioContent) {
                const mimeType = data.mimeType || 'audio/mp3';
                const audio = new Audio(`data:${mimeType};base64,${data.audioContent}`);
                audioRef.current = audio;

                audio.onended = () => {
                    setIsSpeaking(false);
                    setIsLoading(false);
                    audioRef.current = null;
                };
                audio.onerror = () => {
                    console.warn('Audio playback failed, using browser fallback');
                    fallbackBrowserTTS(text);
                };

                setIsLoading(false);
                await audio.play();
            } else {
                fallbackBrowserTTS(text);
            }
        } catch (error) {
            console.error('TTS error:', error);
            fallbackBrowserTTS(text);
        }
    }, []);

    const fallbackBrowserTTS = useCallback((text: string) => {
        setIsLoading(false);

        if (!window.speechSynthesis) {
            setIsSpeaking(false);
            return;
        }

        const cleanText = text
            .replace(/[#*_~`>]/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/⚠️|✦|🎙️|⏳|🔑/g, '')
            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.95;
        utterance.pitch = 1.05;

        const voices = window.speechSynthesis.getVoices();
        const koreanVoice = voices.find(v => v.lang === 'ko-KR')
            || voices.find(v => v.lang.startsWith('ko'));
        if (koreanVoice) utterance.voice = koreanVoice;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, []);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
        setIsLoading(false);
    }, []);

    const toggleAutoSpeak = useCallback(() => {
        setAutoSpeak(prev => !prev);
    }, []);

    return { speak, stop, isSpeaking, isLoading, autoSpeak, toggleAutoSpeak };
}
