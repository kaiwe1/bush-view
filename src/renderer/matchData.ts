import type { Game, MatchInfo } from '../shared/types';

export const RECENT_MATCH_LIMIT = 20;

export async function enrichRecentMatchHistory(
  matchData: MatchInfo,
  limit = RECENT_MATCH_LIMIT,
): Promise<MatchInfo> {
  const recentGameIds = matchData.games.games.slice(0, limit).map((game) => game.gameId);
  const fullResults = await Promise.all(
    recentGameIds.map((gameId) =>
      window.electronAPI.getGameById(gameId).catch(() => ({ error: 'fetch failed' })),
    ),
  );

  const enrichedGames = matchData.games.games.map((game, index): Game => {
    const full = index < limit ? fullResults[index] : null;
    if (full && !('error' in full)) return full;
    return game;
  });

  return {
    ...matchData,
    games: { ...matchData.games, games: enrichedGames },
  };
}
