import axios from 'axios';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type {
  OpggChampionStats,
  OpggChampionPositionKey,
  OpggChampionPositionStats,
  OpggChampionTierRow,
  OpggWeakAgainstChampion,
} from '../../shared/types';

const OPGG_CHAMPIONS_BASE_URL = 'https://op.gg/zh-cn/lol/champions';
const CACHE_TTL_MS = 15 * 60 * 1000;

let cache: { expiresAt: number; data: OpggChampionStats } | null = null;

type PlainObject = Record<string, unknown>;

interface PositionConfig {
  key: OpggChampionPositionKey;
  name: string;
}

interface ParsedChampionPage {
  patch?: string;
  lastUpdated?: string;
  totalSamples?: number;
  champions: OpggChampionTierRow[];
}

const POSITIONS: PositionConfig[] = [
  { key: 'top', name: '上路' },
  { key: 'jungle', name: '打野' },
  { key: 'mid', name: '中路' },
  { key: 'adc', name: '下路' },
  { key: 'support', name: '辅助' },
];

export async function getOpggChampionStats(forceRefresh = false): Promise<OpggChampionStats> {
  if (!forceRefresh && cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  const positions = await Promise.all(POSITIONS.map(fetchOpggPositionStats));
  const firstPosition = positions.find((position) => position.champions.length > 0);

  const data: OpggChampionStats = {
    sourceUrl: OPGG_CHAMPIONS_BASE_URL,
    region: '全球',
    tier: '翡翠+',
    queueType: '单双排',
    patch: firstPosition?.patch,
    lastUpdated: firstPosition?.lastUpdated,
    totalSamples: firstPosition?.totalSamples,
    champions: positions.flatMap((position) => position.champions),
    positions,
    fetchedAt: new Date().toISOString(),
  };

  if (!data.positions.some((position) => position.champions.length > 0)) {
    throw new Error('Unable to parse OP.GG champion stats');
  }

  cache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  };

  return data;
}

/**
 * 请求并解析op.gg榜单数据
 */
async function fetchOpggPositionStats(
  position: PositionConfig,
): Promise<OpggChampionPositionStats> {
  const sourceUrl = getPositionUrl(position.key);
  const response = await axios.get<string>(sourceUrl, {
    timeout: 15000,
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
      },
    });

  const parsed = parseOpggChampionPage(response.data);

  return {
    key: position.key,
    name: position.name,
    sourceUrl,
    patch: parsed.patch,
    lastUpdated: parsed.lastUpdated,
    totalSamples: parsed.totalSamples,
    champions: localizeChampionRows(parsed.champions, position.name),
  };
}

/**
 * 使用 cheerio 解析 op.gg 英雄榜单页面，提取出榜单数据
 */
function parseOpggChampionPage(html: string): ParsedChampionPage {
  const $ = cheerio.load(html);
  const pageText = normalizeText($('body').text());
  const structuredRows = parseStructuredRows($);
  const tableRows = structuredRows.length > 0 ? [] : parseTableRows($);

  return {
    patch: findFirstMatch(pageText, [/Patch\s+([\d.]+)/i, /Ver:\s*([\d.]+)/i]),
    lastUpdated: localizeRelativeTime(
      findFirstMatch(pageText, [/最近更新\s*:?\s*(\d+\s*(?:秒|分钟|小时|天|周|个月|年)前|刚刚)/i, /Last updated:\s*([^:]+?ago|now)/i]),
    ),
    totalSamples: parseInteger(
      findFirstMatch(pageText, [/总样本数\s*:?\s*([\d,]+)/i, /Total analyzed samples\s*:?\s*([\d,]+)/i]),
    ),
    champions: dedupeRows(structuredRows.length > 0 ? structuredRows : tableRows),
  };
}

function localizeChampionRows(
  rows: OpggChampionTierRow[],
  fallbackPositionName: string,
): OpggChampionTierRow[] {
  return rows.map((champion) => ({
    ...champion,
    position: localizePosition(champion.position) ?? fallbackPositionName,
  }));
}

function getPositionUrl(position: OpggChampionPositionKey): string {
  return `${OPGG_CHAMPIONS_BASE_URL}?tier=emerald_plus&position=${position}`;
}

