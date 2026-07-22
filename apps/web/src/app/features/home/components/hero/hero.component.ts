import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges
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
export class HeroComponent implements OnChanges, OnDestroy {
  @Input()
  journey: JourneyTheme = JOURNEY_THEMES[0];

  previousJourney: JourneyTheme | null = null;
  isTransitioning: boolean = false;

  private transitionTimer:
    | ReturnType<typeof setTimeout>
    | null = null;

  private animationFrameId:
    | number
    | null = null;

  ngOnChanges(
    changes: SimpleChanges
  ): void {
    const journeyChange =
      changes['journey'];

    if (
      !journeyChange ||
      journeyChange.firstChange
    ) {
      return;
    }

    const previousJourney:
      | JourneyTheme
      | undefined =
      journeyChange.previousValue;

    if (
      !previousJourney ||
      previousJourney.type ===
        this.journey.type
    ) {
      return;
    }

    this._clearTransition();

    this.previousJourney =
      previousJourney;

    this.isTransitioning = false;

    this.animationFrameId =
      requestAnimationFrame((): void => {
        this.isTransitioning = true;
      });

    this.transitionTimer =
      setTimeout((): void => {
        this.previousJourney = null;
        this.isTransitioning = false;
        this.transitionTimer = null;
      }, 650);
  }

  ngOnDestroy(): void {
    this._clearTransition();
  }

  private _clearTransition(): void {
    if (this.transitionTimer) {
      clearTimeout(
        this.transitionTimer
      );

      this.transitionTimer = null;
    }

    if (
      this.animationFrameId !== null
    ) {
      cancelAnimationFrame(
        this.animationFrameId
      );

      this.animationFrameId = null;
    }
  }
}