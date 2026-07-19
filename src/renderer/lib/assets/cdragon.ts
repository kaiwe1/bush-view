export const CDRAGON_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default';

export function cachedUrl(httpsUrl: string): string {
  return httpsUrl.replace('https://', 'cached-cdragon://');
}
