import {
  Component
} from '@angular/core';

import {
  UniverseMapComponent
} from '../../components/universe-map/universe-map.component';

@Component({
  selector: 'app-profile-page',

  imports: [
    UniverseMapComponent
  ],

  templateUrl:
    './profile-page.component.html',

  styleUrl:
    './profile-page.component.scss'
})
export class ProfilePageComponent {}