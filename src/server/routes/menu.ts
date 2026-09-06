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
