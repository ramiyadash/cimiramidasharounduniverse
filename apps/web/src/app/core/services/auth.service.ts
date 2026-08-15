import {
  Injectable,
  signal
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  tap
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

export interface AuthenticatedUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

interface AuthenticationResponse {
  user: AuthenticatedUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authUrl =
    `${environment.apiUrl}/auth`;

  /**
   * Holds the signed-in user for the current
   * Angular application session.
   */
  readonly currentUser =
    signal<AuthenticatedUser | null>(
      null
    );

  constructor(
    private readonly http:
      HttpClient
  ) {}

  /**
   * Sends Google's ID token to our backend.
   *
   * The backend verifies the token and creates
   * the HttpOnly Dash session cookie.
   */
  loginWithGoogle(
    credential: string
  ): Observable<AuthenticationResponse> {
    return this.http.post<AuthenticationResponse>(
      `${this.authUrl}/google`,

      {
        credential
      },

      {
        withCredentials: true
      }
    ).pipe(
      tap(
        response => {
          this.currentUser.set(
            response.user
          );
        }
      )
    );
  }

  /**
   * Restores the user from the backend session
   * when the browser refreshes.
   */
  restoreSession():
    Observable<AuthenticationResponse> {
    return this.http.get<AuthenticationResponse>(
      `${this.authUrl}/me`,

      {
        withCredentials: true
      }
    ).pipe(
      tap(
        response => {
          this.currentUser.set(
            response.user
          );
        }
      )
    );
  }

  logout(): Observable<{
    message: string;
  }> {
    return this.http.post<{
      message: string;
    }>(
      `${this.authUrl}/logout`,

      {},

      {
        withCredentials: true
      }
    ).pipe(
      tap(
        () => {
          this.currentUser.set(
            null
          );

          window.google
            ?.accounts
            .id
            .disableAutoSelect();
        }
      )
    );
  }
}