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
  filter,
  finalize,
  switchMap,
  take,
  tap
} from 'rxjs';

import {
  JourneyMediaService,
  JourneyPhoto
} from '../../../../core/services/journey-media.service';

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
              .trim()
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
            currentPhotos => [
              response.photo,
              ...currentPhotos
            ]
          );

          this.photoUploaded.emit(
            response.photo
          );

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
            response.photos
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