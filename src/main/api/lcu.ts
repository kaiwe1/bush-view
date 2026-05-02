import https from 'https';
import { execSync } from 'child_process';
import type { SummonerInfo, MatchInfo, LoginSession } from '../../shared/types';

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

export function makeLCURequest(endpoint: string, method = 'GET', data?: unknown): Promise<unknown> {
  const creds = getLCUCredentials();
  if (!creds) {
    throw new Error('League client not running or credentials not found');
  }

  const url = `https://127.0.0.1:${creds.port}${endpoint}`;
  const auth = Buffer.from(`riot:${creds.password}`).toString('base64');

  return new Promise<unknown>((resolve, reject) => {
    const options: https.RequestOptions = {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false, // Ignore self-signed cert
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

export async function getCurrentSummoner(): Promise<SummonerInfo> {
  return await makeLCURequest('/lol-summoner/v1/current-summoner') as Promise<SummonerInfo>;
}

export async function getLoginSession(): Promise<LoginSession> {
  return await makeLCURequest('/lol-login/v1/session') as Promise<LoginSession>;
}

export async function getMatchHistory(): Promise<MatchInfo> {
  return await makeLCURequest('/lol-match-history/v1/products/lol/current-summoner/matches') as Promise<MatchInfo>;
}