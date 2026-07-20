import { protocol } from 'electron';

import { getOrDownloadImage } from './imageCache';

const SCHEME = 'cached-cdragon';

export function registerCachedCdragonSchemePrivileges(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
      },
    },
  ]);
}

/**
 * 注册 cached-cdragon:// 请求处理程序
 * 当请求 cached-cdragon://raw.communitydragon.org/... 时，此函数会读取本地缓存, 没有缓存就下载图片
 */
export function registerCachedCdragonRequestHandler(): void {
  protocol.handle(SCHEME, async (request) => {
    try {
      const { data, mimeType } = await getOrDownloadImage(request.url);
      return new Response(data, {
        status: 200,
        headers: {
          'content-type': mimeType,
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    } catch {
      return new Response('', { status: 404 });
    }
  });
}
