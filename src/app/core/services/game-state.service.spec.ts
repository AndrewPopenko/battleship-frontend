import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CellState } from '../models/cell-state.enum';
import { GamePhase } from '../models/game-phase.enum';
import { GameState, Player } from '../models/game.model';
import { GameStateService } from './game-state.service';

describe('GameStateService', () => {
  let service: GameStateService;

  const createMockGame = (overrides?: Partial<GameState>): GameState => ({
    id: 'test',
    players: [
      {
        id: 'player1',
        name: 'Player 1',
        isReady: false,
        ships: [],
        board: Array(10).fill(Array(10).fill(CellState.EMPTY)),
      },
      null,
    ],
    phase: GamePhase.PLACING_SHIPS,
    turn: null,
    winner: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameStateService],
    });
    service = TestBed.inject(GameStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null values', () => {
    expect(service.game()).toBeNull();
    expect(service.currentPlayerId()).toBeNull();
    expect(service.currentPlayerName()).toBeNull();
    expect(service.errorMessage()).toBeNull();
    expect(service.loading()).toBe(false);
  });

  it('should set and get game state', () => {
    const mockGame: GameState = {
      id: 'test-game-id',
      players: [
        {
          id: 'player1',
          name: 'Player 1',
          isReady: false,
          ships: [],
          board: Array(10).fill(Array(10).fill(CellState.EMPTY)),
        },
        null,
      ],
      phase: GamePhase.PLACING_SHIPS,
      turn: null,
      winner: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    service.setGame(mockGame);
    expect(service.game()).toEqual(mockGame);
  });

  it('should set and get current player', () => {
    service.setCurrentPlayer('player1', 'Test Player');
    expect(service.currentPlayerId()).toBe('player1');
    expect(service.currentPlayerName()).toBe('Test Player');
  });

  it('should set and get error message', () => {
    service.setError('Test error');
    expect(service.errorMessage()).toBe('Test error');
  });

  it('should set and get loading state', () => {
    service.setLoading(true);
    expect(service.loading()).toBe(true);
    service.setLoading(false);
    expect(service.loading()).toBe(false);
  });

  it('should reset all state', () => {
    service.setGame(createMockGame());
    service.setCurrentPlayer('player1', 'Test');
    service.setError('Error');
    service.setLoading(true);

    service.reset();

    expect(service.game()).toBeNull();
    expect(service.currentPlayerId()).toBeNull();
    expect(service.currentPlayerName()).toBeNull();
    expect(service.errorMessage()).toBeNull();
    expect(service.loading()).toBe(false);
  });

  it('should return current player', () => {
    const player1: Player = {
      id: 'player1',
      name: 'Player 1',
      isReady: false,
      ships: [],
      board: Array(10).fill(Array(10).fill(CellState.EMPTY)),
    };

    service.setGame(createMockGame({ players: [player1, null] }));
    service.setCurrentPlayer('player1', 'Player 1');

    expect(service.getCurrentPlayer()).toEqual(player1);
  });

  it('should return opponent player', () => {
    const player1: Player = {
      id: 'player1',
      name: 'Player 1',
      isReady: false,
      ships: [],
      board: Array(10).fill(Array(10).fill(CellState.EMPTY)),
    };

    const player2: Player = {
      id: 'player2',
      name: 'Player 2',
      isReady: false,
      ships: [],
      board: Array(10).fill(Array(10).fill(CellState.EMPTY)),
    };

    service.setGame(createMockGame({ players: [player1, player2] }));
    service.setCurrentPlayer('player1', 'Player 1');

    expect(service.getOpponent()).toEqual(player2);
  });

  it('should check if game is ready', () => {
    const player1: Player = {
      id: 'player1',
      name: 'Player 1',
      isReady: false,
      ships: [],
      board: Array(10).fill(Array(10).fill(CellState.EMPTY)),
    };

    const player2: Player = {
      id: 'player2',
      name: 'Player 2',
      isReady: false,
      ships: [],
      board: Array(10).fill(Array(10).fill(CellState.EMPTY)),
    };

    service.setGame(createMockGame({ players: [player1, null] }));

    expect(service.isGameReady()).toBe(false);

    service.setGame(createMockGame({ players: [player1, player2] }));

    expect(service.isGameReady()).toBe(true);
  });

  it('should check if it is player turn', () => {
    service.setGame(
      createMockGame({
        players: [
          {
            id: 'player1',
            name: 'Player 1',
            isReady: true,
            ships: [],
            board: Array(10).fill(Array(10).fill(CellState.EMPTY)),
          },
          {
            id: 'player2',
            name: 'Player 2',
            isReady: true,
            ships: [],
            board: Array(10).fill(Array(10).fill(CellState.EMPTY)),
          },
        ],
        phase: GamePhase.IN_PROGRESS,
        turn: 'player1',
      })
    );
    service.setCurrentPlayer('player1', 'Player 1');

    expect(service.isMyTurn()).toBe(true);

    service.setGame(
      createMockGame({
        players: [
          {
            id: 'player1',
            name: 'Player 1',
            isReady: true,
            ships: [],
            board: Array(10).fill(Array(10).fill(CellState.EMPTY)),
          },
          {
            id: 'player2',
            name: 'Player 2',
            isReady: true,
            ships: [],
            board: Array(10).fill(Array(10).fill(CellState.EMPTY)),
          },
        ],
        phase: GamePhase.IN_PROGRESS,
        turn: 'player2',
      })
    );

    expect(service.isMyTurn()).toBe(false);
  });

  it('should check game phases', () => {
    service.setGame(createMockGame({ phase: GamePhase.PLACING_SHIPS }));

    expect(service.isPlacementPhase()).toBe(true);
    expect(service.isBattlePhase()).toBe(false);
    expect(service.isGameOver()).toBe(false);

    service.setGame(createMockGame({ phase: GamePhase.IN_PROGRESS }));

    expect(service.isPlacementPhase()).toBe(false);
    expect(service.isBattlePhase()).toBe(true);
    expect(service.isGameOver()).toBe(false);

    service.setGame(createMockGame({ phase: GamePhase.FINISHED, winner: 'player1' }));

    expect(service.isPlacementPhase()).toBe(false);
    expect(service.isBattlePhase()).toBe(false);
    expect(service.isGameOver()).toBe(true);
  });

  it('should get winner', () => {
    const player1: Player = {
      id: 'player1',
      name: 'Player 1',
      isReady: true,
      ships: [],
      board: Array(10).fill(Array(10).fill(CellState.EMPTY)),
    };

    service.setGame(
      createMockGame({ players: [player1, null], phase: GamePhase.FINISHED, winner: 'player1' })
    );

    expect(service.getWinner()).toEqual(player1);
  });

  it('should check if current player is winner', () => {
    service.setGame(createMockGame({ phase: GamePhase.FINISHED, winner: 'player1' }));
    service.setCurrentPlayer('player1', 'Player 1');

    expect(service.isWinner()).toBe(true);

    service.setCurrentPlayer('player2', 'Player 2');
    expect(service.isWinner()).toBe(false);
  });
});
