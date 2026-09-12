import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  HttpErrorResponse,
  HttpEventType
} from '@angular/common/http';

import {
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Subscription,
  filter,
  finalize,
  switchMap,
  take,
  tap,
  timer,
  timeout
} from 'rxjs';

import {
  JourneyMediaService,
  JourneyPhoto
} from '../../../../core/services/journey-media.service';

import {
  GooglePhotosPickedMediaItem,
  GooglePhotosPickerService,
  GooglePhotosPickingSession
} from '../../../../core/services/google-photos-picker.service';

const MAX_PHOTO_SIZE =
  15 * 1024 * 1024;

const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
];

@Component({
  selector:
    'app-journey-memories',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './journey-memories.component.html',

  styleUrl:
    './journey-memories.component.scss'
})
export class JourneyMemoriesComponent
  implements OnChanges, OnDestroy {

  @Input({
    required: true
  })
  journeyId!: string;

  @Input({
    required: true
  })
  placeTitle!: string;

  @Input()
  journeyStartDate:
  string | null = null;

@Input()
journeyEndDate:
  string | null =
  null;

  @Output()
  readonly closeRequested =
    new EventEmitter<void>();

  @Output()
  readonly photoUploaded =
    new EventEmitter<JourneyPhoto>();

  @ViewChild('photoInput')
  photoInput?:
    ElementRef<HTMLInputElement>;

  private readonly mediaService =
    inject(JourneyMediaService);

  private readonly googlePhotosService =
    inject(
      GooglePhotosPickerService
    );

  private googleAccessToken:
    string | null =
    null;

  private googlePollingSubscription?:
    Subscription;

  readonly photos =
    signal<JourneyPhoto[]>([]);

  readonly selectedFile =
    signal<File | null>(
      null
    );

  readonly previewUrl =
    signal<string | null>(
      null
    );

  readonly isLoading =
    signal(false);

  readonly isUploading =
    signal(false);

  readonly uploadProgress =
    signal(0);

  readonly errorMessage =
    signal<string | null>(
      null
    );

  readonly captionControl =
    new FormControl(
      '',
      {
        nonNullable: true,

        validators: [
          Validators.maxLength(500)
        ]
      }
    );

    readonly googleSession =
    signal<
      GooglePhotosPickingSession | null
    >(
      null
    );

  readonly googleMediaItems =
    signal<
      GooglePhotosPickedMediaItem[]
    >(
      []
    );

  readonly googlePhotos =
    computed(
      () =>
        this.googleMediaItems()
          .filter(
            item =>
              item.type === 'PHOTO'
          )
    );

  readonly googleVideoCount =
    computed(
      () =>
        this.googleMediaItems()
          .filter(
            item =>
              item.type === 'VIDEO'
          )
          .length
    );

  readonly isGoogleConnecting =
    signal(false);

  readonly isGoogleWaiting =
    signal(false);

  readonly isPreparingGooglePhoto =
    signal(false);

  readonly selectedGoogleMediaId =
    signal<string | null>(
      null
    );

  readonly selectedTakenAt =
    signal<string | null>(
      null
    );

  ngOnChanges(
    changes: SimpleChanges
  ): void {
    if (
      changes['journeyId'] &&
      this.journeyId
    ) {
      this.loadPhotos();
    }
  }

  ngOnDestroy(): void {
    this.googlePollingSubscription
      ?.unsubscribe();

    this.cleanupGoogleSession();

    this.revokePreviewUrl();
  }

  close(): void {
    if (this.isUploading()) {
      return;
    }

    this.closeRequested.emit();
  }

  /**
   * Closes the dialog only when the user clicks the
   * backdrop, not when clicking inside the gallery.
   */
  handleBackdropClick(
    event: MouseEvent
  ): void {
    if (
      event.target ===
      event.currentTarget
    ) {
      this.close();
    }
  }

  handleFileSelection(
    event: Event
  ): void {
    this.errorMessage.set(
      null
    );

    const input =
      event.target as
        HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    if (
      !ALLOWED_PHOTO_TYPES.includes(
        file.type
      )
    ) {
      this.clearSelectedFile();

      this.errorMessage.set(
        'Choose a JPEG, PNG, WebP, HEIC or HEIF photo.'
      );

      return;
    }

    if (
      file.size >
      MAX_PHOTO_SIZE
    ) {
      this.clearSelectedFile();

      this.errorMessage.set(
        'Photos must be 15 MB or smaller.'
      );

      return;
    }

    /**
     * This is now a local-device photo, so clear
     * metadata left from a Google Photos selection.
     */
    this.selectedGoogleMediaId.set(
      null
    );

    this.selectedTakenAt.set(
      null
    );

    this.revokePreviewUrl();

    this.selectedFile.set(
      file
    );

    this.previewUrl.set(
      URL.createObjectURL(
        file
      )
    );

    /**
     * Start with the filename without its extension
     * as an optional caption suggestion.
     */
    const suggestedCaption =
      file.name.replace(
        /\.[^/.]+$/,
        ''
      );

    this.captionControl.setValue(
      suggestedCaption
    );
  }

  removeSelectedFile(): void {
    if (this.isUploading()) {
      return;
    }

    this.clearSelectedFile();
    this.errorMessage.set(null);
  }

  private sortPhotosByDate(
    photos: JourneyPhoto[]
  ): JourneyPhoto[] {
    return [
      ...photos
    ].sort(
      (
        firstPhoto,
        secondPhoto
      ) => {
        /**
         * Google Photos supplies takenAt.
         * Local uploads may not have a capture date,
         * so createdAt is used as a fallback.
         */
        const firstDate =
          new Date(
            firstPhoto.takenAt ||
            firstPhoto.createdAt
          ).getTime();

        const secondDate =
          new Date(
            secondPhoto.takenAt ||
            secondPhoto.createdAt
          ).getTime();

        /**
         * Newest memories appear first.
         */
        return secondDate - firstDate;
      }
    );
  }

  uploadPhoto(): void {
    const file =
      this.selectedFile();

    this.errorMessage.set(
      null
    );

    if (!file) {
      this.errorMessage.set(
        'Select a photo first.'
      );

      return;
    }

    if (
      this.captionControl.invalid
    ) {
      this.captionControl
        .markAsTouched();

      this.errorMessage.set(
        'The caption must be 500 characters or fewer.'
      );

      return;
    }

    this.isUploading.set(
      true
    );

    this.uploadProgress.set(
      0
    );

    this.mediaService
      .createPhotoUploadUrl(
        this.journeyId,
        {
          fileName:
            file.name,

          mimeType:
            file.type,

          sizeBytes:
            file.size,

          caption:
            this.captionControl
              .value
              .trim(),

          takenAt:
            this.selectedTakenAt()
        }
      )
      .pipe(
        switchMap(
          upload =>
            this.mediaService
              .uploadPhotoToS3(
                upload.uploadUrl,
                file,
                upload.headers[
                  'Content-Type'
                ]
              )
              .pipe(
                tap(
                  event => {
                    if (
                      event.type ===
                        HttpEventType
                          .UploadProgress &&
                      event.total
                    ) {
                      const percentage =
                        Math.round(
                          (
                            event.loaded /
                            event.total
                          ) *
                          100
                        );

                      this.uploadProgress
                        .set(
                          percentage
                        );
                    }
                  }
                ),

                filter(
                  event =>
                    event.type ===
                    HttpEventType.Response
                ),

                take(1),

                switchMap(
                  () =>
                    this.mediaService
                      .completePhotoUpload(
                        this.journeyId,
                        upload.mediaId
                      )
                )
              )
        ),

        finalize(
          () => {
            this.isUploading.set(
              false
            );
          }
        )
      )
      .subscribe({
        next: response => {
          this.uploadProgress.set(
            100
          );

          this.photos.update(
            currentPhotos =>
              this.sortPhotosByDate([
                response.photo,
                ...currentPhotos
              ])
          );

          this.photoUploaded.emit(
            response.photo
          );

          /**
           * If this memory came from Google Photos,
           * remove it from the temporary picker list
           * after the upload succeeds.
           */
          const googleMediaId =
          this.selectedGoogleMediaId();

        if (googleMediaId) {
          this.googleMediaItems.update(
            items =>
              items.filter(
                item =>
                  item.id !==
                  googleMediaId
              )
          );
        }

          this.clearSelectedFile();
        },

        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Photo upload failed:',
            error
          );

          this.errorMessage.set(
            error.error?.message ||
            'The photo could not be uploaded.'
          );
        }
      });
  }

    /**
   * Requests Google Photos permission and creates a
   * temporary picker session.
   */
  connectGooglePhotos(): void {
    if (
      this.isGoogleConnecting() ||
      this.isGoogleWaiting()
    ) {
      return;
    }

    this.errorMessage.set(
      null
    );

    this.isGoogleConnecting.set(
      true
    );

    this.googlePhotosService
      .requestAccessToken()
      .then(
        accessToken => {
          this.googleAccessToken =
            accessToken;

          this.googlePhotosService
            .createSession(
              accessToken
            )
            .pipe(
              finalize(
                () => {
                  this.isGoogleConnecting
                    .set(false);
                }
              )
            )
            .subscribe({
              next: session => {
                this.googleSession.set(
                  session
                );
              },

              error: (
                error:
                  HttpErrorResponse
              ) => {
                console.error(
                  'Google Photos session failed:',
                  error
                );

                this.errorMessage.set(
                  error.error?.error
                    ?.message ||
                  'Google Photos could not be opened.'
                );
              }
            });
        }
      )
      .catch(
        (
          error: unknown
        ): void => {
          this.isGoogleConnecting.set(
            false
          );

          this.errorMessage.set(
            error instanceof Error
              ? error.message
              : 'Google Photos authorization failed.'
          );
        }
      );
  }

  /**
   * Opens Google Photos in a separate window and begins
   * checking for the completed selection.
   */
  openGooglePhotos(): void {
    const session =
      this.googleSession();

    const accessToken =
      this.googleAccessToken;

    if (
      !session ||
      !accessToken
    ) {
      return;
    }

    const pickerUrl =
      this.googlePhotosService
        .getAutoclosePickerUrl(
          session.pickerUri
        );

    const pickerWindow =
      window.open(
        pickerUrl,
        'dash-google-photos-picker',
        'popup,width=1100,height=780'
      );

    if (!pickerWindow) {
      this.errorMessage.set(
        'Allow pop-ups to open Google Photos.'
      );

      return;
    }

    this.pollGooglePhotosSelection(
      session,
      accessToken
    );
  }

  /**
   * Polls using the interval recommended by Google
   * until the traveler confirms their selection.
   */
  private pollGooglePhotosSelection(
    session:
      GooglePhotosPickingSession,

    accessToken: string
  ): void {
    this.googlePollingSubscription
      ?.unsubscribe();

    this.isGoogleWaiting.set(
      true
    );

    const pollingInterval =
      this.parseGoogleDuration(
        session.pollingConfig
          ?.pollInterval
      );

    this.googlePollingSubscription =
      timer(
        0,
        pollingInterval
      )
        .pipe(
          switchMap(
            () =>
              this.googlePhotosService
                .getSession(
                  session.id,
                  accessToken
                )
          ),

          filter(
            currentSession =>
              currentSession
                .mediaItemsSet === true
          ),

          take(1),

          timeout({
            first:
              10 * 60 * 1000
          }),

          switchMap(
            () =>
              this.googlePhotosService
                .getAllSelectedMedia(
                  session.id,
                  accessToken
                )
          ),

          finalize(
            () => {
              this.isGoogleWaiting.set(
                false
              );
            }
          )
        )
        .subscribe({
          next: items => {
            const sortedItems =
              this.sortGoogleMediaByTrip(
                items
              );

            this.googleMediaItems.set(
              sortedItems
            );

            if (!items.length) {
              this.errorMessage.set(
                'No Google Photos items were selected.'
              );
            }
          },

          error: (
            error: unknown
          ) => {
            console.error(
              'Google Photos selection failed:',
              error
            );

            this.errorMessage.set(
              'Google Photos selection timed out or could not be loaded.'
            );
          }
        });
  }

  /**
   * Downloads one selected Google photo into the browser
   * and places it in the existing upload preview.
   */
  prepareGooglePhoto(
    item:
      GooglePhotosPickedMediaItem
  ): void {
    const accessToken =
      this.googleAccessToken;

    if (
      !accessToken ||
      item.type !== 'PHOTO'
    ) {
      return;
    }

    this.errorMessage.set(
      null
    );

    this.isPreparingGooglePhoto.set(
      true
    );

    this.googlePhotosService
      .downloadPhoto(
        item,
        accessToken
      )
      .pipe(
        finalize(
          () => {
            this.isPreparingGooglePhoto
              .set(false);
          }
        )
      )
      .subscribe({
        next: blob => {
          const mimeType =
            item.mediaFile
              .mimeType ||
            blob.type;

          const file =
            new File(
              [
                blob
              ],

              item.mediaFile
                .filename,

              {
                type:
                  mimeType,

                lastModified:
                  Date.parse(
                    item.createTime
                  ) ||
                  Date.now()
              }
            );

          if (
            !ALLOWED_PHOTO_TYPES
              .includes(
                file.type
              )
          ) {
            this.errorMessage.set(
              'This Google photo format is not supported yet.'
            );

            return;
          }

          if (
            file.size >
            MAX_PHOTO_SIZE
          ) {
            this.errorMessage.set(
              'This Google photo is larger than 15 MB.'
            );

            return;
          }

          this.revokePreviewUrl();

          this.selectedFile.set(
            file
          );

          this.selectedTakenAt.set(
            item.createTime
          );

          this.selectedGoogleMediaId
            .set(
              item.id
            );

          this.previewUrl.set(
            URL.createObjectURL(
              file
            )
          );

          this.captionControl.setValue(
            file.name.replace(
              /\.[^/.]+$/,
              ''
            )
          );
        },

        error: (
          error: unknown
        ) => {
          console.error(
            'Google photo download failed:',
            error
          );

          this.errorMessage.set(
            'The selected Google photo could not be prepared.'
          );
        }
      });
  }

  cancelGooglePhotos(): void {
    this.cleanupGoogleSession();

    this.googleMediaItems.set(
      []
    );
  }

  /**
   * Returns how closely an item matches the journey
   * dates already stored in MongoDB.
   */
  googleDateStatus(
    item:
      GooglePhotosPickedMediaItem
  ):
    | 'matching'
    | 'outside'
    | 'unknown' {
    if (
      !this.journeyStartDate &&
      !this.journeyEndDate
    ) {
      return 'unknown';
    }

    const mediaDate =
      item.createTime.slice(
        0,
        10
      );

    const startDate =
      (
        this.journeyStartDate ||
        this.journeyEndDate
      )?.slice(
        0,
        10
      );

    const endDate =
      (
        this.journeyEndDate ||
        this.journeyStartDate
      )?.slice(
        0,
        10
      );

    if (
      startDate &&
      endDate &&
      mediaDate >= startDate &&
      mediaDate <= endDate
    ) {
      return 'matching';
    }

    return 'outside';
  }

  googleDateLabel(
    item:
      GooglePhotosPickedMediaItem
  ): string {
    const status =
      this.googleDateStatus(
        item
      );

    switch (status) {
      case 'matching':
        return 'Matches journey dates';

      case 'outside':
        return 'Outside journey dates';

      case 'unknown':
        return 'Journey dates not set';
    }
  }

  formatGoogleDate(
    createTime: string
  ): string {
    const parsedDate =
      new Date(
        createTime
      );

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return '';
    }

    return new Intl.DateTimeFormat(
      undefined,
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }
    ).format(
      parsedDate
    );
  }

  private sortGoogleMediaByTrip(
    items:
      GooglePhotosPickedMediaItem[]
  ):
    GooglePhotosPickedMediaItem[] {
    return [
      ...items
    ].sort(
      (
        first,
        second
      ) => {
        const statusPriority = {
          matching: 0,
          unknown: 1,
          outside: 2
        };

        const priorityDifference =
          statusPriority[
            this.googleDateStatus(
              first
            )
          ] -
          statusPriority[
            this.googleDateStatus(
              second
            )
          ];

        if (
          priorityDifference !== 0
        ) {
          return priorityDifference;
        }

        return (
          Date.parse(
            first.createTime
          ) -
          Date.parse(
            second.createTime
          )
        );
      }
    );
  }

  private parseGoogleDuration(
    duration?: string
  ): number {
    const match =
      duration?.match(
        /^([\d.]+)s$/
      );

    if (!match) {
      return 2000;
    }

    return Math.max(
      Number(
        match[1]
      ) *
        1000,

      1000
    );
  }

  private cleanupGoogleSession(): void {
    this.googlePollingSubscription
      ?.unsubscribe();

    this.googlePollingSubscription =
      undefined;

    this.isGoogleWaiting.set(
      false
    );

    const session =
      this.googleSession();

    const accessToken =
      this.googleAccessToken;

    this.googleSession.set(
      null
    );

    if (
      !session ||
      !accessToken
    ) {
      return;
    }

    this.googlePhotosService
      .deleteSession(
        session.id,
        accessToken
      )
      .pipe(
        take(1)
      )
      .subscribe({
        error: (): void => {
          /**
           * Session cleanup should not interrupt the
           * traveler-facing memories experience.
           */
        }
      });
  }

  private loadPhotos(): void {
    this.isLoading.set(
      true
    );

    this.errorMessage.set(
      null
    );

    this.mediaService
      .getJourneyPhotos(
        this.journeyId
      )
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
          this.photos.set(
            this.sortPhotosByDate(
              response.photos
            )
          );
        },

        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Unable to load memories:',
            error
          );

          this.errorMessage.set(
            error.error?.message ||
            'Your memories could not be loaded.'
          );
        }
      });
  }

  private clearSelectedFile(): void {
    this.revokePreviewUrl();

    this.selectedFile.set(
      null
    );

    this.captionControl.reset(
      ''
    );

    this.selectedTakenAt.set(
      null
    );

    this.selectedGoogleMediaId.set(
      null
    );

    if (this.photoInput) {
      this.photoInput
        .nativeElement
        .value =
        '';
    }
  }

  private revokePreviewUrl(): void {
    const currentPreviewUrl =
      this.previewUrl();

    if (currentPreviewUrl) {
      URL.revokeObjectURL(
        currentPreviewUrl
      );
    }

    this.previewUrl.set(
      null
    );
  }
}