import { Component, EventEmitter, Output } from '@angular/core';
import { JourneyTheme, JOURNEY_THEMES } from '../../../../shared/models/journey-theme.model';

@Component({
  selector: 'app-journey-grid',
  imports: [],
  templateUrl: './journey-grid.component.html',
  styleUrl: './journey-grid.component.scss'
})
export class JourneyGridComponent {
  @Output() journeySelected = new EventEmitter<JourneyTheme>();

  journeys = JOURNEY_THEMES;
  selectedType: string | null = null;

  selectJourney(journey: JourneyTheme): void {
    this.selectedType = journey.type;
    this.journeySelected.emit(journey);
  }
}