import https from 'https';
import { execSync } from 'child_process';
import type { SummonerInfo, MatchInfo, LoginSession, AliasLookup, RankedStats, Game } from '../../shared/types';

interface LCUCredentials {
  port: number;
  password: string;
}

export function getLCUCredentials(): LCUCredentials | null {
  try {
    const output = execSync(
      "wmic PROCESS WHERE name='LeagueClientUx.exe' GET commandline",
      { encoding: 'utf-8', timeout: 5000 }
    );

    const authTokenMatch = output.match(/--remoting-auth-token=([^\s"']+)/);
    const appPortMatch = output.match(/--app-port=(\d+)/);

    if (!authTokenMatch || !appPortMatch) {
      return null;
    }

    return {
      port: parseInt(appPortMatch[1], 10),
      password: authTokenMatch[1],
    };
  } catch {
    return null;
  }
}

export async function makeLCURequest(endpoint: string, method = 'GET', data?: unknown, retries = 1): Promise<unknown> {
  const creds = getLCUCredentials();
  if (!creds) {
    throw new Error('英雄联盟客户端未运行或未以管理员权限运行');
  }

  const url = `https://127.0.0.1:${creds.port}${endpoint}`;
  const auth = Buffer.from(`riot:${creds.password}`).toString('base64');

  const doRequest = (): Promise<unknown> =>
    new Promise<unknown>((resolve, reject) => {
      const options: https.RequestOptions = {
        method,
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        rejectUnauthorized: false, // Ignore self-signed cert
        timeout: 10000,
      };

      const req = https.request(url, options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(body);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout: ${endpoint}`));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
  });

  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await doRequest();
    } catch (err) {
      lastError = err;
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  throw lastError;
}

export async function getCurrentSummoner(): Promise<SummonerInfo> {
  return await makeLCURequest('/lol-summoner/v1/current-summoner') as Promise<SummonerInfo>;
}

export async function getLoginSession(): Promise<LoginSession> {
  return await makeLCURequest('/lol-login/v1/session') as Promise<LoginSession>;
}

export async function getCurrentSummonerMatchHistory(): Promise<MatchInfo> {
  return await makeLCURequest('/lol-match-history/v1/products/lol/current-summoner/matches') as Promise<MatchInfo>;
}

export async function lookupAlias(gameName: string, tagLine: string): Promise<AliasLookup> {
  const encodedName = encodeURIComponent(gameName);
  const encodedTag = encodeURIComponent(tagLine);
  return await makeLCURequest(`/lol-summoner/v1/alias/lookup?gameName=${encodedName}&tagLine=${encodedTag}`) as Promise<AliasLookup>;
}

export async function getSummonerByPuuid(puuid: string): Promise<SummonerInfo> {
  return await makeLCURequest(`/lol-summoner/v2/summoners/puuid/${puuid}`) as Promise<SummonerInfo>;
}

export async function getMatchHistoryByPuuid(puuid: string): Promise<MatchInfo> {
  return await makeLCURequest(`/lol-match-history/v1/products/lol/${puuid}/matches`) as Promise<MatchInfo>;
}

export async function getGameById(gameId: number): Promise<Game> {
  return await makeLCURequest(`/lol-match-history/v1/games/${gameId}`) as Promise<Game>;
}

export async function getRankedStats(puuid: string): Promise<RankedStats> {
  return await makeLCURequest(`/lol-ranked/v1/ranked-stats/${puuid}`) as Promise<RankedStats>;
}