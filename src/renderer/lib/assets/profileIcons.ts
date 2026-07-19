import { CDRAGON_BASE, cachedUrl } from './cdragon';

const PROFILE_ICON_BASE = `${CDRAGON_BASE}/v1/profile-icons`;

export function getProfileIconUrl(iconId: number): string {
  return cachedUrl(`${PROFILE_ICON_BASE}/${iconId}.jpg`);
}
