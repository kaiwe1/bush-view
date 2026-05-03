import { PLATFORM_TENCENT } from '../shared/platforms';
import type { LoginTokenPayload, Game, Participant } from '../shared/types';

const CDRAGON_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default';

/** 将 CDragon 直链转为本地缓存协议的 URL */
function cachedUrl(httpsUrl: string): string {
  return httpsUrl.replace('https://', 'cached-cdragon://');
}

const PROFILE_ICON_BASE = `${CDRAGON_BASE}/v1/profile-icons`;

export function getProfileIconUrl(iconId: number): string {
  return cachedUrl(`${PROFILE_ICON_BASE}/${iconId}.jpg`);
}

const RANK_EMBLEM_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default';

/** 获取排位徽章图片 URL（communityDragon） */
export function getRankEmblemUrl(tier: string): string {
  return cachedUrl(`${RANK_EMBLEM_BASE}/images/${tier.toLowerCase()}.png`);
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

// ============================================================
// 六边形雷达图统计（近期对局平均值）
// ============================================================

export interface RadarStats {
  kda: number;
  dpm: number;        // 对英雄伤害/分钟
  gpm: number;        // 获得金币/分钟
  vspm: number;       // 视野得分/分钟
  kp: number;         // 参团率 %
  dtpm: number;       // 承受伤害/分钟
}

/** 雷达图各维度的归一化上限 */
export const RADAR_CAPS: Record<keyof RadarStats, number> = {
  kda: 6,
  dpm: 1000,
  gpm: 500,
  vspm: 2.5,
  kp: 100,
  dtpm: 1500,
};

export function calculateRadarStats(games: Game[], puuid: string): RadarStats | null {
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalDamage = 0;
  let totalGold = 0;
  let totalVision = 0;
  let totalTeamKills = 0;
  let totalDamageTaken = 0;
  let totalDuration = 0;
  let gameCount = 0;

  for (const game of games) {
    const p = findPlayerParticipant(game, puuid);
    if (!p) continue;

    const durationMin = game.gameDuration / 60;

    totalKills += p.stats.kills;
    totalDeaths += p.stats.deaths;
    totalAssists += p.stats.assists;
    totalDamage += p.stats.totalDamageDealtToChampions;
    totalGold += p.stats.goldEarned;
    totalVision += p.stats.visionScore;
    totalDamageTaken += p.stats.totalDamageTaken;
    totalDuration += durationMin;

    // 队伍总击杀（用于参团率）
    const teamKills = game.participants
      .filter((pp) => pp.teamId === p.teamId)
      .reduce((sum, pp) => sum + pp.stats.kills, 0);
    totalTeamKills += teamKills;

    gameCount++;
  }

  if (gameCount === 0) return null;

  const kda = totalDeaths === 0
    ? totalKills + totalAssists
    : (totalKills + totalAssists) / totalDeaths;

  return {
    kda,
    dpm: totalDamage / totalDuration,
    gpm: totalGold / totalDuration,
    vspm: totalVision / totalDuration,
    kp: totalTeamKills === 0 ? 0 : ((totalKills + totalAssists) / totalTeamKills) * 100,
    dtpm: totalDamageTaken / totalDuration,
  };
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
  return cachedUrl(`${CDRAGON_BASE}/v1/champion-icons/${championId}.png`);
}

// ============================================================
// 召唤师技能图标
// ============================================================

const SPELL_ICONS_BASE = `${CDRAGON_BASE}/data/spells/icons2d`;

let spellIconMap: Map<number, string> | null = null;
let spellIconLoadPromise: Promise<void> | null = null;

export async function preloadSummonerSpellIcons(): Promise<void> {
  if (spellIconMap) return;
  if (spellIconLoadPromise) {
    await spellIconLoadPromise;
    return;
  }

  spellIconLoadPromise = (async () => {
    try {
      const res = await fetch(`${CDRAGON_BASE}/v1/summoner-spells.json`);
      const spells: Array<{ id: number; iconPath: string }> = await res.json();
      const map = new Map<number, string>();
      for (const spell of spells) {
        if (spell.id && spell.iconPath) {
          const filename = spell.iconPath.split('/').pop()?.toLowerCase();
          if (filename) {
            map.set(spell.id, cachedUrl(`${SPELL_ICONS_BASE}/${filename}`));
          }
        }
      }
      spellIconMap = map;
    } catch {
      spellIconMap = new Map();
    }
  })();

  await spellIconLoadPromise;
}

export function getSummonerSpellIconUrl(spellId: number): string | null {
  if (spellId === 0) return null;
  if (!spellIconMap) {
    preloadSummonerSpellIcons();
    // fallback: try the v1 API while the map loads
    return cachedUrl(`${CDRAGON_BASE}/v1/spell-icons/${spellId}.png`);
  }
  return spellIconMap.get(spellId) ?? null;
}

// ============================================================
// 装备图标
// ============================================================

const ITEM_ICONS_BASE = 'https://raw.communitydragon.org/latest/game/assets/items/icons2d';

let itemIconMap: Map<number, string> | null = null;
let itemIconLoadPromise: Promise<void> | null = null;

export async function preloadItemIcons(): Promise<void> {
  if (itemIconMap) return;
  if (itemIconLoadPromise) {
    await itemIconLoadPromise;
    return;
  }

  itemIconLoadPromise = (async () => {
    try {
      const res = await fetch(`${CDRAGON_BASE}/v1/items.json`);
      const items: Array<{ id: number; iconPath: string }> = await res.json();
      const map = new Map<number, string>();
      for (const item of items) {
        if (item.id && item.iconPath) {
          const filename = item.iconPath.split('/').pop()?.toLowerCase();
          if (filename) {
            map.set(item.id, cachedUrl(`${ITEM_ICONS_BASE}/${filename}`));
          }
        }
      }
      itemIconMap = map;
    } catch {
      itemIconMap = new Map(); // empty map signals load was attempted
    }
  })();

  await itemIconLoadPromise;
}

export function getItemIconUrl(itemId: number): string | null {
  if (itemId === 0) return null;
  // start loading on first call, but return fallback URL synchronously
  if (!itemIconMap) {
    preloadItemIcons();
    return cachedUrl(`${CDRAGON_BASE}/v1/items/${itemId}.png`);
  }
  return itemIconMap.get(itemId) ?? null;
}

// ============================================================
// 符文图标（ID数据来源: https://darkintaqt.com/blog/perk-ids）
// ============================================================

// 符文 ID → URL 路径段（dirname/filename，全小写）
const PERK_PATHS: [number, string][] = [
  // Precision (8000)
  [8000, 'precision/precision'],
  [8005, 'presstheattack/presstheattack'],
  [8008, 'lethaltempo/lethaltempotemp'],
  [8021, 'fleetfootwork/fleetfootwork'],
  [8010, 'conqueror/conqueror'],
  [9101, 'absorblife/absorblife'],
  [9111, 'triumph/triumph'],
  [8009, 'presenceofmind/presenceofmind'],
  [9104, 'legendalacrity/legendalacrity'],
  [9105, 'legendhaste/legendhaste'],
  [9103, 'legendbloodline/legendbloodline'],
  [8014, 'coupdegrace/coupdegrace'],
  [8017, 'cutdown/cutdown'],
  [8299, 'laststand/laststand'],
  // Domination (8100)
  [8100, 'domination/domination'],
  [8112, 'electrocute/electrocute'],
  [8128, 'darkharvest/darkharvest'],
  [9923, 'hailofblades/hailofblades'],
  [8126, 'cheapshot/cheapshot'],
  [8139, 'tasteofblood/tasteofblood'],
  [8143, 'suddenimpact/suddenimpact'],
  [8137, 'sixthsense/sixthsense'],
  [8140, 'grislymementos/grislymementos'],
  [8141, 'deepward/deepward'],
  [8135, 'treasurehunter/treasurehunter'],
  [8105, 'relentlesshunter/relentlesshunter'],
  [8106, 'ultimatehunter/ultimatehunter'],
  // Sorcery (8200)
  [8200, 'sorcery/sorcery'],
  [8214, 'summonaery/summonaery'],
  [8229, 'arcanecomet/arcanecomet'],
  [8230, 'phaserush/phaserush'],
  [8224, 'nullifyingorb/nullifyingorb'],
  [8226, 'manaflowband/manaflowband'],
  [8275, 'nimbuscloak/nimbuscloak'],
  [8210, 'transcendence/transcendence'],
  [8234, 'celerity/celerity'],
  [8233, 'absolutefocus/absolutefocus'],
  [8237, 'scorch/scorch'],
  [8232, 'waterwalking/waterwalking'],
  [8236, 'gatheringstorm/gatheringstorm'],
  [8992, 'deathfiretouch/deathfire_touch_keystone'],
  // Inspiration (8300)
  [8300, 'inspiration/inspiration'],
  [8351, 'glacialaugment/glacialaugment'],
  [8360, 'unsealedspellbook/unsealedspellbook'],
  [8369, 'firststrike/firststrike'],
  [8306, 'hextechflashtraption/hextechflashtraption'],
  [8304, 'magicalfootwear/magicalfootwear'],
  [8321, 'cashback/cashback'],
  [8313, 'perfecttiming/perfecttiming'],
  [8352, 'timewarptonic/timewarptonic'],
  [8345, 'biscuitdelivery/biscuitdelivery'],
  [8347, 'cosmicinsight/cosmicinsight'],
  [8410, 'approachvelocity/approachvelocity'],
  [8316, 'jackofalltrades/jackofalltrades'],
  // Resolve (8400)
  [8400, 'resolve/resolve'],
  [8437, 'graspoftheundying/graspoftheundying'],
  [8439, 'aftershock/aftershock'],
  [8465, 'guardian/guardian'],
  [8446, 'demolish/demolish'],
  [8463, 'fontoflife/fontoflife'],
  [8401, 'shieldbash/shieldbash'],
  [8429, 'conditioning/conditioning'],
  [8444, 'secondwind/secondwind'],
  [8473, 'boneplating/boneplating'],
  [8451, 'overgrowth/overgrowth'],
  [8453, 'revitalize/revitalize'],
  [8242, 'unflinching/unflinching'],
];

const PERK_PATH_MAP = new Map(PERK_PATHS);

// Style ID → 小写英文名（用于 URL）
const STYLE_ID_TO_NAME: Record<number, string> = {
  8000: 'precision',
  8100: 'domination',
  8200: 'sorcery',
  8300: 'inspiration',
  8400: 'resolve',
};

// 系别图标文件（game/assets/perks/styles/ 下的独立图片资源）
const STYLE_ICON_FILE: Record<number, string> = {
  8000: '7201_precision',
  8100: '7200_domination',
  8200: '7202_sorcery',
  8300: '7203_whimsy',
  8400: '7204_resolve',
};

export function getPerkStyleIconUrl(styleId: number): string | null {
  const filename = STYLE_ICON_FILE[styleId];
  if (!filename) return null;
  return cachedUrl(`https://raw.communitydragon.org/latest/game/assets/perks/styles/${filename}.png`);
}

export function getPerkIconUrl(perkId: number, primaryStyleId: number): string | null {
  const styleName = STYLE_ID_TO_NAME[primaryStyleId];
  const path = PERK_PATH_MAP.get(perkId);
  if (!styleName || !path) return null;
  return cachedUrl(`https://raw.communitydragon.org/latest/game/assets/perks/styles/${styleName}/${path}.png`);
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
