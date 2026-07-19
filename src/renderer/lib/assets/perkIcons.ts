import { cachedUrl } from './cdragon';

const PERK_PATHS: [number, string][] = [
  [8000, 'precision/precision'],
  [8005, 'presstheattack/presstheattack'],
  [8008, 'lethaltempo/lethaltempotemp'],
  [8021, 'fleetfootwork/fleetfootwork'],
  [8010, 'conqueror/conqueror'],
  [9101, 'absorblife/absorblife'],
  [9111, 'triumph/triumph'],
  [8009, 'presenceofmind/presenceofmind'],
  [9104, 'legendalacrity/legendalacrity'],
  [9105, 'legendhaste/legendhaste'],
  [9103, 'legendbloodline/legendbloodline'],
  [8014, 'coupdegrace/coupdegrace'],
  [8017, 'cutdown/cutdown'],
  [8299, 'laststand/laststand'],
  [8100, 'domination/domination'],
  [8112, 'electrocute/electrocute'],
  [8128, 'darkharvest/darkharvest'],
  [9923, 'hailofblades/hailofblades'],
  [8126, 'cheapshot/cheapshot'],
  [8139, 'tasteofblood/tasteofblood'],
  [8143, 'suddenimpact/suddenimpact'],
  [8137, 'sixthsense/sixthsense'],
  [8140, 'grislymementos/grislymementos'],
  [8141, 'deepward/deepward'],
  [8135, 'treasurehunter/treasurehunter'],
  [8105, 'relentlesshunter/relentlesshunter'],
  [8106, 'ultimatehunter/ultimatehunter'],
  [8200, 'sorcery/sorcery'],
  [8214, 'summonaery/summonaery'],
  [8229, 'arcanecomet/arcanecomet'],
  [8230, 'phaserush/phaserush'],
  [8224, 'nullifyingorb/nullifyingorb'],
  [8226, 'manaflowband/manaflowband'],
  [8275, 'nimbuscloak/nimbuscloak'],
  [8210, 'transcendence/transcendence'],
  [8234, 'celerity/celerity'],
  [8233, 'absolutefocus/absolutefocus'],
  [8237, 'scorch/scorch'],
  [8232, 'waterwalking/waterwalking'],
  [8236, 'gatheringstorm/gatheringstorm'],
  [8992, 'deathfiretouch/deathfire_touch_keystone'],
  [8300, 'inspiration/inspiration'],
  [8351, 'glacialaugment/glacialaugment'],
  [8360, 'unsealedspellbook/unsealedspellbook'],
  [8369, 'firststrike/firststrike'],
  [8306, 'hextechflashtraption/hextechflashtraption'],
  [8304, 'magicalfootwear/magicalfootwear'],
  [8321, 'cashback/cashback'],
  [8313, 'perfecttiming/perfecttiming'],
  [8352, 'timewarptonic/timewarptonic'],
  [8345, 'biscuitdelivery/biscuitdelivery'],
  [8347, 'cosmicinsight/cosmicinsight'],
  [8410, 'approachvelocity/approachvelocity'],
  [8316, 'jackofalltrades/jackofalltrades'],
  [8400, 'resolve/resolve'],
  [8437, 'graspoftheundying/graspoftheundying'],
  [8439, 'aftershock/aftershock'],
  [8465, 'guardian/guardian'],
  [8446, 'demolish/demolish'],
  [8463, 'fontoflife/fontoflife'],
  [8401, 'shieldbash/shieldbash'],
  [8429, 'conditioning/conditioning'],
  [8444, 'secondwind/secondwind'],
  [8473, 'boneplating/boneplating'],
  [8451, 'overgrowth/overgrowth'],
  [8453, 'revitalize/revitalize'],
  [8242, 'unflinching/unflinching'],
];

const PERK_PATH_MAP = new Map(PERK_PATHS);

const STYLE_ID_TO_NAME: Record<number, string> = {
  8000: 'precision',
  8100: 'domination',
  8200: 'sorcery',
  8300: 'inspiration',
  8400: 'resolve',
};

const STYLE_ICON_FILE: Record<number, string> = {
  8000: '7201_precision',
  8100: '7200_domination',
  8200: '7202_sorcery',
  8300: '7203_whimsy',
  8400: '7204_resolve',
};

export function getPerkStyleIconUrl(styleId: number): string | null {
  const filename = STYLE_ICON_FILE[styleId];
  if (!filename) return null;
  return cachedUrl(`https://raw.communitydragon.org/latest/game/assets/perks/styles/${filename}.png`);
}

export function getPerkIconUrl(perkId: number, primaryStyleId: number): string | null {
  const styleName = STYLE_ID_TO_NAME[primaryStyleId];
  const path = PERK_PATH_MAP.get(perkId);
  if (!styleName || !path) return null;
  return cachedUrl(`https://raw.communitydragon.org/latest/game/assets/perks/styles/${styleName}/${path}.png`);
}
