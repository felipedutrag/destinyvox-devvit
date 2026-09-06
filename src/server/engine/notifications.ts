import type { CosmicReadingResult } from './types';

export async function notifyTelegramNewChart(username: string, reading: CosmicReadingResult): Promise<void> {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return;
  }

  const { profile, archetypes } = reading;
  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const msg =
    `✨ *NOVO ACESSO / MAPA GERADO NO DESTINYVOX!* ✨\n\n` +
    `👤 *Redditor:* u/${username}\n` +
    `🧭 *Caminho de Vida:* #${profile.lifePath} (${archetypes.lifePath.title.split('/')[0]})\n` +
    `🎯 *Expressão:* #${profile.expression}\n` +
    `💫 *Alma:* #${profile.soulUrge}\n` +
    `⏳ *Ano Pessoal:* #${profile.personalYear}\n\n` +
    `🕒 *Horário:* ${now}`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: msg,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    console.error('Falha ao enviar notificação para o Telegram:', err);
  }
}
