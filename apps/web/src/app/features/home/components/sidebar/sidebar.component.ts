import {
  Component,
  EventEmitter,
  Output,
  inject,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  AuthService
} from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',

  standalone: true,

  imports: [
    RouterLink,
    RouterLinkActive
  ],

  templateUrl:
    './sidebar.component.html',

  styleUrl:
    './sidebar.component.scss'
})
export class SidebarComponent {

  /**
   * inject() initializes these dependencies before
   * the fields below attempt to use them.
   */
  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);

  /**
   * Signal exposed to the HTML template.
   */
  readonly currentUser =
    this.authService.currentUser;

  @Output()
  navigationSelected:
    EventEmitter<void> =
    new EventEmitter<void>();

  selectNavigationItem(): void {
    this.navigationSelected.emit();
  }

    /**
   * Remembers an avatar URL that failed so the
   * template can display the initial instead.
   */
  readonly failedAvatarUrl =
  signal<string | null>(
    null
  );

  handleAvatarError(
  avatarUrl: string
  ): void {
  this.failedAvatarUrl.set(
    avatarUrl
  );
  }

  logout(): void {
    this.authService
      .logout()
      .subscribe({
        next: () => {
          this.selectNavigationItem();

          this.router.navigateByUrl(
            '/login'
          );
        },

        error: error => {
          console.error(
            'Logout failed:',
            error
          );
        }
      });
  }
}