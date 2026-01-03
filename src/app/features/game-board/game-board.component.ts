import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CellState } from '../../core/models/cell-state.enum';
import { GamePhase } from '../../core/models/game-phase.enum';
import { GameState, Player } from '../../core/models/game.model';
import { ApiService } from '../../core/services/api.service';
import { GameStateService } from '../../core/services/game-state.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { BoardComponent } from '../../shared/components/board/board.component';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, BoardComponent],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss',
})
export class GameBoardComponent implements OnInit, OnDestroy {
  gameId = signal('');
  playerId = signal('');
  game = signal<GameState | null>(null);
  lastShot = signal<{ x: number; y: number } | null>(null);
  gameOverMessage = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private wsService: WebSocketService,
    protected gameState: GameStateService
  ) {}

  get loading() {
    return this.gameState.loading;
  }

  get error() {
    return this.gameState.errorMessage;
  }

  ngOnInit(): void {
    this.gameId.set(this.route.snapshot.params['id']);
    this.playerId.set(localStorage.getItem('playerId') || '');

    if (!this.playerId()) {
      this.router.navigate(['/lobby']);
      return;
    }

    this.loadGame();
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    this.wsService.disconnect();
  }

  loadGame(): void {
    this.gameState.setLoading(true);
    this.apiService.getGame(this.gameId()).subscribe({
      next: (game) => {
        this.game.set(game);
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

  setupWebSocket(): void {
    this.wsService.connect();
    this.wsService.joinGame(this.gameId(), this.playerId());

    this.wsService.onGameUpdate().subscribe((game) => {
      this.game.set(game);
      this.gameState.setGame(game);
    });

    this.wsService.onShootResult().subscribe((result) => {
      this.lastShot.set({ x: result.x, y: result.y });

      // Clear last shot highlight after 2 seconds
      setTimeout(() => this.lastShot.set(null), 2000);

      if (result.hit) {
        if (result.sunk) {
          console.log('Ship sunk!');
        }
      }

      if (result.gameOver) {
        this.gameOverMessage.set(
          result.winner === this.playerId() ? '🎉 You won!' : '😢 You lost'
        );
      }
    });

    this.wsService.onGameOver().subscribe((data) => {
      this.gameOverMessage.set(
        data.winnerId === this.playerId() ? `🎉 You won!` : `😢 ${data.winnerName} won`
      );
    });

    this.wsService.onError().subscribe((message) => {
      this.gameState.setError(message);
      setTimeout(() => this.gameState.setError(null), 3000);
    });
  }

  getCurrentPlayer(): Player | null {
    if (!this.game()) return null;
    return this.game()!.players.find((p) => p?.id === this.playerId()) || null;
  }

  getOpponent(): Player | null {
    if (!this.game()) return null;
    return this.game()!.players.find((p) => p?.id !== this.playerId()) || null;
  }

  isMyTurn(): boolean {
    return this.game()?.turn === this.playerId();
  }

  onOpponentBoardClick(coords: { x: number; y: number }): void {
    if (!this.isMyTurn()) {
      this.gameState.setError('Not your turn!');
      setTimeout(() => this.gameState.setError(null), 2000);
      return;
    }

    if (this.game()?.phase !== GamePhase.IN_PROGRESS) {
      return;
    }

    const opponent = this.getOpponent();
    if (!opponent) return;

    // Check if cell was already shot
    const cell = opponent.board[coords.y][coords.x];
    if (cell === CellState.HIT || cell === CellState.MISS) {
      this.gameState.setError('You already shot here!');
      setTimeout(() => this.gameState.setError(null), 2000);
      return;
    }

    this.wsService.shoot(coords.x, coords.y);
  }

  getMyBoard(): CellState[][] {
    const player = this.getCurrentPlayer();
    return player?.board || [];
  }

  getOpponentBoard(): CellState[][] {
    const opponent = this.getOpponent();
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

  GamePhase = GamePhase;
}
