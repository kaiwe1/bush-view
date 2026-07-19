import { cachedUrl } from './cdragon';

const RANK_EMBLEM_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default';

export function getRankEmblemUrl(tier: string): string {
  return cachedUrl(`${RANK_EMBLEM_BASE}/images/${tier.toLowerCase()}.png`);
}
