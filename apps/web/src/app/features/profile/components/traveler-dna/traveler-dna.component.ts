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
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  finalize
} from 'rxjs';

import {
  TravelerDNA,
  TravelerProfileService
} from '../../../../core/services/traveler-profile.service';

type PreferenceControlName =
  | 'preferredTerrains'
  | 'preferredActivities'
  | 'preferredWeather'
  | 'preferredTravelStyles';

interface PreferenceOption {
  value: string;
  label: string;
  emoji: string;
}

@Component({
  selector:
    'app-traveler-dna',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './traveler-dna.component.html',

  styleUrl:
    './traveler-dna.component.scss'
})
export class TravelerDnaComponent
  implements OnInit {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly profileService =
    inject(TravelerProfileService);

  private readonly router =
    inject(Router);

  readonly isLoading =
    signal(true);

  readonly isSaving =
    signal(false);

  readonly personalized =
    signal(false);

  readonly errorMessage =
    signal<string | null>(
      null
    );

  readonly successMessage =
    signal<string | null>(
      null
    );

  readonly terrainOptions:
    PreferenceOption[] = [
      {
        value: 'water',
        label: 'Water',
        emoji: '💧'
      },
      {
        value: 'coast',
        label: 'Coast',
        emoji: '🌊'
      },
      {
        value: 'beach',
        label: 'Beach',
        emoji: '🏖️'
      },
      {
        value: 'mountains',
        label: 'Mountains',
        emoji: '⛰️'
      },
      {
        value: 'forest',
        label: 'Forest',
        emoji: '🌲'
      },
      {
        value: 'waterfalls',
        label: 'Waterfalls',
        emoji: '💦'
      },
      {
        value: 'city',
        label: 'City',
        emoji: '🌆'
      },
      {
        value: 'parks',
        label: 'Parks',
        emoji: '🌳'
      },
      {
        value: 'desert',
        label: 'Desert',
        emoji: '🏜️'
      },
      {
        value: 'countryside',
        label: 'Countryside',
        emoji: '🌾'
      },
      {
        value: 'islands',
        label: 'Islands',
        emoji: '🏝️'
      }
    ];

  readonly activityOptions:
    PreferenceOption[] = [
      {
        value: 'hiking',
        label: 'Hiking',
        emoji: '🥾'
      },
      {
        value: 'food',
        label: 'Food',
        emoji: '🍽️'
      },
      {
        value: 'history',
        label: 'History',
        emoji: '🏛️'
      },
      {
        value: 'walking',
        label: 'Walking',
        emoji: '🚶'
      },
      {
        value: 'beach',
        label: 'Beach time',
        emoji: '☀️'
      },
      {
        value: 'nightlife',
        label: 'Nightlife',
        emoji: '🌙'
      },
      {
        value: 'art',
        label: 'Art',
        emoji: '🎨'
      },
      {
        value: 'nature',
        label: 'Nature',
        emoji: '🍃'
      },
      {
        value: 'adventure',
        label: 'Adventure',
        emoji: '🧗'
      },
      {
        value: 'shopping',
        label: 'Shopping',
        emoji: '🛍️'
      },
      {
        value: 'music',
        label: 'Music',
        emoji: '🎵'
      },
      {
        value: 'wellness',
        label: 'Wellness',
        emoji: '🧘'
      }
    ];

  readonly weatherOptions:
    PreferenceOption[] = [
      {
        value: 'warm',
        label: 'Warm',
        emoji: '☀️'
      },
      {
        value: 'mild',
        label: 'Mild',
        emoji: '🌤️'
      },
      {
        value: 'cool',
        label: 'Cool',
        emoji: '🍂'
      },
      {
        value: 'cold',
        label: 'Cold',
        emoji: '❄️'
      },
      {
        value: 'tropical',
        label: 'Tropical',
        emoji: '🌴'
      },
      {
        value: 'dry',
        label: 'Dry',
        emoji: '🌵'
      }
    ];

  readonly styleOptions:
    PreferenceOption[] = [
      {
        value: 'weekend',
        label: 'Weekend escape',
        emoji: '🌅'
      },
      {
        value: 'family',
        label: 'Family journey',
        emoji: '👨‍👩‍👧'
      },
      {
        value: 'adventure',
        label: 'Adventure',
        emoji: '🧭'
      },
      {
        value: 'food',
        label: 'Food journey',
        emoji: '🍜'
      }
    ];

  readonly form =
    this.formBuilder.group({
      preferredTerrains:
        this.formBuilder
          .nonNullable
          .control<string[]>(
            []
          ),

      preferredActivities:
        this.formBuilder
          .nonNullable
          .control<string[]>(
            []
          ),

      preferredWeather:
        this.formBuilder
          .nonNullable
          .control<string[]>(
            []
          ),

      preferredTravelStyles:
        this.formBuilder
          .nonNullable
          .control<string[]>(
            []
          ),

      minimumBudget:
        this.formBuilder
          .control<number | null>(
            null,
            [
              Validators.min(0),
              Validators.max(100000)
            ]
          ),

      maximumBudget:
        this.formBuilder
          .control<number | null>(
            null,
            [
              Validators.min(0),
              Validators.max(100000)
            ]
          ),

      typicalTripDurationDays:
        this.formBuilder
          .control<number | null>(
            null,
            [
              Validators.min(1),
              Validators.max(365)
            ]
          )
    });

  ngOnInit(): void {
    this.loadTravelerDNA();
  }

  isSelected(
    controlName:
      PreferenceControlName,
    value: string
  ): boolean {
    return this.form
      .controls[controlName]
      .value
      .includes(value);
  }

  togglePreference(
    controlName:
      PreferenceControlName,
    value: string
  ): void {
    const control =
      this.form.controls[
        controlName
      ];

    const currentValues =
      control.value;

    const updatedValues =
      currentValues.includes(
        value
      )
        ? currentValues.filter(
            currentValue =>
              currentValue !==
              value
          )
        : [
            ...currentValues,
            value
          ];

    control.setValue(
      updatedValues
    );

    control.markAsDirty();

    this.successMessage.set(
      null
    );
  }

  selectedPreferenceCount(): number {
    return (
      this.form.controls
        .preferredTerrains
        .value.length +
      this.form.controls
        .preferredActivities
        .value.length +
      this.form.controls
        .preferredWeather
        .value.length +
      this.form.controls
        .preferredTravelStyles
        .value.length
    );
  }

  save(): void {
    this.errorMessage.set(
      null
    );

    this.successMessage.set(
      null
    );

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.errorMessage.set(
        'Check the budget and trip duration values.'
      );

      return;
    }

    const formValue =
      this.form.getRawValue();

    if (
      formValue.minimumBudget !==
        null &&
      formValue.maximumBudget !==
        null &&
      formValue.minimumBudget >
        formValue.maximumBudget
    ) {
      this.errorMessage.set(
        'Minimum budget cannot exceed maximum budget.'
      );

      return;
    }

    const travelerDNA:
      TravelerDNA = {
        preferredTerrains:
          formValue
            .preferredTerrains,

        preferredActivities:
          formValue
            .preferredActivities,

        preferredWeather:
          formValue
            .preferredWeather,

        preferredTravelStyles:
          formValue
            .preferredTravelStyles,

        typicalBudgetRange: {
          min:
            formValue
              .minimumBudget,

          max:
            formValue
              .maximumBudget
        },

        typicalTripDurationDays:
          formValue
            .typicalTripDurationDays
      };

    this.isSaving.set(
      true
    );

    this.profileService
      .updateTravelerProfile(
        travelerDNA
      )
      .pipe(
        finalize(
          () => {
            this.isSaving.set(
              false
            );
          }
        )
      )
      .subscribe({
        next: response => {
          this.personalized.set(
            response.personalized
          );

          this.successMessage.set(
            response.message
          );

          this.form.markAsPristine();
        },

        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Unable to save Traveler DNA:',
            error
          );

          this.errorMessage.set(
            error.error?.message ||
            'Your Traveler DNA could not be saved.'
          );
        }
      });
  }

  openDiscover(): void {
    this.router.navigateByUrl(
      '/discover'
    );
  }

  private loadTravelerDNA(): void {
    this.isLoading.set(
      true
    );

    this.errorMessage.set(
      null
    );

    this.profileService
      .getTravelerProfile()
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
          const travelerDNA =
            response
              .travelerProfile
              .travelerDNA;

          this.form.patchValue({
            preferredTerrains:
              travelerDNA
                .preferredTerrains,

            preferredActivities:
              travelerDNA
                .preferredActivities,

            preferredWeather:
              travelerDNA
                .preferredWeather,

            preferredTravelStyles:
              travelerDNA
                .preferredTravelStyles,

            minimumBudget:
              travelerDNA
                .typicalBudgetRange
                .min,

            maximumBudget:
              travelerDNA
                .typicalBudgetRange
                .max,

            typicalTripDurationDays:
              travelerDNA
                .typicalTripDurationDays
          });

          this.personalized.set(
            response.personalized
          );

          this.form.markAsPristine();
        },

        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Unable to load Traveler DNA:',
            error
          );

          this.errorMessage.set(
            error.error?.message ||
            'Your Traveler DNA could not be loaded.'
          );
        }
      });
  }
}