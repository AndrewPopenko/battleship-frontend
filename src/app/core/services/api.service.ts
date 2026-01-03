import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GameState } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createGame(playerName: string): Observable<GameState> {
    return this.http.post<GameState>(`${this.baseUrl}/game`, { playerName });
  }

  joinGame(gameId: string, playerName: string): Observable<GameState> {
    return this.http.post<GameState>(`${this.baseUrl}/game/join`, {
      gameId,
      playerName,
    });
  }

  getGame(gameId: string): Observable<GameState> {
    return this.http.get<GameState>(`${this.baseUrl}/game/${gameId}`);
  }

  placeShips(
    gameId: string,
    playerId: string,
    placements: Array<{
      shipId: string;
      x: number;
      y: number;
      orientation: 'horizontal' | 'vertical';
    }>
  ): Observable<GameState> {
    return this.http.post<GameState>(`${this.baseUrl}/game/${gameId}/place-ships`, {
      playerId,
      placements,
    });
  }

  placeShipsRandom(gameId: string, playerId: string): Observable<GameState> {
    return this.http.post<GameState>(`${this.baseUrl}/game/${gameId}/place-ships-random`, {
      playerId,
    });
  }
}
