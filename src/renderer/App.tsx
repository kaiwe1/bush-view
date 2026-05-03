import { useState, useEffect } from 'react';
import { SearchTab } from './components/SearchTab';
import { ProfileTab } from './components/ProfileTab';
import { VersionTab } from './components/VersionTab';
import { Header } from './components/Header';
import type { RankedStats } from '../shared/types';

type Tab = 'search' | 'profile' | 'version';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [rankedStats, setRankedStats] = useState<RankedStats | null>(null);

  useEffect(() => {
    window.electronAPI.getCurrentSummoner().then((data) => {
      if ('error' in data) return;
      window.electronAPI.getRankedStats(data.puuid).then((ranked) => {
        if (!('error' in ranked)) {
          setRankedStats(ranked);
        }
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className={activeTab === 'search' ? '' : 'hidden'}>
          <SearchTab />
        </div>
        <div className={activeTab === 'profile' ? '' : 'hidden'}>
          <ProfileTab />
        </div>
        <div className={activeTab === 'version' ? '' : 'hidden'}>
          <VersionTab />
        </div>
      </main>
    </div>
  );
}

export default App;
