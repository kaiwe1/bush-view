import { useState } from 'react';
import { getChampionStats, getSummonerStats } from './api/opgg';

type SummonerInfo = {
  displayName: string;
  summonerLevel: number;
};

type MatchHistory = unknown;

type OPGGSummonerInfo = {
  level: string;
  rank: string;
};

declare global {
  interface Window {
    electronAPI: {
      getCurrentSummoner: () => Promise<SummonerInfo | { error: string }>;
      getMatchHistory: () => Promise<MatchHistory | { error: string }>;
    };
  }
}

function App() {
  const [summoner, setSummoner] = useState<SummonerInfo | null>(null);
  const [matches, setMatches] = useState<MatchHistory | null>(null);
  const [champions, setChampions] = useState<unknown[]>([]);
  const [opggSummoner, setOggSummoner] = useState<OPGGSummonerInfo | null>(null);
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetSummoner = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.electronAPI.getCurrentSummoner();
      if ('error' in data) {
        setError(data.error);
      } else {
        setSummoner(data);
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
        setOggSummoner(data);
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
          <p>名称: {summoner.displayName}</p>
          <p>等级: {summoner.summonerLevel}</p>
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
            {champions.map((champ, index) => {
              const item = champ as { name: string; winRate: string; pickRate: string };
              return (
                <li key={index}>
                  {item.name}: 胜率 {item.winRate}, 登场率 {item.pickRate}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;