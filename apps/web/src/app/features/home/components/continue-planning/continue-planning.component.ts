import {
  Component,
  Input
} from '@angular/core';

import {
  JourneyTheme,
  JOURNEY_THEMES
} from '../../../../shared/models/journey-theme.model';

@Component({
  selector: 'app-continue-planning',
  standalone: true,
  imports: [],
  templateUrl: './continue-planning.component.html',
  styleUrl: './continue-planning.component.scss'
})
export class ContinuePlanningComponent {
  @Input()
  journey: JourneyTheme = JOURNEY_THEMES[0];

  get journeyMessage(): string {
    switch (this.journey.type) {
      case 'family':
        return 'Continue shaping a memorable trip everyone can enjoy.';

      case 'adventure':
        return 'Keep building your route through nature, movement, and discovery.';

      case 'food':
        return 'Continue exploring the flavors, neighborhoods, and stories of Japan.';

      case 'weekend':
      default:
        return 'Keep refining your next refreshing escape.';
    }
  }
}