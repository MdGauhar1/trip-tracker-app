
import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  userId: number;
  name: string;
  email: string;
}

export interface AuthUser {
  userId: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8801/api/auth';
  private readonly tokenKey = 'trip_tracker_token';
  private readonly userKey = 'trip_tracker_user';

  private readonly currentUserSubject =
    new BehaviorSubject<AuthUser | null>(null);

  readonly currentUser$ = this.currentUserSubject.asObservable();

  private readonly sessionReadySubject =
    new BehaviorSubject<boolean>(false);

  readonly sessionReady$ = this.sessionReadySubject.asObservable();

  constructor(
    private http: HttpClient,
    private zone: NgZone
  ) {
    void this.restoreSession();
  }

  register(data: RegisterRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        switchMap(response =>
          from(this.saveSession(response)).pipe(
            map(() => response)
          )
        )
      );
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, data)
      .pipe(
        switchMap(response =>
          from(this.saveSession(response)).pipe(
            map(() => response)
          )
        )
      );
  }

  private async saveSession(
    response: LoginResponse
  ): Promise<void> {
    if (!response?.token || response.userId == null) {
      throw new Error(
        'The server response does not contain a valid token or user ID.'
      );
    }

    const user: AuthUser = {
      userId: response.userId,
      name: response.name ?? '',
      email: response.email ?? ''
    };

    // Save both values before publishing the authenticated state.
    await Preferences.set({
      key: this.tokenKey,
      value: response.token
    });

    await Preferences.set({
      key: this.userKey,
      value: JSON.stringify(user)
    });

    this.zone.run(() => {
      this.currentUserSubject.next(user);
      this.sessionReadySubject.next(true);
    });
  }

  private async restoreSession(): Promise<void> {
    try {
      const [tokenResult, userResult] = await Promise.all([
        Preferences.get({ key: this.tokenKey }),
        Preferences.get({ key: this.userKey })
      ]);

      const token = tokenResult.value;
      const userJson = userResult.value;

      if (!token || !userJson) {
        await this.clearStoredSession();

        this.zone.run(() => {
          this.currentUserSubject.next(null);
        });

        return;
      }

      let user: AuthUser;

      try {
        user = JSON.parse(userJson) as AuthUser;
      } catch {
        await this.clearStoredSession();

        this.zone.run(() => {
          this.currentUserSubject.next(null);
        });

        return;
      }

      if (
        !user ||
        user.userId == null ||
        typeof user.name !== 'string' ||
        typeof user.email !== 'string'
      ) {
        await this.clearStoredSession();

        this.zone.run(() => {
          this.currentUserSubject.next(null);
        });

        return;
      }

      // Restore the saved user after a browser refresh.
      this.zone.run(() => {
        this.currentUserSubject.next(user);
      });

      console.log('[AuthService] Session restored.');
    } catch (error) {
      console.error(
        '[AuthService] Unable to restore session:',
        error
      );

      try {
        await this.clearStoredSession();
      } catch (clearError) {
        console.error(
          '[AuthService] Unable to clear invalid session:',
          clearError
        );
      }

      this.zone.run(() => {
        this.currentUserSubject.next(null);
      });
    } finally {
      // Always release the UI, even when no session exists.
      this.zone.run(() => {
        this.sessionReadySubject.next(true);
      });
    }
  }

  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({
      key: this.tokenKey
    });

    return value;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  async logout(): Promise<void> {
    await this.clearStoredSession();

    this.zone.run(() => {
      this.currentUserSubject.next(null);
      this.sessionReadySubject.next(true);
    });
  }

  private async clearStoredSession(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: this.tokenKey }),
      Preferences.remove({ key: this.userKey })
    ]);
  }
}







// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// export interface RegisterRequest {
//   name: string;
//   email: string;
//   password: string;
// }

// export interface RegisterResponse {
//   id: number;
//   name: string;
//   email: string;
//   message: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {

//   private readonly apiUrl = 'http://localhost:8801/api/auth';

//   constructor(private http: HttpClient) {}

//   register(data: RegisterRequest): Observable<RegisterResponse> {
//     return this.http.post<RegisterResponse>(
//       `${this.apiUrl}/register`,
//       data
//     );
//   }
// }
