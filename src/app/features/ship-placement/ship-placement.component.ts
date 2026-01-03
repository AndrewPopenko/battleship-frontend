import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CellState } from '../../core/models/cell-state.enum';
import { GameState, Player } from '../../core/models/game.model';
import { ApiService } from '../../core/services/api.service';
import { GameStateService } from '../../core/services/game-state.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { BoardComponent } from '../../shared/components/board/board.component';
import {
  createEmptyBoard,
  isValidPlacement,
  placeShipOnBoard,
  removeShipFromBoard,
  ShipPlacement,
} from '../../shared/utils/board.utils';

interface ShipToPlace {
  id: string;
  size: number;
  name: string;
  placed: boolean;
  placement?: ShipPlacement;
}

@Component({
  selector: 'app-ship-placement',
  standalone: true,
  imports: [CommonModule, BoardComponent],
  templateUrl: './ship-placement.component.html',
  styleUrl: './ship-placement.component.scss',
})
export class ShipPlacementComponent implements OnInit, OnDestroy {
  gameId = signal('');
  playerId = signal('');
  game = signal<GameState | null>(null);

  board = signal<CellState[][]>(createEmptyBoard());
  ships = signal<ShipToPlace[]>([]);
  selectedShip = signal<ShipToPlace | null>(null);
  orientation = signal<'horizontal' | 'vertical'>('horizontal');
  highlightCell = signal<{ x: number; y: number } | null>(null);

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

        // Initialize ships from player's ships in game state
        const player = game.players.find((p) => p?.id === this.playerId());
        if (player && player.ships) {
          const shipsToPlace: ShipToPlace[] = player.ships.map((ship) => ({
            id: ship.id,
            size: ship.size,
            name: this.getShipName(ship.size),
            placed: false,
          }));
          this.ships.set(shipsToPlace);
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

      // If both players are ready, navigate to game
      if (game.players[0]?.isReady && game.players[1]?.isReady) {
        this.router.navigate(['/game', this.gameId(), 'play']);
      }
    });

    this.wsService.onPlayerJoined().subscribe((data) => {
      console.log('Player joined:', data.playerName);
    });
  }

  selectShip(ship: ShipToPlace): void {
    if (ship.placed) {
      // Remove the ship from board
      this.removeShip(ship);
    } else {
      this.selectedShip.set(ship);
    }
  }

  removeShip(ship: ShipToPlace): void {
    if (!ship.placement) return;

    const newBoard = removeShipFromBoard(
      this.board(),
      ship.placement.x,
      ship.placement.y,
      ship.size,
      ship.placement.orientation
    );

    this.board.set(newBoard);

    // Update ships array
    const updatedShips = this.ships().map((s) =>
      s.id === ship.id ? { ...s, placed: false, placement: undefined } : s
    );
    this.ships.set(updatedShips);
  }

  toggleOrientation(): void {
    this.orientation.set(this.orientation() === 'horizontal' ? 'vertical' : 'horizontal');
  }

  onBoardCellClick(coords: { x: number; y: number }): void {
    const ship = this.selectedShip();
    if (!ship) return;

    const valid = isValidPlacement(this.board(), coords.x, coords.y, ship.size, this.orientation());

    if (valid) {
      const newBoard = placeShipOnBoard(
        this.board(),
        coords.x,
        coords.y,
        ship.size,
        this.orientation()
      );

      this.board.set(newBoard);

      // Update ships array
      const updatedShips = this.ships().map((s) =>
        s.id === ship.id
          ? {
              ...s,
              placed: true,
              placement: {
                shipId: ship.id,
                x: coords.x,
                y: coords.y,
                orientation: this.orientation(),
              },
            }
          : s
      );
      this.ships.set(updatedShips);
      this.selectedShip.set(null);
    } else {
      this.gameState.setError('Cannot place ship here');
      setTimeout(() => this.gameState.setError(null), 2000);
    }
  }

  allShipsPlaced(): boolean {
    return this.ships().every((s) => s.placed);
  }

  confirmPlacement(): void {
    // Check if player is already ready (from random placement)
    const currentPlayer = this.game()?.players.find((p) => p?.id === this.playerId());
    if (currentPlayer?.isReady) {
      console.log('Player is already ready, skipping confirmation');
      return;
    }

    if (!this.allShipsPlaced()) {
      this.gameState.setError('Place all ships before confirming');
      return;
    }

    this.gameState.setLoading(true);
    this.gameState.setError(null);

    const placements: ShipPlacement[] = this.ships()
      .filter((s) => s.placement)
      .map((s) => s.placement!);

    // Validate we have placements
    if (placements.length === 0) {
      this.gameState.setError('No placement data available');
      this.gameState.setLoading(false);
      return;
    }

    this.apiService.placeShips(this.gameId(), this.playerId(), placements).subscribe({
      next: (game) => {
        this.game.set(game);
        this.gameState.setGame(game);
        this.gameState.setLoading(false);

        // Check if we should navigate to play screen
        if (game.players[0]?.isReady && game.players[1]?.isReady) {
          this.router.navigate(['/game', this.gameId(), 'play']);
        }
      },
      error: (err) => {
        console.error('Error placing ships:', err);
        this.gameState.setError('Error placing ships');
        this.gameState.setLoading(false);
      },
    });
  }

  randomPlacement(): void {
    this.gameState.setLoading(true);
    this.gameState.setError(null);

    this.apiService.placeShipsRandom(this.gameId(), this.playerId()).subscribe({
      next: (game) => {
        this.game.set(game);
        this.gameState.setGame(game);
        this.gameState.setLoading(false);

        // Update local state to show ships as placed
        const player = game.players.find((p) => p?.id === this.playerId());
        if (player && player.board) {
          // Reconstruct board from server response
          this.board.set(player.board);

          // Mark all ships as placed
          const updatedShips = this.ships().map((ship) => ({
            ...ship,
            placed: true,
          }));
          this.ships.set(updatedShips);
        }

        // Check if we should navigate to play screen
        if (game.players[0]?.isReady && game.players[1]?.isReady) {
          this.router.navigate(['/game', this.gameId(), 'play']);
        }
      },
      error: (err) => {
        console.error('Error random placing ships:', err);
        this.gameState.setError('Error with random placement');
        this.gameState.setLoading(false);
      },
    });
  }

  getShipCells(size: number): number[] {
    return Array(size)
      .fill(0)
      .map((_, i) => i);
  }

  getPlacedShipsCount(): number {
    return this.ships().filter((s) => s.placed).length;
  }

  getTotalShipsCount(): number {
    return this.ships().length;
  }

  getOpponentPlayer(): Player | null {
    return this.game()?.players[1] || null;
  }

  getShipName(size: number): string {
    const shipNames: Record<number, string> = {
      1: 'Boat',
      2: 'Destroyer',
      3: 'Cruiser',
      4: 'Battleship',
      5: 'Carrier',
    };
    return shipNames[size] || `Ship (${size})`;
  }

  copyGameId(): void {
    if (this.game()) {
      navigator.clipboard.writeText(this.game()!.id).then(
        () => {
          console.log('Game ID copied to clipboard');
        },
        (err) => {
          console.error('Failed to copy game ID:', err);
        }
      );
    }
  }

  isPlayerReady(): boolean {
    const currentPlayer = this.game()?.players.find((p) => p?.id === this.playerId());
    return currentPlayer?.isReady || false;
  }
}
