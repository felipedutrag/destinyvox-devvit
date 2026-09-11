import { reddit } from '@devvit/web/server';

export const createPost = async () => {
  return await reddit.submitCustomPost({
    title: '✦ Unveil Your Cosmic Blueprint: Calculate Your Pythagorean Numerology Chart',
  });
};
