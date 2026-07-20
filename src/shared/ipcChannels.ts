export const IPC_CHANNELS = {
  getCurrentSummoner: 'get-current-summoner',
  getCurrentSummonerMatchHistory: 'get-current-summoner-match-history',
  getGameById: 'get-game-by-id',
  getLoginSession: 'get-login-session',
  lookupAlias: 'lookup-alias',
  getSummonerByPuuid: 'get-summoner-by-puuid',
  getMatchHistoryByPuuid: 'get-match-history-by-puuid',
  getRankedStats: 'get-ranked-stats',
  getOpggChampionStats: 'get-opgg-champion-stats',
} as const;
