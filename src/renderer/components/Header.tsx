import { Button } from '@/components/ui/button';
import { Search, User, Database } from 'lucide-react';

type Tab = 'search' | 'profile' | 'version';

const navTabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }>; hidden?: boolean }[] = [
  { key: 'search', label: '战绩查询', icon: Search },
  { key: 'profile', label: '个人资料', icon: User },
  { key: 'version', label: '版本数据', icon: Database, hidden: true },
];


interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6">
        <nav className="flex gap-1">
          {navTabs.filter(t => !t.hidden).map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeTab === key ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange(key)}
            >
              <Icon className="w-4 h-4 mr-1.5" />
              {label}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
