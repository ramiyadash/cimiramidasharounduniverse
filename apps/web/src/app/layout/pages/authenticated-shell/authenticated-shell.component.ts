import {
  Component,
  HostListener
} from '@angular/core';

import {
  RouterOutlet
} from '@angular/router';

import {
  SidebarComponent
} from '../../../features/home/components/sidebar/sidebar.component';

@Component({
  selector:
    'app-authenticated-shell',

  standalone: true,

  imports: [
    RouterOutlet,
    SidebarComponent
  ],

  templateUrl:
    './authenticated-shell.component.html',

  styleUrl:
    './authenticated-shell.component.scss'
})
export class AuthenticatedShellComponent {
  isMobileMenuOpen: boolean =
    false;

  openMobileMenu(): void {
    this.isMobileMenuOpen =
      true;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen =
      false;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen =
      !this.isMobileMenuOpen;
  }

  @HostListener(
    'document:keydown.escape'
  )
  onEscapeKey(): void {
    this.closeMobileMenu();
  }
}