import {
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  Router
} from '@angular/router';

import {
  finalize
} from 'rxjs';

import {
  DiscoverDestination,
  DiscoverService
} from '../../../../core/services/discover.service';

type DiscoverStyle =
  | 'all'
  | 'weekend'
  | 'family'
  | 'adventure'
  | 'food';

interface DiscoverStyleFilter {
  value: DiscoverStyle;
  label: string;
  emoji: string;
}

@Component({
  selector:
    'app-discover-page',

  standalone: true,

  imports: [],

  templateUrl:
    './discover-page.component.html',

  styleUrl:
    './discover-page.component.scss'
})
export class DiscoverPageComponent
  implements OnInit {

  private readonly discoverService =
    inject(DiscoverService);

  private readonly router =
    inject(Router);

  readonly destinations =
    signal<DiscoverDestination[]>(
      []
    );

  readonly personalized =
    signal(false);

  readonly isLoading =
    signal(true);

  readonly errorMessage =
    signal<string | null>(
      null
    );

  readonly successMessage =
    signal<string | null>(
      null
    );

  readonly activeStyle =
    signal<DiscoverStyle>(
      'all'
    );

  readonly savingDestinationIds =
    signal<ReadonlySet<string>>(
      new Set<string>()
    );

  readonly styleFilters:
    DiscoverStyleFilter[] = [
      {
        value: 'all',
        label: 'For you',
        emoji: '✨'
      },
      {
        value: 'weekend',
        label: 'Weekend',
        emoji: '🌅'
      },
      {
        value: 'family',
        label: 'Family',
        emoji: '👨‍👩‍👧'
      },
      {
        value: 'adventure',
        label: 'Adventure',
        emoji: '🥾'
      },
      {
        value: 'food',
        label: 'Food',
        emoji: '🍽️'
      }
    ];

  ngOnInit(): void {
    this.loadDestinations();
  }

  setStyle(
    style: DiscoverStyle
  ): void {
    if (
      this.activeStyle() ===
        style &&
      this.destinations().length
    ) {
      return;
    }

    this.activeStyle.set(
      style
    );

    this.successMessage.set(
      null
    );

    this.loadDestinations();
  }

  retry(): void {
    this.loadDestinations();
  }

  isSaving(
    destinationId: string
  ): boolean {
    return this
      .savingDestinationIds()
      .has(destinationId);
  }

  saveDestination(
    destination:
      DiscoverDestination
  ): void {
    if (destination.isSaved) {
      this.viewUniverse();

      return;
    }

    this.errorMessage.set(
      null
    );

    this.successMessage.set(
      null
    );

    this.updateSavingState(
      destination.id,
      true
    );

    this.discoverService
      .saveToUniverse(
        destination.id
      )
      .pipe(
        finalize(
          () => {
            this.updateSavingState(
              destination.id,
              false
            );
          }
        )
      )
      .subscribe({
        next: response => {
          this.destinations.update(
            destinations =>
              destinations.map(
                currentDestination => {
                  if (
                    currentDestination.id !==
                    destination.id
                  ) {
                    return currentDestination;
                  }

                  return {
                    ...currentDestination,

                    isSaved:
                      true,

                    savedJourneyId:
                      response.journeyId
                  };
                }
              )
          );

          this.successMessage.set(
            response.message
          );
        },

        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Unable to save destination:',
            error
          );

          this.errorMessage.set(
            error.error?.message ||
            'This destination could not be added to your Universe.'
          );
        }
      });
  }

  viewUniverse(): void {
    this.router.navigateByUrl(
      '/profile'
    );
  }

  formatTag(
    value: string
  ): string {
    if (!value) {
      return '';
    }

    return value
      .replace(
        /-/g,
        ' '
      )
      .replace(
        /\b\w/g,
        character =>
          character.toUpperCase()
      );
  }

  durationLabel(
    destination:
      DiscoverDestination
  ): string {
    const {
      min,
      max
    } =
      destination.discovery
        .durationDays;

    if (
      min !== null &&
      max !== null
    ) {
      if (min === max) {
        return `${min} days`;
      }

      return `${min}–${max} days`;
    }

    if (min !== null) {
      return `${min}+ days`;
    }

    return 'Flexible';
  }

  private loadDestinations(): void {
    this.isLoading.set(
      true
    );

    this.errorMessage.set(
      null
    );

    const selectedStyle =
      this.activeStyle();

    this.discoverService
      .getDestinations({
        style:
          selectedStyle === 'all'
            ? null
            : selectedStyle,

        limit:
          24
      })
      .pipe(
        finalize(
          () => {
            this.isLoading.set(
              false
            );
          }
        )
      )
      .subscribe({
        next: response => {
          this.destinations.set(
            response.destinations
          );

          this.personalized.set(
            response.personalized
          );
        },

        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Unable to load Discover:',
            error
          );

          this.destinations.set(
            []
          );

          this.errorMessage.set(
            error.error?.message ||
            'Destination ideas could not be loaded.'
          );
        }
      });
  }

  private updateSavingState(
    destinationId: string,
    isSaving: boolean
  ): void {
    const updatedIds =
      new Set(
        this.savingDestinationIds()
      );

    if (isSaving) {
      updatedIds.add(
        destinationId
      );
    } else {
      updatedIds.delete(
        destinationId
      );
    }

    this.savingDestinationIds.set(
      updatedIds
    );
  }
}