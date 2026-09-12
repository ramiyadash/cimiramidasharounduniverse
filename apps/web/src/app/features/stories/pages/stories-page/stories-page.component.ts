import {
    Component
  } from '@angular/core';

  import {
    UniverseMapComponent
  } from '../../components/universe-map/universe-map.component';

  @Component({
    selector: 'app-stories-page',

    standalone: true,

    imports: [
      UniverseMapComponent
    ],

    templateUrl:
      './stories-page.component.html',

    styleUrl:
      './stories-page.component.scss'
  })
  export class StoriesPageComponent {}