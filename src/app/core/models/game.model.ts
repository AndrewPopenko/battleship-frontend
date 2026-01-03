import { CellState } from './cell-state.enum';
import { GamePhase } from './game-phase.enum';

export interface GameState {
  id: string;
  players: [Player, Player | null];
  phase: GamePhase;
  turn: string | null;
  winner: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  board: CellState[][];
  ships: Ship[];
}

export interface Ship {
  id: string;
  size: number;
  hits: number;
  position?: { x: number; y: number };
  orientation?: 'horizontal' | 'vertical';
}
