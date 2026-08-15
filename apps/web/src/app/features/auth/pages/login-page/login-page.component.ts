import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  signal
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  AuthService
} from '../../../../core/services/auth.service';

import {
  environment
} from '../../../../../environments/environment';

@Component({
  selector: 'app-login-page',

  imports: [],

  templateUrl:
    './login-page.component.html',

  styleUrl:
    './login-page.component.scss'
})
export class LoginPageComponent
  implements AfterViewInit, OnDestroy {

  @ViewChild(
    'googleButton',
    {
      static: true
    }
  )
  googleButton!:
    ElementRef<HTMLDivElement>;

  readonly isSigningIn =
    signal(false);

  readonly errorMessage =
    signal<string | null>(
      null
    );

  private googleLoadTimer?:
    ReturnType<typeof setTimeout>;

  constructor(
    private readonly authService:
      AuthService,

    private readonly router:
      Router,

    private readonly zone:
      NgZone
  ) {}

  ngAfterViewInit(): void {
    this.renderGoogleButton();
  }

  ngOnDestroy(): void {
    if (this.googleLoadTimer) {
      clearTimeout(
        this.googleLoadTimer
      );
    }
  }

  /**
   * The Google script loads asynchronously.
   * Wait briefly if Angular finishes rendering
   * before Google Identity Services is ready.
   */
  private renderGoogleButton(
    attempt = 0
  ): void {
    const googleIdentity =
      window.google?.accounts?.id;

    if (!googleIdentity) {
      if (attempt >= 50) {
        this.errorMessage.set(
          'Google Sign-In could not be loaded.'
        );

        return;
      }

      this.googleLoadTimer =
        setTimeout(
          () => {
            this.renderGoogleButton(
              attempt + 1
            );
          },
          100
        );

      return;
    }

    googleIdentity.initialize({
      client_id:
        environment.googleClientId,

      callback:
        response => {
          /**
           * Google invokes this callback outside
           * Angular, so return to Angular's zone.
           */
          this.zone.run(
            () => {
              this.handleGoogleCredential(
                response.credential
              );
            }
          );
        }
    });

    this.googleButton
      .nativeElement
      .replaceChildren();

    googleIdentity.renderButton(
      this.googleButton.nativeElement,

      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 320
      }
    );
  }

  private handleGoogleCredential(
    credential: string
  ): void {
    this.isSigningIn.set(
      true
    );

    this.errorMessage.set(
      null
    );

    this.authService
      .loginWithGoogle(
        credential
      )
      .subscribe({
        next: () => {
          this.isSigningIn.set(
            false
          );

          this.router.navigateByUrl(
            '/'
          );
        },

        error: (
          error: HttpErrorResponse
        ) => {
          this.isSigningIn.set(
            false
          );

          this.errorMessage.set(
            error.error?.message ||
            'Google Sign-In failed. Please try again.'
          );
        }
      });
  }
}