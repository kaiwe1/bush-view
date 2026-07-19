import type { Game, Participant } from '../../../shared/types';

export interface GamePlayer {
  gameName: string;
  tagLine: string;
  championId: number;
  teamId: number;
  puuid: string;
}

export function findPlayerParticipant(game: Game, puuid: string): Participant | null {
  const identity = game.participantIdentities.find(
    (id) => id.player.puuid === puuid,
  );

  if (!identity) return null;

  return (
    game.participants.find(
      (p) => p.participantId === identity.participantId,
    ) ?? null
  );
}

export function getGamePlayers(game: Game): GamePlayer[] {
  return game.participantIdentities.map((identity) => {
    const participant = game.participants.find(
      (p) => p.participantId === identity.participantId,
    );

    return {
      gameName: identity.player.gameName,
      tagLine: identity.player.tagLine,
      championId: participant?.championId ?? 0,
      teamId: participant?.teamId ?? 0,
      puuid: identity.player.puuid,
    };
  });
}
