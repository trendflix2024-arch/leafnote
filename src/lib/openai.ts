import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not defined. AI features will not work.');
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
