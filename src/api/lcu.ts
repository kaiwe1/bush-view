import https from 'https';
import fs from 'fs';
import path from 'path';

interface LCUCredentials {
  port: number;
  password: string;
}

export function getLCUCredentials(): LCUCredentials | null {
  const lockfilePath = path.join(
    process.env['ProgramData'] || 'C:\\ProgramData',
    'Riot Games',
    'League of Legends',
    'lockfile'
  );

  if (!fs.existsSync(lockfilePath)) {
    return null;
  }

  const lockfile = fs.readFileSync(lockfilePath, 'utf-8');
  const parts = lockfile.split(':');
  if (parts.length < 5) {
    return null;
  }

  return {
    port: parseInt(parts[2], 10),
    password: parts[3],
  };
}

export function makeLCURequest(endpoint: string, method = 'GET', data?: unknown): Promise<unknown> {
  const creds = getLCUCredentials();
  if (!creds) {
    throw new Error('League client not running or lockfile not found');
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

export async function getCurrentSummoner() {
  return await makeLCURequest('/lol-summoner/v1/current-summoner');
}

export async function getMatchHistory() {
  return await makeLCURequest('/lol-match-history/v1/products/lol/current-summoner/matches');
}