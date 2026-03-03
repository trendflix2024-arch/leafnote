import { NextResponse } from 'next/server';

// Convert raw PCM (Linear16) data to WAV format by adding a WAV header
function pcmToWav(pcmData: Buffer, sampleRate: number = 24000, numChannels: number = 1, bitsPerSample: number = 16): Buffer {
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.length;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const header = Buffer.alloc(headerSize);

    // RIFF header
    header.write('RIFF', 0);
    header.writeUInt32LE(totalSize - 8, 4);    // File size - 8
    header.write('WAVE', 8);

    // fmt sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);              // Sub-chunk size (16 for PCM)
    header.writeUInt16LE(1, 20);               // Audio format (1 = PCM)
    header.writeUInt16LE(numChannels, 22);     // Number of channels
    header.writeUInt32LE(sampleRate, 24);       // Sample rate
    header.writeUInt32LE(byteRate, 28);         // Byte rate
    header.writeUInt16LE(blockAlign, 32);       // Block align
    header.writeUInt16LE(bitsPerSample, 34);   // Bits per sample

    // data sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);         // Data size

    return Buffer.concat([header, pcmData]);
}

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text?.trim()) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        // Clean text for TTS
        const cleanText = text
            .replace(/[#*_~`>]/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/⚠️|✦|🎙️|⏳|🔑/g, '')
            .trim()
            .substring(0, 4000);

        // Use Gemini 1.5 Flash TTS
        const models = [
            'gemini-2.5-flash-8b-latest',
            'gemini-2.5-flash',
        ];

        for (const model of models) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: cleanText }],
                            }],
                            generationConfig: {
                                responseModalities: ['AUDIO'],
                                speechConfig: {
                                    voiceConfig: {
                                        prebuiltVoiceConfig: {
                                            voiceName: 'Kore',
                                        },
                                    },
                                },
                            },
                        }),
                    }
                );

                if (!response.ok) {
                    console.warn(`TTS model ${model} failed: ${response.status}`);
                    continue;
                }

                const data = await response.json();
                const part = data?.candidates?.[0]?.content?.parts?.[0];

                if (part?.inlineData?.data) {
                    const rawMimeType = part.inlineData.mimeType || '';
                    const pcmBuffer = Buffer.from(part.inlineData.data, 'base64');

                    // Parse sample rate from mime type (e.g. "audio/L16;codec=pcm;rate=24000")
                    let sampleRate = 24000;
                    const rateMatch = rawMimeType.match(/rate=(\d+)/);
                    if (rateMatch) sampleRate = parseInt(rateMatch[1]);

                    // Convert raw PCM to WAV for browser playback
                    const wavBuffer = pcmToWav(pcmBuffer, sampleRate);
                    const wavBase64 = wavBuffer.toString('base64');

                    return NextResponse.json({
                        audioContent: wavBase64,
                        mimeType: 'audio/wav',
                    });
                }
            } catch (modelError: any) {
                console.warn(`TTS model ${model} error:`, modelError.message?.substring(0, 100));
                continue;
            }
        }

        // Signal client to use browser TTS as fallback
        return NextResponse.json({ useBrowserFallback: true });

    } catch (error: any) {
        console.error('TTS API Error:', error);
        return NextResponse.json(
            { error: error.message || 'TTS 생성 실패' },
            { status: 500 }
        );
    }
}
