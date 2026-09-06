import { z } from 'zod';
import { context, reddit, redis } from '@devvit/web/server';
import { publicProcedure } from '../init';
import { encryptUsername } from '../../core/crypto';

export const socialProcedures = {
  generateUserToken: publicProcedure
    .input(z.object({ username: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const cleanUser = input.username.replace(/^u\//i, '').trim();
      const token = encryptUsername(cleanUser);
      return { success: true, token, username: cleanUser };
    }),

  setVipStatus: publicProcedure
    .input(z.object({ username: z.string(), secretKey: z.string() }))
    .mutation(async ({ input }) => {
      if (input.secretKey !== 'destinyvox_secret_vip_2026') {
        return { success: false, error: 'Chave não autorizada' };
      }
      const cleanUser = input.username.replace(/^u\//i, '').trim();
      await redis.set(`destinyvox_vip_${cleanUser}`, 'active');
      return { success: true, message: `Status VIP ativado para u/${cleanUser}!` };
    }),

  postComment: publicProcedure
    .input(
      z.object({
        commentText: z.string().min(5),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const postId = context.postId;
        if (!postId) {
          return { success: false, error: 'Post ID não encontrado.' };
        }
        const comment = await reddit.submitComment({
          id: postId,
          text: input.commentText,
        });
        return { success: true, commentId: comment.id };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('Erro ao postar comentário no Reddit:', errorMsg);
        return { success: false, error: errorMsg };
      }
    }),

  subscribeMember: publicProcedure.mutation(async () => {
    try {
      await reddit.subscribeToCurrentSubreddit();
      const username = await reddit.getCurrentUsername();
      if (username) {
        await redis.set(`destinyvox_member_${username}`, 'true');
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }),

  getSubscriptionStatus: publicProcedure.query(async () => {
    try {
      const username = await reddit.getCurrentUsername();
      if (!username) return { isMember: false };
      const cached = await redis.get(`destinyvox_member_${username}`);
      return { isMember: cached === 'true' };
    } catch {
      return { isMember: false };
    }
  }),
};
