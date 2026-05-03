import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, User } from 'lucide-react';
import type { SummonerInfo, MatchInfo, Game, RankedStats } from '../../shared/types';
import { getPlatformIdFromToken, calculateKDA, calculateRadarStats, getChampionUsage } from '../utils';
import type { KdaStats, RadarStats, ChampionUsage } from '../utils';
import { MatchResults } from './MatchResults';

export function ProfileTab() {
  const [profileLoading, setProfileLoading] = useState(false);
  const [summoner, setSummoner] = useState<SummonerInfo | null>(null);
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchInfo | null>(null);
  const [rankedStats, setRankedStats] = useState<RankedStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProfileLoading(true);
    setError(null);
    Promise.all([
      window.electronAPI.getCurrentSummoner(),
      window.electronAPI.getLoginSession(),
      window.electronAPI.getCurrentSummonerMatchHistory(),
    ])
      .then(async ([summonerData, sessionData, matchData]) => {
        if ('error' in summonerData) {
          setError(summonerData.error);
          return;
        }
        console.log('Summoner Data:', summonerData);
        setSummoner(summonerData);

        if ('idToken' in sessionData) {
          const pid = getPlatformIdFromToken(sessionData.idToken);
          if (pid) setPlatformId(pid);
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
          const matches = {
            ...matchData,
            games: { ...matchData.games, games: enrichedGames },
          };
          console.log('Match Data:', matches);
          setMatches(matches);
        }

        // Fetch ranked stats after getting summoner PUUID
        if (!('error' in summonerData)) {
          const rankedData = await window.electronAPI.getRankedStats(summonerData.puuid);
          if (rankedData && !('error' in rankedData)) {
            setRankedStats(rankedData);
          }
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => {
        setProfileLoading(false);
      });
  }, []);

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

  if (profileLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
          <p>正在加载召唤师数据...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!summoner) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暂无召唤师数据</p>
          <p className="text-xs mt-1">请确保已登录游戏客户端</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <MatchResults
      summoner={summoner}
      platformId={platformId}
      matches={matches}
      kdaStats={kdaStats}
      radarStats={radarStats}
      championUsage={championUsage}
      recentGames={recentGames}
      rankedStats={rankedStats}
    />
  );
}
