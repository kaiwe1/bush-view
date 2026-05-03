import { PLATFORM_TENCENT } from '../shared/platforms';
import type { LoginTokenPayload, Game, Participant } from '../shared/types';

const CDRAGON_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default';

const PROFILE_ICON_BASE = `${CDRAGON_BASE}/v1/profile-icons`;

export function getProfileIconUrl(iconId: number): string {
  return `${PROFILE_ICON_BASE}/${iconId}.jpg`;
}

const RANK_EMBLEM_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default';

/** 获取排位徽章图片 URL（communityDragon） */
export function getRankEmblemUrl(tier: string): string {
  return `${RANK_EMBLEM_BASE}/images/${tier.toLowerCase()}.png`;
}

// ============================================================
// 游戏数据格式化
// ============================================================

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatGameMode(game: Game): string {
  const modeMap: Record<string, string> = {
    CLASSIC: '召唤师峡谷',
    ARAM: '极地大乱斗',
    KIWI: '极地大乱斗',
    TFT: '云顶之弈',
    CHERRY: '斗魂竞技场',
    SWIFTPLAY: '快速模式',
  };
  if (game.gameMode === 'CLASSIC') {
    const queueMap: Record<number, string> = {
      420: '单双排',
      440: '灵活排位',
      430: '匹配',
      450: '大乱斗',
      2400: '斗魂',
    };
    return queueMap[game.queueId] ?? '召唤师峡谷';
  }
  if (game.gameMode === 'KIWI') {
    const queueMap: Record<number, string> = {
      2400: '海克斯大乱斗'
    };
    return queueMap[game.queueId] ?? '极地大乱斗';
  }
  console.log('game', game)
  return modeMap[game.gameMode] ?? game.gameMode;
}

// ============================================================
// 对局玩家匹配
// ============================================================

export function findPlayerParticipant(game: Game, puuid: string): Participant | null {
  const identity = game.participantIdentities.find(
    (id) => id.player.puuid === puuid,
  );
  if (!identity) return null;
  return (
    game.participants.find(
      (p) => p.participantId === identity.participantId,
    ) ?? null
  );
}

// ============================================================
// KDA 计算
// ============================================================

export interface KdaStats {
  kills: number;
  deaths: number;
  assists: number;
  kda: string;
  games: number;
  wins: number;
  winRate: string;
}

export function calculateKDA(games: Game[], puuid: string): KdaStats {
  let kills = 0;
  let deaths = 0;
  let assists = 0;
  let wins = 0;
  let gameCount = 0;

  for (const game of games) {
    const p = findPlayerParticipant(game, puuid);
    if (p) {
      kills += p.stats.kills;
      deaths += p.stats.deaths;
      assists += p.stats.assists;
      if (p.stats.win) wins++;
      gameCount++;
    }
  }

  const kda =
    deaths === 0
      ? (kills + assists).toString()
      : ((kills + assists) / deaths).toFixed(2);

  const winRate = gameCount === 0 ? '0' : ((wins / gameCount) * 100).toFixed(0);

  return { kills, deaths, assists, kda, games: gameCount, wins, winRate };
}

// ============================================================
// 英雄使用统计
// ============================================================

export interface ChampionUsage {
  championId: number;
  count: number;
  winCount: number;
  totalGames: number;
}

/** 计算英雄使用情况和胜率 */
export function getChampionUsage(games: Game[], puuid: string): ChampionUsage[] {
  const map = new Map<number, { count: number; winCount: number }>();

  for (const game of games) {
    const p = findPlayerParticipant(game, puuid);
    if (!p) continue;
    const entry = map.get(p.championId) || { count: 0, winCount: 0 };
    entry.count++;
    if (p.stats.win) entry.winCount++;
    map.set(p.championId, entry);
  }

  return Array.from(map.entries())
    .map(([championId, data]) => ({
      championId,
      count: data.count,
      winCount: data.winCount,
      totalGames: data.count,
    }))
    .sort((a, b) => b.count - a.count);
}

export function getPlatformName(platformId: string): string {
  return PLATFORM_TENCENT[platformId] ?? platformId;
}

export function parseRiotId(input: string): { gameName: string; tagLine: string } | null {
  const trimmed = input.trim();
  const idx = trimmed.lastIndexOf('#');
  if (idx <= 0 || idx >= trimmed.length - 1) return null;
  return {
    gameName: trimmed.slice(0, idx),
    tagLine: trimmed.slice(idx + 1),
  };
}

function parseJwtPayload(idToken: string): LoginTokenPayload | null {
  try {
    const base64Url = idToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as LoginTokenPayload;
  } catch {
    return null;
  }
}

// ============================================================
// 排位数据格式化
// ============================================================

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
  RANKED_TFT_DOUBLE_UP: '云顶双人',
  RANKED_TFT_TURBO: '云顶狂暴',
};

const ROMAN: Record<string, string> = {
  I: '一',
  II: '二',
  III: '三',
  IV: '四',
  V: '五',
  NA: '',
};

export function formatTierDivision(tier: string, division: string): string {
  if (!tier) return '未定级';
  const tierName = TIER_NAMES[tier] ?? tier;
  const div = ROMAN[division] ?? division;
  return div ? `${tierName}${div}` : tierName;
}

export function formatQueueType(queueType: string): string {
  return QUEUE_NAMES[queueType] ?? queueType;
}

export function getPlatformIdFromToken(idToken: string): string | null {
  const payload = parseJwtPayload(idToken);
  return payload?.lol[0]?.cpid ?? null;
}

// ============================================================
// 英雄头像
// ============================================================

export function getChampionIconUrl(championId: number): string {
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`;
}

// ============================================================
// 对局玩家列表
// ============================================================

export interface GamePlayer {
  gameName: string;
  tagLine: string;
  championId: number;
  teamId: number;
}

export function getGamePlayers(game: Game): GamePlayer[] {
  return game.participantIdentities.map((identity) => {
    const participant = game.participants.find(
      (p) => p.participantId === identity.participantId,
    );
    return {
      gameName: identity.player.gameName,
      tagLine: identity.player.tagLine,
      championId: participant?.championId ?? 0,
      teamId: participant?.teamId ?? 0,
    };
  });
}
