import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { ClientToServerEvents, ServerToClientEvents, ShootResult } from '../models/events.model';
import { GameState } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  connect(): void {
    this.socket = io(environment.apiUrl, {
      transports: ['websocket'],
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
  }

  joinGame(gameId: string, playerId: string): void {
    this.socket?.emit('joinGame', { gameId, playerId });
  }

  shoot(x: number, y: number): void {
    this.socket?.emit('shoot', { x, y });
  }

  onGameUpdate(): Observable<GameState> {
    return new Observable((observer) => {
      this.socket?.on('gameUpdate', (game) => observer.next(game));
    });
  }

  onShootResult(): Observable<ShootResult> {
    return new Observable((observer) => {
      this.socket?.on('shootResult', (result) => observer.next(result));
    });
  }

  onPlayerJoined(): Observable<{ playerName: string; playerId: string }> {
    return new Observable((observer) => {
      this.socket?.on('playerJoined', (data) => observer.next(data));
    });
  }

  onGameOver(): Observable<{ winnerId: string; winnerName: string }> {
    return new Observable((observer) => {
      this.socket?.on('gameOver', (data) => observer.next(data));
    });
  }

  onError(): Observable<string> {
    return new Observable((observer) => {
      this.socket?.on('error', (message) => observer.next(message));
    });
  }
}
