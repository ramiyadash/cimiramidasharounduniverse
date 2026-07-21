import {
  Component,
  Input
} from '@angular/core';

import {
  JourneyTheme,
  JOURNEY_THEMES
} from '../../../../shared/models/journey-theme.model';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent {
  @Input()
  journey: JourneyTheme = JOURNEY_THEMES[0];
}