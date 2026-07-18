import { useEffect } from 'react';
import { TabNavigation } from './app/TabNavigation';
import { tabs } from './app/tabs';
import { preloadItemIcons, preloadSummonerSpellIcons } from './utils';
import { useAppStore } from './store/useAppStore';

function App() {
  const activeTab = useAppStore((s) => s.activeTab);

  // Preload icons on initial render
  useEffect(() => {
    preloadItemIcons();
    preloadSummonerSpellIcons();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Tab Navigation */}
      <TabNavigation />
      {/* main content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {tabs.map(({ key, component: TabComponent }) => (
          <div key={key} className={activeTab === key ? '' : 'hidden'}>
            <TabComponent />
          </div>
        ))}
      </main>
    </div>
  );
}

export default App;
