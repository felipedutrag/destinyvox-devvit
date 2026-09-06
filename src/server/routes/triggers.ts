import { context, reddit, redis } from '@devvit/web/server';
import { Hono } from 'hono';
import type { OnAppInstallRequest, TriggerResponse } from '@devvit/web/shared';

import { createPost } from '../core/post';

export const triggers = new Hono();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

type GeminiReplyResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type CommentCreateEvent = {
  comment?: {
    id?: `t1_${string}` | `t3_${string}`;
    body?: string;
  };
  author?: {
    name?: string;
  };
};

// Função para chamar o Google Gemini e gerar uma resposta espirituosa/engraçada
async function generateFunnyGeminiReply(commentText: string, author: string): Promise<string> {
  try {
    const customPromptSetting = (await redis.get('bot_prompt_persona')) || 'Você é um bot bem-humorado, sarcástico e espirituoso nos comentários do Reddit.';
    const prompt = `${customPromptSetting}
O usuário "${author}" acabou de comentar: "${commentText}".
Gere uma resposta curta (no máximo 2 frases), extremamente engraçada, rápida e espirituosa para responder diretamente ao comentário dele. Responda em português. Seja divertido e use emojis.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 120,
            temperature: 0.9,
          },
        }),
      }
    );

    const data: GeminiReplyResponse = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return reply || `u/${author} falou pouco, mas falou bonito! 😂🤖`;
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error);
    return `u/${author} Eu até ia fazer uma piada com isso, mas meu processador quase fritou de tanta sabedoria! 🧠💥`;
  }
}

triggers.post('/on-app-install', async (c) => {
  try {
    const post = await createPost();

    const input = await c.req.json<OnAppInstallRequest>();

    return c.json<TriggerResponse>(
      {
        status: 'success',
        message: `Post created in subreddit ${context.subredditName} with id ${post.id} (trigger: ${input.type})`,
      },
      200
    );
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return c.json<TriggerResponse>(
      {
        status: 'error',
        message: 'Failed to create post',
      },
      400
    );
  }
});

// Gatilho oficial: Sempre que alguém comentar no subreddit
triggers.post('/on-comment-create', async (c) => {
  try {
    const event: CommentCreateEvent = await c.req.json();
    const comment = event?.comment;
    const author = event?.author?.name;

    // Evitar que o bot responda a si mesmo em loop infinito
    if (!comment || !comment.id || author === 'dgapp' || author === 'AutoModerator') {
      return c.json({ status: 'ignored' }, 200);
    }

    // Checar se o bot está ativo no Redis
    const isBotEnabled = (await redis.get('bot_auto_reply_enabled')) !== 'false';
    if (!isBotEnabled) {
      console.log('🛑 Auto-reply do bot está desativado pelo painel de controle.');
      return c.json({ status: 'bot_disabled' }, 200);
    }

    console.log(`💬 Comentário recebido de @${author}: "${comment.body}"`);
    const replyText = await generateFunnyGeminiReply(comment.body || '', author || 'amigo');

    // Responder o comentário diretamente na thread
    await reddit.submitComment({
      id: comment.id,
      text: replyText,
    });
    console.log(`🤖 Resposta enviada com sucesso para @${author}!`);

    return c.json({ status: 'success', repliedTo: comment.id }, 200);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro no onCommentCreate:', errorMsg);
    return c.json({ status: 'error', message: errorMsg }, 500);
  }
});
