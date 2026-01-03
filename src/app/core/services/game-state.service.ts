import { Injectable, signal } from '@angular/core';
import { GamePhase } from '../models/game-phase.enum';
import { GameState, Player } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  // Game state signals
  game = signal<GameState | null>(null);
  currentPlayerId = signal<string | null>(null);
  currentPlayerName = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  loading = signal<boolean>(false);

  // Computed signals
  isMyTurn = (): boolean => {
    const game = this.game();
    const playerId = this.currentPlayerId();
    return game?.turn === playerId && game?.phase === GamePhase.IN_PROGRESS;
  };

  getCurrentPlayer = (): Player | null => {
    const game = this.game();
    const playerId = this.currentPlayerId();
    if (!game || !playerId) return null;
    return game.players.find((p) => p?.id === playerId) ?? null;
  };

  getOpponent = (): Player | null => {
    const game = this.game();
    const playerId = this.currentPlayerId();
    if (!game || !playerId) return null;
    return game.players.find((p) => p?.id !== playerId) ?? null;
  };

  isGameReady = (): boolean => {
    const game = this.game();
    return game?.players.length === 2 && game.players.every((p) => p !== null);
  };

  isPlacementPhase = (): boolean => {
    return this.game()?.phase === GamePhase.PLACING_SHIPS;
  };

  isBattlePhase = (): boolean => {
    return this.game()?.phase === GamePhase.IN_PROGRESS;
  };

  isGameOver = (): boolean => {
    return this.game()?.phase === GamePhase.FINISHED;
  };

  getWinner = (): Player | null => {
    const game = this.game();
    if (!game || !game.winner) return null;
    return game.players.find((p) => p?.id === game.winner) ?? null;
  };

  isWinner = (): boolean => {
    const game = this.game();
    const playerId = this.currentPlayerId();
    return game?.winner === playerId;
  };

  // Methods for updating state
  setGame(game: GameState | null): void {
    this.game.set(game);
  }

  setCurrentPlayer(playerId: string, playerName: string): void {
    this.currentPlayerId.set(playerId);
    this.currentPlayerName.set(playerName);
  }

  setError(message: string | null): void {
    this.errorMessage.set(message);
  }

  setLoading(loading: boolean): void {
    this.loading.set(loading);
  }

  // Reset state
  reset(): void {
    this.game.set(null);
    this.currentPlayerId.set(null);
    this.currentPlayerName.set(null);
    this.errorMessage.set(null);
    this.loading.set(false);
  }
}
