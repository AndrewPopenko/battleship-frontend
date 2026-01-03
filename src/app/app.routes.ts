import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/lobby', pathMatch: 'full' },
  {
    path: 'lobby',
    loadComponent: () => import('./features/lobby/lobby.component').then((m) => m.LobbyComponent),
  },
  {
    path: 'game/:id/setup',
    loadComponent: () =>
      import('./features/ship-placement/ship-placement.component').then(
        (m) => m.ShipPlacementComponent
      ),
  },
  {
    path: 'game/:id/play',
    loadComponent: () =>
      import('./features/game-board/game-board.component').then((m) => m.GameBoardComponent),
  },
];
