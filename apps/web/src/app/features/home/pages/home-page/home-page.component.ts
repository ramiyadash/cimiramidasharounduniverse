import {
  Component,
  HostListener,
  ViewChild
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  JourneyTheme,
  JOURNEY_THEMES
} from '../../../../shared/models/journey-theme.model';


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
    FormsModule,
    HeroComponent,
    JourneyGridComponent,
    ContinuePlanningComponent,
    PlanningSessionComponent,
    StoriesComponent
  ],

  templateUrl:
    './home-page.component.html',

  styleUrl:
    './home-page.component.scss'
})
export class HomePageComponent {
  /**
   * Gives the sticky planner access to the same
   * planning conversation displayed farther down.
   */
  @ViewChild(
    PlanningSessionComponent
  )
  private planningSession?:
    PlanningSessionComponent;

  selectedJourney: JourneyTheme =
    JOURNEY_THEMES[0];

  isHeroSticky: boolean =
    false;

  stickyPlanningPrompt: string =
    '';

  get planningSessionBusy(): boolean {
    return (
      this.planningSession
        ?.isDashThinking === true
    );
  }

  get canSubmitStickyPlan(): boolean {
    return (
      this.stickyPlanningPrompt
        .trim()
        .length > 0 &&
      !this.planningSessionBusy
    );
  }

  onJourneySelected(
    journey: JourneyTheme
  ): void {
    this.selectedJourney =
      journey;
  }

  /**
   * Sends the sticky prompt through the existing
   * PlanningSessionComponent conversation.
   */
  submitStickyPlan(): void {
    const prompt: string =
      this.stickyPlanningPrompt
        .trim();

    if (
      !prompt ||
      !this.planningSession
    ) {
      return;
    }

    const accepted: boolean =
      this.planningSession
        .submitExternalMessage(
          prompt
        );

    if (!accepted) {
      return;
    }

    this.stickyPlanningPrompt =
      '';

    window.requestAnimationFrame(
      (): void => {
        document
          .getElementById(
            'planning-session'
          )
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
      }
    );
  }

  @HostListener(
    'window:scroll'
  )
  onWindowScroll(): void {
    const sticky: boolean =
      window.scrollY > 120;

    if (
      sticky ===
      this.isHeroSticky
    ) {
      return;
    }

    this.isHeroSticky =
      sticky;
  }
}