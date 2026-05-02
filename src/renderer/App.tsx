import { useState } from 'react';
import { getChampionStats, getSummonerStats } from './api/opgg';
import type { ChampionStats } from './api/opgg';
import type { SummonerInfo, MatchInfo, Game } from '../shared/types';
import { getProfileIconUrl, getPlatformName, getPlatformIdFromToken } from './utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

type OpggSummonerInfo = {
  level: string;
  rank: string;
};

declare global {
  interface Window {
    electronAPI: {
      getCurrentSummoner: () => Promise<SummonerInfo | { error: string }>;
      getMatchHistory: () => Promise<MatchInfo | { error: string }>;
      getLoginSession: () => Promise<{ idToken: string } | { error: string }>;
    };
  }
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatGameMode(game: Game): string {
  const modeMap: Record<string, string> = {
    CLASSIC: '召唤师峡谷',
    ARAM: '极地大乱斗',
    KIWI: '嚎哭深渊',
    TFT: '云顶之弈',
    CHERRY: '斗魂竞技场',
    SWIFTPLAY: '快速模式',
  };
  if (game.gameMode === 'CLASSIC') {
    const queueMap: Record<number, string> = {
      420: '单双排',
      440: '灵活排位',
      430: '匹配',
      450: '大乱斗',
      2400: '斗魂',
    };
    return queueMap[game.queueId] ?? '召唤师峡谷';
  }
  return modeMap[game.gameMode] ?? game.gameMode;
}

function App() {
  const [summoner, setSummoner] = useState<SummonerInfo | null>(null);
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchInfo | null>(null);
  const [champions, setChampions] = useState<ChampionStats[]>([]);
  const [opggSummoner, setOpggSummoner] = useState<OpggSummonerInfo | null>(null);
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetSummoner = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summonerData, sessionData] = await Promise.all([
        window.electronAPI.getCurrentSummoner(),
        window.electronAPI.getLoginSession(),
      ]);
      if ('error' in summonerData) {
        setError(summonerData.error);
      } else {
        setSummoner(summonerData);
      }
      if (!('idToken' in sessionData)) {
        console.warn('Failed to fetch login session:', sessionData.error);
      } else {
        const pid = getPlatformIdFromToken(sessionData.idToken);
        if (pid) setPlatformId(pid);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summoner data');
    }
    setLoading(false);
  };

  const handleGetMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.electronAPI.getMatchHistory();
      if (data && typeof data === 'object' && 'error' in data) {
        setError(data.error as string);
      } else {
        setMatches(data as MatchInfo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch match history');
    }
    setLoading(false);
  };

  const handleGetChampions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getChampionStats();
      setChampions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch champion stats');
    }
    setLoading(false);
  };

  const handleSearchSummoner = async () => {
    if (!searchName.trim()) {
      setError('请输入召唤师名称');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getSummonerStats(searchName.trim());
      if (data) {
        setOpggSummoner(data);
      } else {
        setError('未找到 op.gg 召唤师数据');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch op.gg summoner data');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">BushView</h1>
          <span className="text-sm text-muted-foreground">英雄联盟战绩查询</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleGetSummoner} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            获取召唤师信息
          </Button>
          <Button onClick={handleGetMatches} disabled={loading} variant="secondary">
            获取比赛历史
          </Button>
          <Button onClick={handleGetChampions} disabled={loading} variant="outline">
            获取英雄数据
          </Button>
        </div>

        {/* op.gg Search */}
        <div className="flex gap-2">
          <Input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="输入召唤师名称查询 op.gg"
            className="max-w-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSummoner()}
          />
          <Button onClick={handleSearchSummoner} disabled={loading} variant="outline">
            查询 op.gg
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Summoner Card */}
        {summoner && (
          <Card className="max-w-md">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <img
                src={getProfileIconUrl(summoner.profileIconId)}
                alt="头像"
                className="w-16 h-16 rounded-full border-2 border-amber-400"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="flex flex-col gap-1">
                <CardTitle>
                  {summoner.gameName}#{summoner.tagLine}
                </CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">Lv.{summoner.summonerLevel}</Badge>
                  {platformId && <Badge>{getPlatformName(platformId)}</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                召唤师 ID: {summoner.summonerId}
              </p>
            </CardContent>
          </Card>
        )}

        {/* op.gg Summoner */}
        {opggSummoner && (
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>op.gg 召唤师信息</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div>
                <p className="text-sm text-muted-foreground">等级</p>
                <p className="font-medium">{opggSummoner.level}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">段位</p>
                <p className="font-medium">{opggSummoner.rank}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Match History */}
        {matches && matches.games?.games?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                比赛历史
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  共 {matches.games.gameCount} 场
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">结果</TableHead>
                    <TableHead>模式</TableHead>
                    <TableHead>K / D / A</TableHead>
                    <TableHead>时长</TableHead>
                    <TableHead className="text-right">版本</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.games.games.map((game) => {
                    const player = game.participantIdentities.find((p) =>
                      game.participants.find(
                        (part) => part.participantId === p.participantId
                      )
                    );
                    const participant = game.participants.find(
                      (p) =>
                        p.participantId === player?.participantId
                    );
                    const win = participant?.stats.win;
                    return (
                      <TableRow key={game.gameId}>
                        <TableCell>
                          <Badge variant={win ? 'default' : 'destructive'}>
                            {win ? '胜利' : '失败'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatGameMode(game)}
                        </TableCell>
                        <TableCell className="font-mono text-sm tabular-nums">
                          {participant ? (
                            <>
                              <span>{participant.stats.kills}</span>
                              <span className="text-muted-foreground"> / </span>
                              <span className="text-red-500">
                                {participant.stats.deaths}
                              </span>
                              <span className="text-muted-foreground"> / </span>
                              <span>{participant.stats.assists}</span>
                            </>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDuration(game.gameDuration)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {game.gameVersion}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Champion Stats */}
        {champions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>英雄数据</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>英雄</TableHead>
                    <TableHead>胜率</TableHead>
                    <TableHead>登场率</TableHead>
                    <TableHead>禁用率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {champions.map((champ, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{champ.name}</TableCell>
                      <TableCell>{champ.winRate}</TableCell>
                      <TableCell>{champ.pickRate}</TableCell>
                      <TableCell>{champ.banRate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default App;
