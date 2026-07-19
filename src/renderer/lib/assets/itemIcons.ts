import { CDRAGON_BASE } from './cdragon';
import { createIconRegistry } from './iconRegistry';

const itemRegistry = createIconRegistry(
  `${CDRAGON_BASE}/v1/items.json`,
  'https://raw.communitydragon.org/latest/game/assets/items/icons2d',
);

export const preloadItemIcons = itemRegistry.preload;
export const getItemIconUrl = itemRegistry.getUrl;
export const useItemIconsLoaded = itemRegistry.useLoaded;
