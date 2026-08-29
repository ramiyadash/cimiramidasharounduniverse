import {
  Component,
  signal
} from '@angular/core';

import {
  UniverseMapComponent
} from '../../components/universe-map/universe-map.component';

import {
  TravelerDnaComponent
} from '../../components/traveler-dna/traveler-dna.component';

type ProfileSection =
  | 'universe'
  | 'dna';

@Component({
  selector:
    'app-profile-page',

  standalone: true,

  imports: [
    UniverseMapComponent,
    TravelerDnaComponent
  ],

  templateUrl:
    './profile-page.component.html',

  styleUrl:
    './profile-page.component.scss'
})
export class ProfilePageComponent {
  readonly activeSection =
    signal<ProfileSection>(
      'universe'
    );

  showSection(
    section: ProfileSection
  ): void {
    this.activeSection.set(
      section
    );
  }
}