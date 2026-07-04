import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
export const routes: Routes = [
  { path: '', redirectTo: 'rooms', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent), canActivate: [guestGuard] },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  { path: 'rooms', loadComponent: () => import('./pages/rooms/rooms.component').then((m) => m.RoomsComponent), canActivate: [authGuard] },
  { path: 'rooms/:id', loadComponent: () => import('./pages/chat/chat.component').then((m) => m.ChatComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: 'rooms' },
];
