import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, User } from 'lucide-react';
import type { SummonerInfo, MatchInfo, RankedStats } from '../../shared/types';
import type { PlatformId } from '../../shared/platforms';
import { getPlatformIdFromToken } from '../utils';
import { enrichRecentMatchHistory } from '../matchData';
import { useMatchSummary } from '../hooks/useMatchSummary';
import { MatchResults } from './MatchResults';
import { useAppStore } from '../store/useAppStore';

export function ProfileTab() {
  const [profileLoading, setProfileLoading] = useState(false);
  const [summoner, setSummoner] = useState<SummonerInfo | null>(null);
  const [platformId, setPlatformId] = useState<PlatformId | null>(null);
  const [matches, setMatches] = useState<MatchInfo | null>(null);
  const [rankedStats, setRankedStats] = useState<RankedStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerSearch = useAppStore((s) => s.triggerSearch);

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
          const matches = await enrichRecentMatchHistory(matchData);
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

  const { kdaStats, radarStats, championUsage, recentGames } = useMatchSummary(
    matches?.games.games,
    summoner?.puuid,
  );

  const handlePlayerClick = (gameName: string, tagLine: string) => {
    triggerSearch(gameName, tagLine);
  };

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
      onPlayerClick={handlePlayerClick}
    />
  );
}
