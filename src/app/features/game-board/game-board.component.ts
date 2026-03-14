import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { delay, of, tap } from 'rxjs';
import { CellState } from '../../core/models/cell-state.enum';
import { GamePhase } from '../../core/models/game-phase.enum';
import { Player } from '../../core/models/game.model';
import { ApiService } from '../../core/services/api.service';
import { GameStateService } from '../../core/services/game-state.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { BoardComponent } from '../../shared/components/board/board.component';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, BoardComponent, TranslateModule],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss',
})
export class GameBoardComponent implements OnInit, OnDestroy {
  gameId = signal('');
  playerId = signal('');
  lastShot = signal<{ x: number; y: number } | null>(null);
  gameOverMessage = signal<string | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);
  private readonly wsService = inject(WebSocketService);
  protected readonly gameState = inject(GameStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  get loading() {
    return this.gameState.loading;
  }

  get error() {
    return this.gameState.errorMessage;
  }

  ngOnInit(): void {
    this.gameId.set(this.route.snapshot.params['id']);
    const playerId = localStorage.getItem('playerId') || '';
    const playerName = localStorage.getItem('playerName') || '';

    this.playerId.set(playerId);
    this.gameState.setCurrentPlayer(playerId, playerName);

    if (!playerId) {
      this.router.navigate(['/lobby']);
      return;
    }

    this.loadGame();
    this.handleWebSocket();
  }

  ngOnDestroy(): void {
    this.wsService.disconnect();
  }

  loadGame(): void {
    this.gameState.setLoading(true);
    this.apiService.getGame(this.gameId()).subscribe({
      next: (game) => {
        this.gameState.setGame(game);
        this.gameState.setLoading(false);

        // Check if game hasn't started yet
        if (game.phase === GamePhase.PLACING_SHIPS) {
          this.router.navigate(['/game', this.gameId(), 'setup']);
        }
      },
      error: (err) => {
        console.error('Error loading game:', err);
        this.gameState.setError('Error loading game');
        this.gameState.setLoading(false);
      },
    });
  }

  handleWebSocket(): void {
    this.wsService.connect();
    this.wsService.joinGame(this.gameId(), this.playerId());
    this.gameState.initializeWebSocket(this.wsService, this.destroyRef);

    this.wsService
      .onShootResult()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((result) => {
          this.lastShot.set({ x: result.x, y: result.y });

          if (result.hit && result.isSunk) {
            console.log('Ship sunk!');
          }
        }),
        delay(2000),
        tap(() => this.lastShot.set(null)),
      )
      .subscribe();

    this.wsService
      .onGameOver()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const messageKey = data.winnerId === this.playerId() ? 'game.youWon' : 'game.opponentWon';
        this.translate.get(messageKey, { name: data.winnerName }).subscribe((msg: string) => {
          this.gameOverMessage.set(msg);
        });
      });
  }

  get game() {
    return this.gameState.game();
  }

  onOpponentBoardClick(coords: { x: number; y: number }): void {
    if (!this.gameState.isMyTurn()) {
      this.translate.get('game.notYourTurn').subscribe((msg: string) => this.showError(msg));
      return;
    }

    if (this.game?.phase !== GamePhase.IN_PROGRESS) {
      return;
    }

    const opponent = this.gameState.getOpponent();
    if (!opponent) return;

    // Check if cell was already shot
    const cell = opponent.board[coords.y][coords.x];
    if (cell === CellState.HIT || cell === CellState.MISS) {
      this.translate.get('game.alreadyShot').subscribe((msg: string) => this.showError(msg));
      return;
    }

    this.wsService.shoot(coords.x, coords.y);
  }

  getMyBoard(): CellState[][] {
    const player = this.gameState.getCurrentPlayer();
    return player?.board || [];
  }

  getOpponentBoard(): CellState[][] {
    const opponent = this.gameState.getOpponent();
    return opponent?.board || [];
  }

  getShipsRemaining(player: Player | null): number {
    if (!player) return 0;
    return player.ships.filter((s) => s.hits < s.size).length;
  }

  restartGame(): void {
    this.router.navigate(['/lobby']);
  }

  copyGameId(): void {
    navigator.clipboard.writeText(this.gameId());
  }

  private showError(message: string, duration: number = 2000): void {
    this.gameState.setError(message);
    of(null)
      .pipe(
        delay(duration),
        tap(() => this.gameState.setError(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  GamePhase = GamePhase;
}
