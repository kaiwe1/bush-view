import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, User, Database } from 'lucide-react';
import { SearchTab } from './components/SearchTab';
import { ProfileTab } from './components/ProfileTab';
import { VersionTab } from './components/VersionTab';

type Tab = 'search' | 'profile' | 'version';

const navTabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'search', label: '战绩查询', icon: Search },
  { key: 'profile', label: '个人资料', icon: User },
  { key: 'version', label: '版本数据', icon: Database },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('search');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center">
          <h1 className="text-lg font-bold mr-8">BushView</h1>
          <nav className="flex gap-1">
            {navTabs.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={activeTab === key ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(key)}
              >
                <Icon className="w-4 h-4 mr-1.5" />
                {label}
              </Button>
            ))}
          </nav>
        </div>
      </header>

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
