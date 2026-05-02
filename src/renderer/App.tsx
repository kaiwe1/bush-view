import { useState } from 'react';
import { getChampionStats, getSummonerStats } from './api/opgg';
import type { ChampionStats } from './api/opgg';
import type { SummonerInfo, MatchInfo, LoginSession } from '../shared/types';
import { getProfileIconUrl, getPlatformName, getPlatformIdFromToken } from './utils';

type OpggSummonerInfo = {
  level: string;
  rank: string;
};

declare global {
  interface Window {
    electronAPI: {
      getCurrentSummoner: () => Promise<SummonerInfo | { error: string }>;
      getMatchHistory: () => Promise<MatchInfo | { error: string }>;
      getLoginSession: () => Promise<LoginSession | { error: string }>;
    };
  }
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
      console.log('Received summoner data:', summonerData);
      console.log('Received login session:', sessionData);
      if ('error' in summonerData) {
        setError(summonerData.error);
      } else {
        setSummoner(summonerData);
      }
      if ('error' in sessionData && !('idToken' in sessionData)) {
        console.warn('Failed to fetch login session:', sessionData.error);
      } else {
        const pid = getPlatformIdFromToken(sessionData.idToken);
        console.log('Extracted platform ID from token:', pid);
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
      console.log('Received match history data:', data);
      if (data && typeof data === 'object' && 'error' in data) {
        setError(data.error);
      } else {
        setMatches(data);
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
    <div className="App" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>BushView - 英雄联盟战绩查询</h1>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleGetSummoner} disabled={loading}>获取召唤师信息</button>
        <button onClick={handleGetMatches} disabled={loading} style={{ marginLeft: '10px' }}>获取比赛历史</button>
        <button onClick={handleGetChampions} disabled={loading} style={{ marginLeft: '10px' }}>获取英雄数据</button>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <input
          value={searchName}
          onChange={(event) => setSearchName(event.target.value)}
          placeholder="输入召唤师名称查询 op.gg"
          style={{ padding: '6px', width: '240px' }}
        />
        <button onClick={handleSearchSummoner} disabled={loading} style={{ marginLeft: '10px' }}>
          查询 op.gg 召唤师
        </button>
      </div>
      {loading && <p>加载中...</p>}
      {error && <p style={{ color: 'red' }}>错误: {error}</p>}
      {summoner && (
        <div>
          <h2>召唤师信息</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <img
              src={getProfileIconUrl(summoner.profileIconId)}
              alt="头像"
              style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #c8a858' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 'bold' }}>
                {summoner.gameName}#{summoner.tagLine}
              </p>
              <p style={{ margin: '0 0 2px', fontSize: '14px', color: '#666' }}>
                用户ID: {summoner.summonerId}
              </p>
              {platformId && (
                <p style={{ margin: '0 0 2px', fontSize: '14px', color: '#666' }}>
                  区服: {getPlatformName(platformId)}
                </p>
              )}
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                等级: {summoner.summonerLevel}
              </p>
            </div>
          </div>
        </div>
      )}
      {opggSummoner && (
        <div>
          <h2>op.gg 召唤师信息</h2>
          <p>等级: {opggSummoner.level}</p>
          <p>段位: {opggSummoner.rank}</p>
        </div>
      )}
      {matches && (
        <div>
          <h2>比赛历史</h2>
          <pre>{JSON.stringify(matches, null, 2)}</pre>
        </div>
      )}
      {champions.length > 0 && (
        <div>
          <h2>英雄数据</h2>
          <ul>
            {champions.map((champ, index) => (
              <li key={index}>
                {champ.name}: 胜率 {champ.winRate}, 登场率 {champ.pickRate}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;