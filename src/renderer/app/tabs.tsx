import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Database, Search, User } from 'lucide-react';
import { ProfileTab } from '../features/profile/ProfileTab';
import { SearchTab } from '../features/search/SearchTab';
import { VersionTab } from '../features/version/VersionTab';

export const tabs = [
  {
    key: 'search',
    label: '战绩查询',
    icon: Search,
    component: SearchTab,
    hidden: false,
  },
  {
    key: 'profile',
    label: '个人资料',
    icon: User,
    component: ProfileTab,
    hidden: false,
  },
  {
    key: 'version',
    label: '版本数据',
    icon: Database,
    component: VersionTab,
    hidden: false,
  },
] as const satisfies readonly {
  key: string;
  label: string;
  icon: LucideIcon;
  component: ComponentType;
  hidden?: boolean;
}[];

export type Tab = (typeof tabs)[number]['key'];
