import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipPlacementComponent } from './ship-placement.component';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { of, Subject } from 'rxjs';
import { GameState } from '../../core/models/game.model';
import { CellState } from '../../core/models/cell-state.enum';
import { GamePhase } from '../../core/models/game-phase.enum';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ShipPlacementComponent', () => {
  let component: ShipPlacementComponent;
  let fixture: ComponentFixture<ShipPlacementComponent>;
  let mockApiService: Partial<ApiService>;
  let mockWebSocketService: Partial<WebSocketService>;

  const mockGameState: GameState = {
    id: 'test-game-id',
    players: [
      {
        id: 'player-1',
        name: 'Player 1',
        board: Array(10).fill(null).map(() => Array(10).fill(CellState.EMPTY)),
        ships: [
          { id: 'ship-1', size: 4, hits: 0 },
          { id: 'ship-2', size: 3, hits: 0 },
          { id: 'ship-3', size: 3, hits: 0 },
          { id: 'ship-4', size: 2, hits: 0 },
          { id: 'ship-5', size: 2, hits: 0 },
          { id: 'ship-6', size: 2, hits: 0 },
          { id: 'ship-7', size: 1, hits: 0 },
          { id: 'ship-8', size: 1, hits: 0 },
          { id: 'ship-9', size: 1, hits: 0 },
          { id: 'ship-10', size: 1, hits: 0 },
        ],
        isReady: false,
      },
      null,
    ],
    phase: GamePhase.PLACING_SHIPS,
    turn: null,
    winner: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(async () => {
    mockApiService = {
      getGame: vi.fn().mockReturnValue(of(mockGameState)),
      placeShips: vi.fn().mockReturnValue(of(mockGameState)),
      placeShipsRandom: vi.fn().mockReturnValue(of(mockGameState)),
    };

    mockWebSocketService = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      onGameUpdate: vi.fn().mockReturnValue(of(mockGameState)),
      joinGame: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ShipPlacementComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: mockApiService },
        { provide: WebSocketService, useValue: mockWebSocketService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShipPlacementComponent);
    component = fixture.componentInstance;
    component.gameId = signal('test-game-id');
    component.playerId = signal('player-1');
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should load game on initialization', () => {
    fixture.detectChanges();
    expect(mockApiService.getGame).toHaveBeenCalledWith('test-game-id');
  });

  it('should initialize with 10 ships', () => {
    fixture.detectChanges();
    expect(component.ships().length).toBe(10);
  });

  it('should call placeShipsRandom API when random placement is requested', () => {
    fixture.detectChanges();
    component.randomPlacement();
    expect(mockApiService.placeShipsRandom).toHaveBeenCalledWith('test-game-id', 'player-1');
  });

  it('should have correct distribution of ship sizes', () => {
    fixture.detectChanges();
    const ships = component.ships();
    const sizeCounts = new Map<number, number>();
    ships.forEach((ship) => {
      sizeCounts.set(ship.size, (sizeCounts.get(ship.size) || 0) + 1);
    });
    // 1 battleship (size 4), 2 cruisers (size 3), 3 destroyers (size 2), 4 submarines (size 1)
    expect(sizeCounts.get(4)).toBe(1);
    expect(sizeCounts.get(3)).toBe(2);
    expect(sizeCounts.get(2)).toBe(3);
    expect(sizeCounts.get(1)).toBe(4);
  });

  it('should provide ship names via translation keys', () => {
    fixture.detectChanges();
    expect(component.getShipName(4)).toBe('Battleship');
    expect(component.getShipName(3)).toBe('Cruiser');
    expect(component.getShipName(2)).toBe('Destroyer');
    expect(component.getShipName(1)).toBe('Submarine');
  });
});
