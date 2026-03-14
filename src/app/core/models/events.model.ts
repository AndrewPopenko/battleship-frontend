import { GameState } from './game.model';

export interface ClientToServerEvents {
  joinGame: (data: { gameId: string; playerId: string }) => void;
  shoot: (data: { x: number; y: number }) => void;
}

export interface ServerToClientEvents {
  gameUpdate: (game: GameState) => void;
  shootResult: (result: ShootResult) => void;
  playerJoined: (data: { playerName: string; playerId: string }) => void;
  gameStarted: () => void;
  gameOver: (data: { winnerId: string; winnerName: string }) => void;
  error: (message: string) => void;
}

export interface ShootResult {
  hit: boolean;
  isSunk: boolean;
  gameOver: boolean;
  winner: string | null;
  x: number;
  y: number;
}
