import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { devvit } from '@devvit/start/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

  return {
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
    },
    plugins: [react(), tailwind(), devvit()],
  };
});
