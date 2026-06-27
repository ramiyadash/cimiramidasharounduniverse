import { Component, Input } from '@angular/core';
import { JourneyTheme } from '../../../../shared/models/journey-theme.model';

@Component({
  selector: 'app-planning-session',
  imports: [],
  templateUrl: './planning-session.component.html',
  styleUrl: './planning-session.component.scss'
})
export class PlanningSessionComponent {
  @Input() journey!: JourneyTheme;
}