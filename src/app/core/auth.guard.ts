import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.sessionReady$.pipe(

    // Wait until saved session restoration is complete
    filter(ready => ready),

    take(1),

    map(() => {

      if (authService.isLoggedIn()) {
        return true;
      }

      return router.createUrlTree(['/login']);

    })

  );
};