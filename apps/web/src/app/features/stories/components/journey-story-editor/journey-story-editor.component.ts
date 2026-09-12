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
  FormsModule
} from '@angular/forms';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  finalize,
  forkJoin
} from 'rxjs';

import {
  JourneyMediaService,
  JourneyPhoto
} from '../../../../core/services/journey-media.service';

import {
  JourneyStory,
  JourneyStoryService,
  JourneyStoryStatus,
  SaveJourneyStoryRequest
} from '../../../../core/services/journey-story.service';

interface StorySectionDraft {
  heading: string;
  date: string | null;
  narrative: string;
  mediaIds: string[];
}

@Component({
  selector:
    'app-journey-story-editor',

  standalone: true,

  imports: [
    FormsModule
  ],

  templateUrl:
    './journey-story-editor.component.html',

  styleUrl:
    './journey-story-editor.component.scss'
})
export class JourneyStoryEditorComponent
  implements OnChanges {

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
  readonly storySaved =
    new EventEmitter<JourneyStory>();

  private readonly storyService =
    inject(JourneyStoryService);

  private readonly mediaService =
    inject(JourneyMediaService);

  readonly photos =
    signal<JourneyPhoto[]>([]);

  readonly isLoading =
    signal(false);

  readonly isSaving =
    signal(false);

  readonly errorMessage =
    signal<string | null>(
      null
    );

  readonly successMessage =
    signal<string | null>(
      null
    );

  title = '';

  introduction = '';

  coverMediaId:
    string | null =
    null;

  status:
    JourneyStoryStatus =
    'draft';

  sections:
    StorySectionDraft[] =
    [];

  ngOnChanges(
    changes: SimpleChanges
  ): void {
    if (
      changes['journeyId'] &&
      this.journeyId
    ) {
      this.loadEditor();
    }
  }

  close(): void {
    if (this.isSaving()) {
      return;
    }

    this.closeRequested.emit();
  }

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

  addSection(): void {
    this.sections = [
      ...this.sections,

      {
        heading:
          'A new chapter',

        date:
          null,

        narrative:
          '',

        mediaIds:
          []
      }
    ];
  }

  removeSection(
    sectionIndex: number
  ): void {
    this.sections =
      this.sections.filter(
        (
          _section,
          index
        ) =>
          index !==
          sectionIndex
      );
  }

  setCoverPhoto(
    mediaId: string
  ): void {
    this.coverMediaId =
      mediaId;

    this.successMessage.set(
      'Cover photo updated. Save the story to keep this change.'
    );
  }

  removePhotoFromSection(
    sectionIndex: number,
    mediaId: string
  ): void {
    this.sections =
      this.sections.map(
        (
          section,
          index
        ) => {
          if (
            index !==
            sectionIndex
          ) {
            return section;
          }

          return {
            ...section,

            mediaIds:
              section.mediaIds.filter(
                currentMediaId =>
                  currentMediaId !==
                  mediaId
              )
          };
        }
      );

    if (
      this.coverMediaId ===
      mediaId
    ) {
      this.coverMediaId =
        null;
    }
  }

  addPhotoToSection(
    mediaId: string,
    sectionIndex: number
  ): void {
    this.sections =
      this.sections.map(
        (
          section,
          index
        ) => {
          if (
            index !==
            sectionIndex
          ) {
            return section;
          }

          return {
            ...section,

            mediaIds: [
              ...section.mediaIds,
              mediaId
            ]
          };
        }
      );
  }

  movePhoto(
    sectionIndex: number,
    photoIndex: number,
    direction: -1 | 1
  ): void {
    const destinationIndex =
      photoIndex +
      direction;

    const section =
      this.sections[
        sectionIndex
      ];

    if (
      !section ||
      destinationIndex < 0 ||
      destinationIndex >=
        section.mediaIds.length
    ) {
      return;
    }

    const reorderedMedia =
      [
        ...section.mediaIds
      ];

    const [
      movedMedia
    ] =
      reorderedMedia.splice(
        photoIndex,
        1
      );

    reorderedMedia.splice(
      destinationIndex,
      0,
      movedMedia
    );

    this.sections =
      this.sections.map(
        (
          currentSection,
          index
        ) =>
          index === sectionIndex
            ? {
                ...currentSection,

                mediaIds:
                  reorderedMedia
              }
            : currentSection
      );
  }

  getPhoto(
    mediaId: string
  ): JourneyPhoto | undefined {
    return this.photos()
      .find(
        photo =>
          photo.id ===
          mediaId
      );
  }

  get unassignedPhotos():
    JourneyPhoto[] {
    const assignedMediaIds =
      new Set(
        this.sections.flatMap(
          section =>
            section.mediaIds
        )
      );

    return this.photos()
      .filter(
        photo =>
          !assignedMediaIds.has(
            photo.id
          )
      );
  }

  saveStory(): void {
    this.errorMessage.set(
      null
    );

    this.successMessage.set(
      null
    );

    const request:
      SaveJourneyStoryRequest = {
        title:
          this.title.trim(),

        introduction:
          this.introduction.trim(),

        coverMedia:
          this.coverMediaId,

        sections:
          this.sections.map(
            section => ({
              heading:
                section.heading.trim(),

              date:
                section.date ||
                null,

              narrative:
                section.narrative.trim(),

              media:
                section.mediaIds
            })
          ),

        status:
          this.status
      };

    this.isSaving.set(
      true
    );

    this.storyService
      .saveJourneyStory(
        this.journeyId,
        request
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
          this.applyStory(
            response.story
          );

          this.successMessage.set(
            'Your private story has been saved.'
          );

          this.storySaved.emit(
            response.story
          );
        },

        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Unable to save story:',
            error
          );

          this.errorMessage.set(
            error.error?.message ||
            'Your story could not be saved.'
          );
        }
      });
  }

  private loadEditor(): void {
    this.isLoading.set(
      true
    );

    this.errorMessage.set(
      null
    );

    this.successMessage.set(
      null
    );

    forkJoin({
      storyResponse:
        this.storyService
          .getJourneyStory(
            this.journeyId
          ),

      photoResponse:
        this.mediaService
          .getJourneyPhotos(
            this.journeyId
          )
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
          this.photos.set(
            response.photoResponse
              .photos
          );

          if (
            response.storyResponse
              .story
          ) {
            this.applyStory(
              response.storyResponse
                .story
            );

            return;
          }

          this.createInitialDraft(
            response.photoResponse
              .photos
          );
        },

        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Unable to load story editor:',
            error
          );

          this.errorMessage.set(
            error.error?.message ||
            'The story editor could not be loaded.'
          );
        }
      });
  }

  private applyStory(
    story: JourneyStory
  ): void {
    this.title =
      story.title;

    this.introduction =
      story.introduction;

    this.coverMediaId =
      story.coverMediaId;

    this.status =
      story.status;

    this.sections =
      story.sections.map(
        section => ({
          heading:
            section.heading,

          date:
            section.date
              ? section.date.slice(
                  0,
                  10
                )
              : null,

          narrative:
            section.narrative,

          mediaIds:
            [
              ...section.mediaIds
            ]
        })
      );
  }

  /**
   * Produces a useful first draft by grouping photos
   * according to the date on which they were taken.
   */
  private createInitialDraft(
    photos: JourneyPhoto[]
  ): void {
    this.title =
      `${this.placeTitle} Story`;

    this.introduction =
      '';

    this.status =
      'draft';

    this.coverMediaId =
      photos[0]?.id ||
      null;

    const datedGroups =
      new Map<
        string,
        JourneyPhoto[]
      >();

    const undatedPhotos:
      JourneyPhoto[] =
      [];

    const chronologicallySorted =
      [
        ...photos
      ].sort(
        (
          firstPhoto,
          secondPhoto
        ) => {
          const firstTime =
            firstPhoto.takenAt
              ? new Date(
                  firstPhoto.takenAt
                ).getTime()
              : Number.MAX_SAFE_INTEGER;

          const secondTime =
            secondPhoto.takenAt
              ? new Date(
                  secondPhoto.takenAt
                ).getTime()
              : Number.MAX_SAFE_INTEGER;

          return (
            firstTime -
            secondTime
          );
        }
      );

    for (
      const photo
      of chronologicallySorted
    ) {
      if (!photo.takenAt) {
        undatedPhotos.push(
          photo
        );

        continue;
      }

      const date =
        photo.takenAt.slice(
          0,
          10
        );

      const group =
        datedGroups.get(
          date
        ) || [];

      group.push(
        photo
      );

      datedGroups.set(
        date,
        group
      );
    }

    this.sections =
      [
        ...datedGroups.entries()
      ].map(
        (
          [
            date,
            groupPhotos
          ],
          index
        ) => ({
          heading:
            `Chapter ${index + 1}`,

          date,

          narrative:
            '',

          mediaIds:
            groupPhotos.map(
              photo =>
                photo.id
            )
        })
      );

    if (
      undatedPhotos.length
    ) {
      this.sections.push({
        heading:
          this.sections.length
            ? 'More memories'
            : 'Journey memories',

        date:
          null,

        narrative:
          '',

        mediaIds:
          undatedPhotos.map(
            photo =>
              photo.id
          )
      });
    }

    if (!this.sections.length) {
      this.addSection();
    }
  }
}