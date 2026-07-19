import { useEffect } from 'react';
import { TabNavigation } from './app/TabNavigation';
import { tabs } from './app/tabs';
import { preloadItemIcons, preloadSummonerSpellIcons } from './utils';
import { useAppStore } from './store/useAppStore';

function App() {
  const activeTab = useAppStore((s) => s.activeTab);

  // 在 App 渲染时从 communitydragon 预加载装备和召唤师技能图表
  useEffect(() => {
    preloadItemIcons();
    preloadSummonerSpellIcons();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* 导航 */}
      <TabNavigation />
      {/* 主要内容 */}
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
