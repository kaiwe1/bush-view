import { useState, useEffect } from 'react';
import { SearchTab } from './components/SearchTab';
import { ProfileTab } from './components/ProfileTab';
import { VersionTab } from './components/VersionTab';
import { Header } from './components/Header';
import { preloadItemIcons, preloadSummonerSpellIcons } from './utils';

type Tab = 'search' | 'profile' | 'version';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('search');

  useEffect(() => {
    preloadItemIcons();
    preloadSummonerSpellIcons();
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
