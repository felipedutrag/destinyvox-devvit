import { useState, type MouseEvent } from 'react';
import { navigateTo } from '@devvit/web/client';
import { trpc } from '../trpc';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import type { SupportedLang } from '../i18n';

export function useSharing(
  readingData: CosmicReadingResult | null,
  lang: SupportedLang,
  redditUsername: string,
  userToken: string
) {
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isPostingComment, setIsPostingComment] = useState<boolean>(false);
  const [commentSuccess, setCommentSuccess] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string>('');

  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [joinSuccess, setJoinSuccess] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string>('');

  const getShareMarkdown = () => {
    if (!readingData) return '';
    const { profile, archetypes, interpretation } = readingData;
    const isEn = lang === 'en';
    const isEs = lang === 'es';
    return (
      `### ✦ DESTINYVOX // ${isEn ? 'NUMEROLOGICAL DOSSIER' : isEs ? 'DOSSIER NUMEROLÓGICO' : 'DOSSIÊ NUMEROLÓGICO'}\n\n` +
      `**${isEn ? 'Subject' : isEs ? 'Consultante' : 'Consulente'}:** ${profile.fullName}\n\n` +
      `* **${isEn ? 'Life Path (Birth Purpose)' : isEs ? 'Camino de Vida (Propósito)' : 'Caminho de Vida (Propósito)'}:** #${profile.lifePath} — *${archetypes.lifePath.title}*\n` +
      `* **${isEn ? 'Expression / Destiny (Name)' : isEs ? 'Expresión / Destino (Nombre)' : 'Expressão / Destino (Nome)'}:** #${profile.expression} — *${archetypes.expression.title}*\n` +
      `* **${isEn ? 'Soul Urge' : isEs ? 'Deseo del Alma' : 'Desejo da Alma'}:** #${profile.soulUrge} — *${archetypes.soulUrge.title}*\n` +
      `* **${isEn ? 'Personality' : isEs ? 'Personalidad' : 'Personalidade'}:** #${profile.personality}\n` +
      (profile.birthday ? `* **${isEn ? 'Birthday (Innate Talent)' : isEs ? 'Cumpleaños (Don Innato)' : 'Aniversário (Talento Nato)'}:** #${profile.birthday}\n` : '') +
      (profile.maturity ? `* **${isEn ? 'Maturity (Ultimate Goal)' : isEs ? 'Madurez (Meta Suprema)' : 'Maturidade (Meta Suprema)'}:** #${profile.maturity}\n` : '') +
      `* **${isEn ? 'Current Cycle' : isEs ? 'Ciclo Actual' : 'Ciclo Atual'} (${new Date().getFullYear()}):** ${isEn ? 'Personal Year' : isEs ? 'Año Personal' : 'Ano Pessoal'} #${profile.personalYear} — *${archetypes.personalYear.title}*\n\n` +
      `> *"${interpretation.cosmicMotto}"*\n\n` +
      `---\n` +
      `*${isEn ? 'Calculated via DestinyVox Calculator in r/DestinyVox' : isEs ? 'Calculado vía DestinyVox en r/DestinyVox' : 'Calculado via DestinyVox Calculator em r/DestinyVox'}*`
    );
  };

  const handlePostToRedditComments = async () => {
    if (!readingData || isPostingComment) return;
    setIsPostingComment(true);
    setCommentError('');
    setCommentSuccess(false);

    try {
      const markdown = getShareMarkdown();
      const res = await trpc.destinyvox.postComment.mutate({
        commentText: markdown,
      });

      if (res.success) {
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 5000);
      } else {
        setCommentError(res.error || 'Falha ao postar comentário.');
        setTimeout(() => setCommentError(''), 4000);
      }
    } catch {
      setCommentError('Erro de conexão ao postar comentário.');
      setTimeout(() => setCommentError(''), 4000);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleCopyShare = () => {
    const text = getShareMarkdown();
    if (!text) return;
    void navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handleShareToOtherSubs = () => {
    const text = getShareMarkdown();
    if (!text) return;
    void navigator.clipboard.writeText(text);
    setCopySuccess(true);
    window.open(
      'https://www.reddit.com/submit?title=' +
        encodeURIComponent(`Meu Dossiê Numerológico DestinyVox (#${readingData?.profile.lifePath})`),
      '_blank'
    );
  };

  const handleOpenPortal = (ev?: MouseEvent<HTMLElement>, source: 'dossier' | 'oracle_chat' = 'dossier') => {
    if (ev) ev.preventDefault();
    const effectiveUser = redditUsername.trim();

    // Dispara alerta Telegram em background
    void trpc.destinyvox.notifyPortalClick.mutate({
      source,
      username: effectiveUser,
      lifePath: readingData?.profile.lifePath,
      personalYear: readingData?.profile.personalYear,
    }).catch(() => {});

    const portalUrl = new URL('https://destinyvox.online/');
    if (effectiveUser) {
      portalUrl.searchParams.set('u', effectiveUser);
    } else if (userToken) {
      portalUrl.searchParams.set('ref', userToken);
    }
    if (lang) {
      portalUrl.searchParams.set('lang', lang);
    }

    const targetUrl = portalUrl.toString();

    try {
      navigateTo(targetUrl);
    } catch {
      try {
        const win = window.open(targetUrl, '_blank');
        if (!win) {
          window.location.href = targetUrl;
        }
      } catch {
        window.location.href = targetUrl;
      }
    }
  };

  const handleJoinCommunity = async () => {
    if (isJoining || isMember) return;
    setIsJoining(true);
    setJoinError('');
    setJoinSuccess(false);

    try {
      const res = await trpc.destinyvox.subscribeMember.mutate();
      if (res.success) {
        setIsMember(true);
        setJoinSuccess(true);
        setTimeout(() => setJoinSuccess(false), 5000);
      } else {
        // Fallback gracioso: redireciona para o subreddit nativo sem exibir erro técnico
        const targetUrl = res.fallbackUrl || 'https://www.reddit.com/r/DestinyVox';
        try {
          navigateTo(targetUrl);
        } catch {
          window.open(targetUrl, '_blank');
        }
        setIsMember(true);
        setJoinSuccess(true);
        setTimeout(() => setJoinSuccess(false), 5000);
      }
    } catch {
      // Fallback em caso de exceção inesperada
      const targetUrl = 'https://www.reddit.com/r/DestinyVox';
      try {
        navigateTo(targetUrl);
      } catch {
        window.open(targetUrl, '_blank');
      }
      setIsMember(true);
      setJoinSuccess(true);
      setTimeout(() => setJoinSuccess(false), 5000);
    } finally {
      setIsJoining(false);
    }
  };

  return {
    copySuccess,
    isPostingComment,
    commentSuccess,
    commentError,
    isJoining,
    isMember,
    joinSuccess,
    joinError,
    handlePostToRedditComments,
    handleCopyShare,
    handleShareToOtherSubs,
    handleJoinCommunity,
    handleOpenPortal,
  };
}
