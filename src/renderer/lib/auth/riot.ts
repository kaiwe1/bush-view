import type { PlatformId } from '../../../shared/platforms';
import type { LoginTokenPayload } from '../../../shared/types';

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
        .join(''),
    );

    return JSON.parse(json) as LoginTokenPayload;
  } catch {
    return null;
  }
}

export function getPlatformIdFromToken(idToken: string): PlatformId | null {
  const payload = parseJwtPayload(idToken);
  return payload?.lol[0]?.cpid ?? null;
}
