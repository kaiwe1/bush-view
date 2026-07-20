import { app, net } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

let cacheDir: string;

function getCacheDir(): string {
  if (!cacheDir) {
    cacheDir = path.join(app.getPath('userData'), 'image-cache');
  }
  return cacheDir;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function mimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'image/png';
  }
}

/**
 * Fetch an image from CDragon, cache it locally, and return the buffer.
 * `cachedUrl` is a cached-cdragon:// URL where the host+path mirror the CDN.
 */
export async function getOrDownloadImage(cachedUrl: string): Promise<{ data: Buffer; mimeType: string }> {
  const httpsUrl = cachedUrl.replace('cached-cdragon://', 'https://'); // 将 cached-cdragon:// 替换成了 https://
  const urlObj = new URL(httpsUrl);
  const cachePath = path.join(getCacheDir(), urlObj.hostname, urlObj.pathname);

  // 如果存在缓存则直接读取返回
  if (fs.existsSync(cachePath)) {
    const data = fs.readFileSync(cachePath);
    return { data, mimeType: mimeType(cachePath) };
  }

  // 否则从网络获取，保存到缓存并返回
  const response = await net.fetch(httpsUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${httpsUrl}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  // Persist to cache
  ensureDir(path.dirname(cachePath));
  fs.writeFileSync(cachePath, buffer);

  return { data: buffer, mimeType: mimeType(cachePath) };
}
