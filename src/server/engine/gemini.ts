import type { GeminiApiResponse } from './types';

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function callGemini(
  prompt: string,
  model: string = 'gemini-2.5-flash',
  maxTokens: number = 8192,
  temperature: number = 0.8,
  jsonMode: boolean = true
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the environment.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  };

  if (jsonMode) {
    (body.generationConfig as Record<string, unknown>).responseMimeType = 'application/json';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.warn(`[Gemini] Requisição retornou status ${res.status}: ${res.statusText}`);
    throw new Error(`Gemini API HTTP ${res.status}`);
  }

  const data: GeminiApiResponse = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('').trim();
}
