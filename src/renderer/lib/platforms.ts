import { PLATFORM_TENCENT, type PlatformId } from '../../shared/platforms';

export function getPlatformName(platformId: PlatformId): string {
  const platformNames: Record<string, string> = PLATFORM_TENCENT;
  return platformNames[platformId] ?? platformId;
}
