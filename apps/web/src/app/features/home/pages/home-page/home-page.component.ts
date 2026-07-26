import {
  Component,
  HostListener
} from '@angular/core';

import {
  JourneyTheme,
  JOURNEY_THEMES
} from '../../../../shared/models/journey-theme.model';

import {
  SidebarComponent
} from '../../components/sidebar/sidebar.component';

import {
  HeroComponent
} from '../../components/hero/hero.component';

import {
  JourneyGridComponent
} from '../../components/journey-grid/journey-grid.component';

import {
  ContinuePlanningComponent
} from '../../components/continue-planning/continue-planning.component';

import {
  PlanningSessionComponent
} from '../../components/planning-session/planning-session.component';

import {
  StoriesComponent
} from '../../components/stories/stories.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
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

  selectedJourney: JourneyTheme =
    JOURNEY_THEMES[0];

  isHeroSticky: boolean = false;

  onJourneySelected(
    journey: JourneyTheme
  ): void {
    this.selectedJourney = journey;
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const sticky: boolean =
      window.scrollY > 120;

    if (
      sticky === this.isHeroSticky
    ) {
      return;
    }

    this.isHeroSticky = sticky;
  }
}