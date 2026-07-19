import type { Game } from '../../../shared/types';

const GAME_MODE_NAMES: Record<string, string> = {
  CLASSIC: '召唤师峡谷',
  ARAM: '极地大乱斗',
  KIWI: '极地大乱斗',
  TFT: '云顶之弈',
  CHERRY: '斗魂竞技场',
  SWIFTPLAY: '快速模式',
  PRACTICETOOL: '训练模式',
};

const CLASSIC_QUEUE_NAMES: Record<number, string> = {
  420: '单双排',
  440: '灵活排位',
  430: '匹配',
  450: '大乱斗',
  2400: '斗魂',
};

const KIWI_QUEUE_NAMES: Record<number, string> = {
  2400: '海克斯大乱斗',
};

const TIER_NAMES: Record<string, string> = {
  IRON: '黑铁',
  BRONZE: '青铜',
  SILVER: '白银',
  GOLD: '黄金',
  PLATINUM: '铂金',
  EMERALD: '翡翠',
  DIAMOND: '钻石',
  MASTER: '大师',
  GRANDMASTER: '宗师',
  CHALLENGER: '王者',
};

const QUEUE_NAMES: Record<string, string> = {
  RANKED_SOLO_5x5: '单双排',
  RANKED_FLEX_SR: '灵活排位',
  RANKED_TFT: '云顶之弈',
  RANKED_TFT_DOUBLE_UP: '双人云顶',
};

const ROMAN: Record<string, string> = {
  I: '一',
  II: '二',
  III: '三',
  IV: '四',
  V: '五',
  NA: '',
};

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatGameMode(game: Game): string {
  if (game.gameMode === 'CLASSIC') {
    return CLASSIC_QUEUE_NAMES[game.queueId] ?? GAME_MODE_NAMES.CLASSIC;
  }

  if (game.gameMode === 'KIWI') {
    return KIWI_QUEUE_NAMES[game.queueId] ?? GAME_MODE_NAMES.KIWI;
  }

  console.log('game', game);
  return GAME_MODE_NAMES[game.gameMode] ?? game.gameMode;
}

export function formatTierDivision(tier: string, division: string): string {
  if (!tier) return '未定级';
  const tierName = TIER_NAMES[tier] ?? tier;
  const div = ROMAN[division] ?? division;
  return div ? `${tierName}${div}` : tierName;
}

export function formatQueueType(queueType: string): string {
  return QUEUE_NAMES[queueType] ?? queueType;
}
