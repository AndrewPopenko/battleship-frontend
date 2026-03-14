import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { GameStateService } from '../../core/services/game-state.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
})
export class LobbyComponent {
  playerName = signal('');
  gameIdToJoin = signal('');
  createdGameId = signal<string | null>(null);

  constructor(
    private apiService: ApiService,
    private router: Router,
    protected gameState: GameStateService,
    private translate: TranslateService,
  ) {}

  // Use loading and error from gameState
  get loading() {
    return this.gameState.loading;
  }

  get error() {
    return this.gameState.errorMessage;
  }

  createGame(): void {
    if (!this.playerName().trim()) {
      this.translate
        .get('errors.enterPlayerName')
        .subscribe((msg: string) => this.gameState.setError(msg));
      return;
    }

    this.gameState.setLoading(true);
    this.gameState.setError(null);

    this.apiService.createGame(this.playerName()).subscribe({
      next: (game) => {
        this.gameState.setLoading(false);
        this.gameState.setGame(game);
        this.createdGameId.set(game.id);
        this.gameState.setCurrentPlayer(game.players[0].id, this.playerName());
        localStorage.setItem('playerId', game.players[0].id);
        localStorage.setItem('playerName', this.playerName());
        this.router.navigate(['/game', game.id, 'setup']);
      },
      error: (err) => {
        this.gameState.setLoading(false);
        this.translate
          .get('errors.createGame')
          .subscribe((msg) => this.gameState.setError(msg + ': ' + err.message));
      },
    });
  }

  joinGame(): void {
    if (!this.playerName().trim()) {
      this.translate
        .get('errors.enterPlayerName')
        .subscribe((msg: string) => this.gameState.setError(msg));
      return;
    }

    if (!this.gameIdToJoin().trim()) {
      this.translate
        .get('errors.enterGameId')
        .subscribe((msg: string) => this.gameState.setError(msg));
      return;
    }

    this.gameState.setLoading(true);
    this.gameState.setError(null);

    this.apiService.joinGame(this.gameIdToJoin(), this.playerName()).subscribe({
      next: (game) => {
        this.gameState.setLoading(false);
        this.gameState.setGame(game);
        const player = game.players.find((p) => p?.name === this.playerName());
        if (player) {
          this.gameState.setCurrentPlayer(player.id, this.playerName());
          localStorage.setItem('playerId', player.id);
          localStorage.setItem('playerName', this.playerName());
          this.router.navigate(['/game', game.id, 'setup']);
        }
      },
      error: (err) => {
        this.gameState.setLoading(false);
        this.translate
          .get('errors.joinGame')
          .subscribe((msg) => this.gameState.setError(msg + ': ' + err.message));
      },
    });
  }

  copyGameId(): void {
    if (this.createdGameId()) {
      navigator.clipboard.writeText(this.createdGameId()!);
    }
  }
}
