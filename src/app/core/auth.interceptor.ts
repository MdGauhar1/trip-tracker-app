import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { Preferences } from '@capacitor/preferences';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return from(
    Preferences.get({ key: 'trip_tracker_token' })
  ).pipe(
    switchMap(({ value }) => {
      if (value) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${value}`
          }
        });
      }

      return next(req);
    })
  );
};