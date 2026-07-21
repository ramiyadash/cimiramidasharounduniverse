import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import {
  JourneyTheme,
  JOURNEY_THEMES
} from '../../../../shared/models/journey-theme.model';

@Component({
  selector: 'app-journey-grid',
  standalone: true,
  imports: [],
  templateUrl: './journey-grid.component.html',
  styleUrl: './journey-grid.component.scss'
})
export class JourneyGridComponent {
  @Input()
  selectedJourney: JourneyTheme | null = null;

  @Output()
  readonly journeySelected = new EventEmitter<JourneyTheme>();

  readonly journeys: JourneyTheme[] = JOURNEY_THEMES;

  selectJourney(journey: JourneyTheme): void {
      this.journeySelected.emit(journey);
  }
}