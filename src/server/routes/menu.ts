import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { createPost } from '../core/post';

export const menu = new Hono();

menu.post('/post-create', async (c) => {
  try {
    const post = await createPost();

    return c.json<UiResponse>(
      {
        navigateTo: `https://reddit.com/comments/${post.id}`,
      },
      200
    );
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to create post',
      },
      400
    );
  }
});

menu.post('/delete-bot-comments', async (c) => {
  try {
    const { reddit } = await import('@devvit/web/server');
    const appUser = (await reddit.getAppUser()) || { username: 'dgapp' };
    const comments = await reddit
      .getCommentsByUser({
        username: appUser.username,
        sort: 'new',
        limit: 100,
      })
      .all();

    let count = 0;
    for (const comment of comments) {
      try {
        await comment.delete();
        count++;
      } catch {
        // Ignorar falha ao deletar comentário individual
      }
    }

    return c.json<UiResponse>(
      {
        showToast: `🗑️ ${count} comentários do bot foram apagados com sucesso!`,
      },
      200
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return c.json<UiResponse>(
      {
        showToast: `Erro ao apagar: ${errorMsg}`,
      },
      400
    );
  }
});

menu.post('/toggle-vip', async (c) => {
  try {
    const { reddit, redis } = await import('@devvit/web/server');
    const rawUsername = await reddit.getCurrentUsername();
    if (!rawUsername) {
      return c.json<UiResponse>({ showToast: 'Usuário não autenticado.' }, 400);
    }
    const cleanUser = rawUsername.replace(/^u\//i, '').trim();
    const normUser = cleanUser.toLowerCase();

    const current = await redis.get(`destinyvox_vip_${normUser}`);
    if (current === 'active') {
      await redis.del(`destinyvox_vip_${cleanUser}`);
      await redis.del(`destinyvox_vip_${normUser}`);
      return c.json<UiResponse>(
        { showToast: `Status VIP desativado para u/${cleanUser}.` },
        200
      );
    } else {
      await redis.set(`destinyvox_vip_${cleanUser}`, 'active');
      await redis.set(`destinyvox_vip_${normUser}`, 'active');
      return c.json<UiResponse>(
        { showToast: `✦ Status VIP ativado para u/${cleanUser}! Oráculo liberado.` },
        200
      );
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return c.json<UiResponse>({ showToast: `Erro ao alternar VIP: ${errorMsg}` }, 400);
  }
});
