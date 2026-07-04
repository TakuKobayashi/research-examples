import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return toObservable(auth.loading).pipe(
    filter((l) => !l),
    take(1),
    map(() => !auth.isLoggedIn() || router.createUrlTree(['/rooms'])),
  );
};