function parseStructuredRows($: cheerio.CheerioAPI): OpggChampionTierRow[] {
  const rows: OpggChampionTierRow[] = [];

  // 遍历页面中所有的 script 标签, 因为 op.gg 这类页面通常会把服务端渲染用的数据塞进 script 标签中.
  $('script').each((_index, element) => {
    const raw = $(element).html();
    if (!raw || !raw.includes('champion')) return;

    const json = parseJsonScript(raw);
    if (!json) return;

    // 递归遍历 JSON 对象, 收集所有符合条件的榜单数据
    collectChampionRows(json, rows);
  });

  return rows;
}

function parseJsonScript(raw: string): unknown | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function collectChampionRows(value: unknown, rows: OpggChampionTierRow[]): void {
  if (Array.isArray(value)) {
    const parsedRows = value
      .map((item, index) => mapObjectToRow(item, index + 1))
      .filter((row): row is OpggChampionTierRow => row !== null);

    if (parsedRows.length >= 5) {
      rows.push(...parsedRows);
      return;
    }

    value.forEach((item) => collectChampionRows(item, rows));
    return;
  }

  if (!isPlainObject(value)) return;

  Object.values(value).forEach((child) => collectChampionRows(child, rows));
}

function mapObjectToRow(value: unknown, fallbackRank: number): OpggChampionTierRow | null {
  if (!isPlainObject(value)) return null;

  const championName = getChampionName(value);
  if (!championName) return null;

  const winRate = readRate(value, [
    'winRate',
    'win_rate',
    'winningRate',
    'winning_rate',
    'winRatio',
    'win_ratio',
  ]);
  const pickRate = readRate(value, ['pickRate', 'pick_rate', 'pickRatio', 'pick_ratio']);
  const banRate = readRate(value, ['banRate', 'ban_rate', 'banRatio', 'ban_ratio']);
  const tier = readValue(value, ['tier', 'opTier', 'op_tier', 'tierRank', 'tier_rank']);
  const rank = readNumber(value, ['rank', 'ranking', 'order', 'sortOrder', 'sort_order']);

  if (winRate === undefined && pickRate === undefined && tier === undefined && rank === undefined) {
    return null;
  }

  return {
    rank: rank ?? fallbackRank,
    championName,
    championKey: getChampionKey(value),
    imageUrl: readString(value, ['imageUrl', 'image_url', 'iconUrl', 'icon_url', 'image']),
    position: normalizePosition(readString(value, ['position', 'role', 'lane'])),
    tier: normalizeTier(tier),
    winRate,
    pickRate,
    banRate,
    games: readNumber(value, [
      'games',
      'gameCount',
      'game_count',
      'play',
      'playCount',
      'play_count',
      'sampleSize',
      'sample_size',
    ]),
    weakAgainst: readWeakAgainst(value),
  };
}

function parseTableRows($: cheerio.CheerioAPI): OpggChampionTierRow[] {
  const rows: OpggChampionTierRow[] = [];

  $('tbody tr').each((_index, element) => {
    const row = $(element);
    const rowText = normalizeText(row.text());
    if (!rowText || !rowText.includes('%')) return;

    const championLink = row.find('a[href*="/champions/"]').first();
    const championName =
      cleanImageAlt(championLink.find('img').first().attr('alt')) ||
      cleanText(championLink.text()) ||
      getChampionNameFromHref(championLink.attr('href'));
    if (!championName) return;

    const percentages = Array.from(rowText.matchAll(/(\d+(?:\.\d+)?)%/g)).map((match) =>
      Number(match[1]),
    );
    const rank = getRankFromRow(row) ?? rows.length + 1;
    const weakAgainst = getCounterChampionsFromRow($, row, championName);

    rows.push({
      rank,
      championName,
      championKey: getChampionNameFromHref(championLink.attr('href')),
      imageUrl: championLink.find('img').first().attr('src'),
      position: getPositionFromHref(championLink.attr('href')) ?? getPositionFromRow($, rowText, row),
      tier: getTierFromRow(row) ?? getTierFromText(rowText),
      winRate: percentages[0],
      pickRate: percentages[1],
      banRate: percentages[2],
      weakAgainst,
    });
  });

  return rows;
}

