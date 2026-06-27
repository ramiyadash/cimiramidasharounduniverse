import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { JourneyGridComponent } from '../../components/journey-grid/journey-grid.component';
import { ContinuePlanningComponent } from '../../components/continue-planning/continue-planning.component';
import { PlanningSessionComponent } from '../../components/planning-session/planning-session.component';
import { StoriesComponent } from '../../components/stories/stories.component';
import { JourneyTheme, JOURNEY_THEMES } from '../../../../shared/models/journey-theme.model';

@Component({
  selector: 'app-home-page',
  imports: [
    SidebarComponent,
    HeroComponent,
    JourneyGridComponent,
    ContinuePlanningComponent,
    PlanningSessionComponent,
    StoriesComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  selectedJourney: JourneyTheme = JOURNEY_THEMES[0];

  onJourneySelected(journey: JourneyTheme): void {
    this.selectedJourney = journey;
  }
}