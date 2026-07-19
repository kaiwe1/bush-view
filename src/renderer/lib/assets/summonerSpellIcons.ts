import { CDRAGON_BASE } from './cdragon';
import { createIconRegistry } from './iconRegistry';

const spellRegistry = createIconRegistry(
  `${CDRAGON_BASE}/v1/summoner-spells.json`,
  `${CDRAGON_BASE}/data/spells/icons2d`,
);

export const preloadSummonerSpellIcons = spellRegistry.preload;
export const getSummonerSpellIconUrl = spellRegistry.getUrl;
export const useSpellIconsLoaded = spellRegistry.useLoaded;
