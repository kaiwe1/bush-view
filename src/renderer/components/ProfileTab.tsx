import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, User } from 'lucide-react';
import type { SummonerInfo, MatchInfo, Game } from '../../shared/types';
import { getPlatformIdFromToken, calculateKDA, getChampionUsage } from '../utils';
import type { KdaStats, ChampionUsage } from '../utils';
import { MatchResults } from './MatchResults';

export function ProfileTab() {
  const [profileLoading, setProfileLoading] = useState(false);
  const [summoner, setSummoner] = useState<SummonerInfo | null>(null);
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProfileLoading(true);
    setError(null);
    Promise.all([
      window.electronAPI.getCurrentSummoner(),
      window.electronAPI.getLoginSession(),
      window.electronAPI.getMatchHistory(),
    ])
      .then(([summonerData, sessionData, matchData]) => {
        if ('error' in summonerData) {
          setError(summonerData.error);
          return;
        }
        setSummoner(summonerData);

        if ('idToken' in sessionData) {
          const pid = getPlatformIdFromToken(sessionData.idToken);
          if (pid) setPlatformId(pid);
        }

        if (matchData && !('error' in matchData)) {
          setMatches(matchData);
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
      championUsage={championUsage}
      recentGames={recentGames}
    />
  );
}
