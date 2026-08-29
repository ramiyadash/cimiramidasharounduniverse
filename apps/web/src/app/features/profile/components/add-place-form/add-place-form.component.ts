import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
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
  CreateUniverseJourneyRequest,
  JourneyService,
  UniversePlace,
  UniverseStatus
} from '../../../../core/services/journey.service';

@Component({
  selector:
    'app-add-place-form',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './add-place-form.component.html',

  styleUrl:
    './add-place-form.component.scss'
})
export class AddPlaceFormComponent
  implements OnChanges {

  /**
   * Current draggable-pin coordinates.
   */
  @Input()
  coordinates:
    [number, number] | null =
    null;

  /**
   * When provided, the form operates in edit mode.
   * When null, it creates a new journey.
   */
  @Input()
  place: UniversePlace | null =
    null;

  /**
   * Emits both newly created and updated places.
   */
  @Output()
  readonly placeSaved =
    new EventEmitter<UniversePlace>();

  @Output()
  readonly cancelRequested =
    new EventEmitter<void>();

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly journeyService =
    inject(JourneyService);

  readonly isSaving =
    signal(false);

  readonly errorMessage =
    signal<string | null>(
      null
    );

  readonly form =
    this.formBuilder
      .nonNullable
      .group({
        title: [
          '',
          [
            Validators.required,
            Validators.maxLength(120)
          ]
        ],

        journeyType: [
          'adventure' as
            CreateUniverseJourneyRequest[
              'journeyType'
            ],

          Validators.required
        ],

        status: [
          'visited' as
            UniverseStatus,

          Validators.required
        ],

        country: [
          '',
          [
            Validators.required,
            Validators.maxLength(100)
          ]
        ],

        countryCode: [
          '',
          [
            Validators.maxLength(2),

            Validators.pattern(
              /^[A-Za-z]{0,2}$/
            )
          ]
        ],

        region: [
          '',
          Validators.maxLength(100)
        ],

        locations: [
          '',
          Validators.required
        ],

        dateLabel: [
          '',
          [
            Validators.required,
            Validators.maxLength(80)
          ]
        ],

        startDate: [
          ''
        ],

        endDate: [
          ''
        ],

        emoji: [
          '📍',
          Validators.maxLength(16)
        ],

        description: [
          '',
          [
            Validators.required,
            Validators.maxLength(1000)
          ]
        ]
      });

  ngOnChanges(
    changes: SimpleChanges
  ): void {
    if (
      changes['coordinates'] &&
      this.coordinates
    ) {
      this.errorMessage.set(
        null
      );
    }

    if (!changes['place']) {
      return;
    }

    if (this.place) {
      this.populateEditForm(
        this.place
      );

      return;
    }

    this.resetCreateForm();
  }

  cancel(): void {
    if (this.isSaving()) {
      return;
    }

    this.cancelRequested.emit();
  }

  save(): void {
    this.errorMessage.set(
      null
    );

    if (this.form.invalid) {
      this.form.markAllAsTouched();
    
      const invalidFields =
        this.getInvalidFieldLabels();
    
      this.errorMessage.set(
        invalidFields.length
          ? `Please check: ${
              invalidFields.join(', ')
            }.`
          : 'One or more values are invalid.'
      );
    
      return;
    }

    if (!this.coordinates) {
      this.errorMessage.set(
        'Drop a pin on the destination map.'
      );

      return;
    }

    const formValue =
      this.form.getRawValue();

    const locations =
      formValue.locations
        .split(',')
        .map(
          location =>
            location.trim()
        )
        .filter(Boolean);

    if (!locations.length) {
      this.errorMessage.set(
        'Enter at least one city or location.'
      );

      return;
    }

    const request:
      CreateUniverseJourneyRequest = {
        title:
          formValue.title.trim(),

        journeyType:
          formValue.journeyType,

        universe: {
          status:
            formValue.status,

          country:
            formValue.country.trim(),

          countryCode:
            formValue.countryCode
              .trim()
              .toUpperCase(),

          region:
            formValue.region.trim(),

          locations,

          dateLabel:
            formValue.dateLabel.trim(),

          startDate:
            formValue.startDate ||
            null,

          endDate:
            formValue.endDate ||
            null,

          emoji:
            formValue.emoji.trim() ||
            '📍',

          description:
            formValue.description.trim(),

          coordinates: {
            longitude:
              this.coordinates[0],

            latitude:
              this.coordinates[1]
          }
        }
      };

    this.isSaving.set(
      true
    );

    /**
     * Reuse the same form:
     *
     * - Existing place: PATCH
     * - New place: POST
     */
    const saveRequest$ =
      this.place
        ? this.journeyService
            .updateJourney(
              this.place.journeyId,
              request
            )
        : this.journeyService
            .createJourney(
              request
            );

    saveRequest$
      .subscribe({
        next: place => {
          this.isSaving.set(
            false
          );

          this.placeSaved.emit(
            place
          );
        },

        error: (
          error: HttpErrorResponse
        ) => {
          this.isSaving.set(
            false
          );

          this.errorMessage.set(
            error.error?.message ||
            (
              this.place
                ? 'The changes could not be saved.'
                : 'The place could not be saved.'
            )
          );
        }
      });
  }

  private populateEditForm(
    place: UniversePlace
  ): void {
    this.form.patchValue({
      title:
        place.title,

      journeyType:
        place.journeyType,

      status:
        place.status,

      country:
        place.country,

      countryCode:
        place.countryCode ||
        '',

      region:
        place.region ||
        '',

      locations:
        place.locations
          .split(' · ')
          .join(', '),

      dateLabel:
        place.date,

      startDate:
        this.toDateInputValue(
          place.startDate
        ),

      endDate:
        this.toDateInputValue(
          place.endDate
        ),

      emoji:
        place.emoji,

      description:
        place.description
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.errorMessage.set(
      null
    );
  }

  private getInvalidFieldLabels():
  string[] {
  const fieldLabels:
    Record<
      keyof typeof this.form.controls,
      string
    > = {
      title:
        'Journey name',

      journeyType:
        'Journey style',

      status:
        'Universe status',

      country:
        'Country',

      countryCode:
        'Country code',

      region:
        'Region',

      locations:
        'Cities or locations',

      dateLabel:
        'Date label',

      startDate:
        'Start date',

      endDate:
        'End date',

      emoji:
        'Marker emoji',

      description:
        'Description'
    };

  return Object.entries(
    this.form.controls
  )
    .filter(
      (
        [
          ,
          control
        ]
      ) =>
        control.invalid
    )
    .map(
      (
        [
          fieldName
        ]
      ) =>
        fieldLabels[
          fieldName as
            keyof typeof
              this.form.controls
        ]
    );
}

  private resetCreateForm(): void {
    this.form.reset({
      title: '',
      journeyType: 'adventure',
      status: 'visited',
      country: '',
      countryCode: '',
      region: '',
      locations: '',
      dateLabel: '',
      startDate: '',
      endDate: '',
      emoji: '📍',
      description: ''
    });

    this.errorMessage.set(
      null
    );
  }

  /**
   * HTML date inputs require YYYY-MM-DD rather than
   * the complete ISO date returned by MongoDB.
   */
  private toDateInputValue(
    value: string | null
  ): string {
    if (!value) {
      return '';
    }

    return value.slice(
      0,
      10
    );
  }
}