function getCounterChampionsFromRow(
  $: cheerio.CheerioAPI,
  row: cheerio.Cheerio<AnyNode>,
  championName: string,
): OpggWeakAgainstChampion[] {
  const counters: OpggWeakAgainstChampion[] = [];
  const championKey = championName.toLowerCase();

  row.find('a[href*="/champions/"]').slice(1).each((_index, element) => {
    const link = $(element);
    const name =
      cleanImageAlt(link.find('img').first().attr('alt')) ||
      cleanText(link.text()) ||
      getChampionNameFromHref(link.attr('href'));

    if (!name || name.toLowerCase() === championKey) return;

    const imageUrl = link.find('img').first().attr('src');

    counters.push({
      championName: name,
      championKey:
        getTargetChampionFromHref(link.attr('href')) ??
        getChampionKeyFromImageUrl(imageUrl) ??
        getChampionNameFromHref(link.attr('href')),
      imageUrl,
    });
  });

  return counters.slice(0, 3);
}

function readWeakAgainst(source: PlainObject): OpggWeakAgainstChampion[] {
  const value = readValue(source, [
    'weakAgainst',
    'weak_against',
    'counters',
    'counter',
    'counterChampions',
    'counter_champions',
    'counteredBy',
    'countered_by',
  ]);

  if (!Array.isArray(value)) return [];

  return value
    .map((item): OpggWeakAgainstChampion | null => {
      if (!isPlainObject(item)) return null;
      const championName = getChampionName(item);
      if (!championName) return null;

      return {
        championName,
        championKey: getChampionKey(item),
        imageUrl: readString(item, ['imageUrl', 'image_url', 'iconUrl', 'icon_url', 'image']),
        winRateAgainst: readRate(item, ['winRate', 'win_rate', 'winningRate', 'winning_rate']),
      };
    })
    .filter((item): item is OpggWeakAgainstChampion => item !== null)
    .slice(0, 3);
}

function getChampionName(source: PlainObject): string | undefined {
  const direct = readString(source, [
    'championName',
    'champion_name',
    'displayName',
    'display_name',
    'name',
  ]);
  if (direct) return direct;

  for (const key of ['champion', 'championInfo', 'champion_info']) {
    const nested = source[key];
    if (isPlainObject(nested)) {
      const name = getChampionName(nested);
      if (name) return name;
    }
  }

  return undefined;
}

function getChampionKey(source: PlainObject): string | undefined {
  const direct = readString(source, [
    'championKey',
    'champion_key',
    'championId',
    'champion_id',
    'key',
    'id',
    'slug',
  ]);
  if (direct) return direct;

  for (const key of ['champion', 'championInfo', 'champion_info']) {
    const nested = source[key];
    if (isPlainObject(nested)) {
      const championKey = getChampionKey(nested);
      if (championKey) return championKey;
    }
  }

  return undefined;
}

function readValue(source: PlainObject, keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }

  for (const child of Object.values(source)) {
    if (!isPlainObject(child)) continue;
    const value = readValue(child, keys);
    if (value !== undefined && value !== null) return value;
  }

  return undefined;
}

function readString(source: PlainObject, keys: string[]): string | undefined {
  const value = readValue(source, keys);
  if (typeof value === 'string' && value.trim()) return cleanText(value);
  if (typeof value === 'number') return String(value);
  return undefined;
}

function readNumber(source: PlainObject, keys: string[]): number | undefined {
  return parseNumber(readValue(source, keys));
}

function readRate(source: PlainObject, keys: string[]): number | undefined {
  const value = parseNumber(readValue(source, keys));
  if (value === undefined) return undefined;
  return value > 0 && value <= 1 ? value * 100 : value;
}

function normalizeTier(value: unknown): number | string | undefined {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return undefined;
  const text = cleanText(value);
  const numeric = text.match(/\d+/)?.[0];
  return numeric ? Number(numeric) : text;
}

function normalizePosition(value?: string): string | undefined {
  if (!value) return undefined;
  const text = value.toLowerCase();
  if (text.includes('top')) return 'Top';
  if (text.includes('jungle') || text.includes('jgl')) return 'Jungle';
  if (text.includes('middle') || text.includes('mid')) return 'Mid';
  if (text.includes('bottom') || text.includes('bot') || text.includes('adc')) return 'Bot';
  if (text.includes('support') || text.includes('sup')) return 'Support';
  if (text.includes('all')) return 'All';
  return undefined;
}

function localizePosition(value?: string): string | undefined {
  switch (value) {
    case 'Top':
      return '上路';
    case 'Jungle':
      return '打野';
    case 'Mid':
      return '中路';
    case 'Bot':
      return '下路';
    case 'Support':
      return '辅助';
    case 'All':
      return '全部';
    default:
      return value;
  }
}

