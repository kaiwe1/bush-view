import { create } from 'zustand';

export type Tab = 'search' | 'profile' | 'version';

interface SearchParams {
  gameName: string;
  tagLine: string;
  timestamp: number;
}

interface AppState {
  activeTab: Tab;
  searchTarget: SearchParams | null;
  setActiveTab: (tab: Tab) => void;
  triggerSearch: (gameName: string, tagLine: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'search',
  searchTarget: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  triggerSearch: (gameName, tagLine) => set({
    searchTarget: { gameName, tagLine, timestamp: Date.now() },
    activeTab: 'search',
  }),
}));
