import { useEffect, useState } from 'react';
import { cachedUrl } from './cdragon';

interface IconEntry {
  id: number;
  iconPath: string;
}

export interface IconRegistry {
  preload: () => Promise<void>;
  getUrl: (id: number) => string | null;
  useLoaded: () => boolean;
}

export function createIconRegistry(
  configUrl: string,
  iconsBase: string,
): IconRegistry {
  let iconMap: Map<number, string> | null = null;
  let loadPromise: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  const preload = async (): Promise<void> => {
    if (iconMap) return;
    if (loadPromise) {
      await loadPromise;
      return;
    }

    loadPromise = (async () => {
      try {
        const res = await fetch(configUrl);
        const entries: IconEntry[] = await res.json();
        const map = new Map<number, string>();

        for (const { id, iconPath } of entries) {
          if (id && iconPath) {
            const filename = iconPath.split('/').pop()?.toLowerCase();
            if (filename) map.set(id, cachedUrl(`${iconsBase}/${filename}`));
          }
        }

        iconMap = map;
      } catch {
        iconMap = new Map();
      } finally {
        listeners.forEach((cb) => cb());
      }
    })();

    await loadPromise;
  };

  const getUrl = (id: number): string | null => {
    if (id === 0) return null;
    if (!iconMap) {
      preload();
      return null;
    }
    return iconMap.get(id) ?? null;
  };

  const useLoaded = (): boolean => {
    const [, forceUpdate] = useState(0);

    useEffect(() => {
      if (iconMap) return;

      const listener = () => forceUpdate((v) => v + 1);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, []);

    return iconMap !== null;
  };

  return { preload, getUrl, useLoaded };
}
