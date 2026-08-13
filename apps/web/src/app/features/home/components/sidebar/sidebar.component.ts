import {
  Component,
  EventEmitter,
  Output
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink,
    RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

  /**
   * Used by the mobile drawer so the parent page
   * can close the menu after an option is selected.
   */
  @Output()
  navigationSelected:
    EventEmitter<void> =
    new EventEmitter<void>();

  selectNavigationItem(): void {
    this.navigationSelected.emit();
  }
}