function getPositionFromRow(
  $: cheerio.CheerioAPI,
  rowText: string,
  row: cheerio.Cheerio<AnyNode>,
): string | undefined {
  const imageAlt = row
    .find('img')
    .toArray()
    .map((element) => cleanImageAlt($(element).attr('alt')))
    .find((alt) => alt && normalizePosition(alt));
  return normalizePosition(imageAlt || rowText);
}

function getTierFromText(text: string): number | string | undefined {
  const match = text.match(/(?:Tier|TIER)\s*(\d+)/);
  if (match) return Number(match[1]);
  return undefined;
}

function getTierFromRow(row: cheerio.Cheerio<AnyNode>): number | string | undefined {
  const tierSvg = row.find('td').eq(2).find('svg').first();
  const className = tierSvg.attr('class') ?? '';
  const fill = (tierSvg.find('path').first().attr('fill') ?? '').toUpperCase();

  if (className.includes('text-red-500')) return 'OP';

  switch (fill) {
    case '#0093FF':
      return 1;
    case '#00BBA3':
      return 2;
    case '#FFB900':
      return 3;
    case '#9AA4AF':
      return 4;
    case '#A88A67':
      return 5;
    default:
      return undefined;
  }
}

function getRankFromRow(row: cheerio.Cheerio<AnyNode>): number | undefined {
  const firstCell = row.find('td').first();
  const visibleRank = parseInteger(firstCell.find('span').first().text());
  return visibleRank ?? parseInteger(firstCell.text());
}

function dedupeRows(rows: OpggChampionTierRow[]): OpggChampionTierRow[] {
  const byChampion = new Map<string, OpggChampionTierRow>();

  rows.forEach((row) => {
    const key = `${row.championName.toLowerCase()}-${row.position ?? 'all'}`;
    const current = byChampion.get(key);
    if (!current || row.rank < current.rank) {
      byChampion.set(key, row);
    }
  });

  return Array.from(byChampion.values())
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 120)
    .map((row, index) => ({
      ...row,
      rank: Number.isFinite(row.rank) ? row.rank : index + 1,
    }));
}

function getChampionNameFromHref(href?: string): string | undefined {
  if (!href) return undefined;
  const match = href.match(/\/champions\/([^/?#]+)/);
  if (!match) return undefined;
  return decodeURIComponent(match[1]).replace(/-/g, ' ');
}

function getTargetChampionFromHref(href?: string): string | undefined {
  if (!href) return undefined;
  const match = href.match(/[?&]target_champion=([^&#]+)/);
  if (!match) return undefined;
  return decodeURIComponent(match[1]).replace(/-/g, ' ');
}

function getPositionFromHref(href?: string): string | undefined {
  if (!href) return undefined;
  const match = href.match(/\/(?:build|counters)\/([^/?#]+)/);
  return normalizePosition(match?.[1]);
}

function getChampionKeyFromImageUrl(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined;
  const match = imageUrl.match(/\/champion\/([^/?#]+)\.png/i);
  if (!match) return undefined;
  return decodeURIComponent(match[1]).toLowerCase();
}

function findFirstMatch(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return cleanText(match[1]);
  }
  return undefined;
}

function parseInteger(value: unknown): number | undefined {
  const number = parseNumber(value);
  if (number === undefined) return undefined;
  return Math.trunc(number);
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;

  const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;

  const number = Number(match[0]);
  return Number.isFinite(number) ? number : undefined;
}

function cleanImageAlt(value?: string): string | undefined {
  if (!value) return undefined;
  return cleanText(value.replace(/(champion|portrait|icon|image)$/i, ''));
}

function cleanText(value: string): string {
  return normalizeText(value).replace(/^#+\s*/, '');
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function localizeRelativeTime(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized === 'now') return '刚刚';
  if (value === '刚刚') return value;

  const chineseMatch = value.match(/(\d+)\s*(秒|分钟|小时|天|周|个月|年)前/);
  if (chineseMatch) return `${chineseMatch[1]} ${chineseMatch[2]}前`;

  const match = normalized.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s+ago/);
  if (!match) return value;

  const amount = Number(match[1]);
  const unitMap: Record<string, string> = {
    second: '秒',
    minute: '分钟',
    hour: '小时',
    day: '天',
    week: '周',
    month: '个月',
    year: '年',
  };

  return `${amount} ${unitMap[match[2]] ?? match[2]}前`;
}

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
