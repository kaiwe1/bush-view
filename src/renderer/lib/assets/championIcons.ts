import { CDRAGON_BASE, cachedUrl } from './cdragon';

export function getChampionIconUrl(championId: number): string {
  return cachedUrl(`${CDRAGON_BASE}/v1/champion-icons/${championId}.png`);
}
