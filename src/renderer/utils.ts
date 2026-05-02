import { PLATFORM_TENCENT } from '../shared/platforms';
import type { LoginTokenPayload } from '../shared/types';

const PROFILE_ICON_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons';

export function getProfileIconUrl(iconId: number): string {
  return `${PROFILE_ICON_BASE}/${iconId}.jpg`;
}

export function getPlatformName(platformId: string): string {
  return PLATFORM_TENCENT[platformId] ?? platformId;
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

export function getPlatformIdFromToken(idToken: string): string | null {
  const payload = parseJwtPayload(idToken);
  return payload?.lol[0]?.cpid ?? null;
}
