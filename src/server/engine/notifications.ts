import type { CosmicReadingResult } from './types';

const DEFAULT_BOT_TOKEN = '8772913024:AAHCsGyYaf11MkncGCHSwj-q8OJVYzQ6v8c';
const DEFAULT_CHAT_ID = '8024902234';

export async function notifyTelegramNewChart(username: string, reading: CosmicReadingResult): Promise<void> {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;

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

export async function notifyTelegramPortalClick(
  username: string,
  source: 'dossier' | 'oracle_chat',
  details?: { lifePath?: number; personalYear?: number } | null
): Promise<void> {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return;
  }

  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const sourceLabel = source === 'dossier' ? '📜 Dossiê (Banner do Oráculo)' : '💬 Chat do Oráculo (Obter Créditos)';

  let msg =
    `🔮 *INTENÇÃO DE COMPRA / ORÁCULO AI!* 🔮\n\n` +
    `👤 *Redditor:* u/${username || 'anônimo'}\n` +
    `📍 *Origem:* ${sourceLabel}\n`;

  if (details?.lifePath) {
    msg += `🧭 *Caminho de Vida:* #${details.lifePath}\n`;
  }
  if (details?.personalYear) {
    msg += `⏳ *Ano Pessoal:* #${details.personalYear}\n`;
  }

  msg += `🕒 *Horário:* ${now}`;

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
    console.error('Falha ao enviar notificação de clique para o Telegram:', err);
  }
}
