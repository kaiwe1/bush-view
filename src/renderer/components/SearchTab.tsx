import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ArrowLeft } from 'lucide-react';
import type { SummonerInfo, MatchInfo, RankedStats } from '../../shared/types';
import { calculateKDA, calculateRadarStats, getChampionUsage, parseRiotId } from '../utils';
import { MatchResults } from './MatchResults';
import { useAppStore } from '../store/useAppStore';

export function SearchTab() {
  const [searchName, setSearchName] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [summoner, setSummoner] = useState<SummonerInfo | null>(null);
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchInfo | null>(null);
  const [rankedStats, setRankedStats] = useState<RankedStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchTarget = useAppStore((s) => s.searchTarget);
  const triggerSearch = useAppStore((s) => s.triggerSearch);
  const lastTimestamp = useRef(0);

  const performSearch = useCallback(async (name: string) => {
    const riotId = parseRiotId(name);
    if (!riotId) {
      setError('请输入正确的 Riot ID 格式（如 游戏ID#000）');
      return;
    }
    setSearchLoading(true);
    setError(null);
    setSummoner(null);
    setMatches(null);
    setRankedStats(null);
    setPlatformId(null);

    try {
      const aliasData = await window.electronAPI.lookupAlias(riotId.gameName, riotId.tagLine);
      if ('error' in aliasData) {
        setError(aliasData.error);
        setSearchLoading(false);
        return;
      }

      const [summonerData, matchData, rankedData] = await Promise.all([
        window.electronAPI.getSummonerByPuuid(aliasData.puuid),
        window.electronAPI.getMatchHistoryByPuuid(aliasData.puuid),
        window.electronAPI.getRankedStats(aliasData.puuid),
      ]);

      if (!('error' in summonerData)) {
        setSummoner(summonerData);
      }
      if (matchData && !('error' in matchData)) {
        // Fetch full game data for recent games to show all 10 participants
        const recentGameIds = matchData.games.games.slice(0, 20).map(g => g.gameId);
        const fullResults = await Promise.all(
          recentGameIds.map((gameId) =>
            window.electronAPI.getGameById(gameId).catch(() => ({ error: 'fetch failed' }))
          )
        );
        const enrichedGames = matchData.games.games.map((game, i) => {
          const full = i < 20 ? fullResults[i] : null;
          if (full && !('error' in full)) return full;
          return game;
        });
        setMatches({
          ...matchData,
          games: { ...matchData.games, games: enrichedGames },
        });
        setPlatformId(matchData.platformId);
      }
      if (rankedData && !('error' in rankedData)) {
        setRankedStats(rankedData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
    }
    setSearchLoading(false);
  }, []);

  // Watch for cross-tab search triggers (from ProfileTab, SearchTab etc.)
  useEffect(() => {
    if (searchTarget && searchTarget.timestamp !== lastTimestamp.current) {
      lastTimestamp.current = searchTarget.timestamp;
      const name = `${searchTarget.gameName}#${searchTarget.tagLine}`;
      setSearchName(name);
      performSearch(name);
    }
  }, [searchTarget, performSearch]);

  const handleSearch = () => performSearch(searchName);

  const handlePlayerClick = (gameName: string, tagLine: string) => {
    triggerSearch(gameName, tagLine);
  };

  const handleClear = () => {
    setSummoner(null);
    setMatches(null);
    setRankedStats(null);
    setPlatformId(null);
    setError(null);
    setSearchName('');
  };

  const kdaStats = useMemo(() => {
    if (!matches?.games?.games || !summoner?.puuid) return null;
    return calculateKDA(matches.games.games, summoner.puuid);
  }, [matches, summoner]);

  const radarStats = useMemo(() => {
    if (!matches?.games?.games || !summoner?.puuid) return null;
    return calculateRadarStats(matches.games.games, summoner.puuid);
  }, [matches, summoner]);

  const championUsage = useMemo(() => {
    if (!matches?.games?.games || !summoner?.puuid) return [];
    return getChampionUsage(matches.games.games, summoner.puuid);
  }, [matches, summoner]);

  const recentGames = useMemo(() => {
    if (!matches?.games?.games) return [];
    return matches.games.games.slice(0, 20);
  }, [matches]);

  // If we have a summoner, show their profile and match results. Otherwise, show the search form.
  if (summoner) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          返回搜索
        </Button>
        <MatchResults
          summoner={summoner}
          platformId={platformId}
          matches={matches}
          kdaStats={kdaStats}
          radarStats={radarStats}
          championUsage={championUsage}
          recentGames={recentGames}
          rankedStats={rankedStats}
          onPlayerClick={handlePlayerClick}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>召唤师查询</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="输入召唤师名称（如 游戏ID#000）"
              className="max-w-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searchLoading}>
              {searchLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
              <span className="ml-1.5">搜索</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}