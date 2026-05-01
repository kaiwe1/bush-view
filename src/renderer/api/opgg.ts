import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ChampionStats {
  name: string;
  winRate: string;
  pickRate: string;
  banRate: string;
}

export async function getChampionStats(): Promise<ChampionStats[]> {
  try {
    const response = await axios.get<string>('https://www.op.gg/champions');
    const $ = cheerio.load(response.data);

    const champions: ChampionStats[] = [];

    // Assuming the structure, adjust selectors as needed
    $('.champion-list .champion-item').each((index, element) => {
      const name = $(element).find('.champion-name').text().trim();
      const winRate = $(element).find('.win-rate').text().trim();
      const pickRate = $(element).find('.pick-rate').text().trim();
      const banRate = $(element).find('.ban-rate').text().trim();

      if (name) {
        champions.push({ name, winRate, pickRate, banRate });
      }
    });

    return champions;
  } catch (error: unknown) {
    console.error('Error fetching champion stats:', error);
    return [];
  }
}

export async function getSummonerStats(
  summonerName: string,
): Promise<{ level: string; rank: string } | null> {
  try {
    const response = await axios.get<string>(
      `https://www.op.gg/summoners/cn/${encodeURIComponent(summonerName)}`,
    );
    const $ = cheerio.load(response.data);

    // Parse summoner info, adjust selectors
    const level = $('.summoner-level').text().trim();
    const rank = $('.summoner-rank').text().trim();

    return { level, rank };
  } catch (error: unknown) {
    console.error('Error fetching summoner stats:', error);
    return null;
  }
}