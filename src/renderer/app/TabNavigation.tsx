import { Button } from '@/components/ui/button';
import { useAppStore } from '../store/useAppStore';
import { tabs } from './tabs';

export function TabNavigation() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <header className="border-b">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6">
        <nav className="flex gap-1">
          {tabs.filter((tab) => !tab.hidden).map(({ key, label, icon: Icon }) => (
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
  );
}
