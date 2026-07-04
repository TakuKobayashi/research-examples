// apps/gather-frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/world/world.component').then(m => m.WorldComponent),
  },
  // 今後 pages/ 以下に追加するページはここに追記する
  // 例:
  // {
  //   path: 'lobby',
  //   loadComponent: () =>
  //     import('./pages/lobby/lobby.component').then(m => m.LobbyComponent),
  // },
];
