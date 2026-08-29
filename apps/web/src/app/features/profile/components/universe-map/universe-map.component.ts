import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  Map as MapLibreMap,
  Marker,
  NavigationControl
} from 'maplibre-gl';

import {
  JourneyService,
  UniversePlace,
  UniverseStatus
} from '../../../../core/services/journey.service';

import {
  AddPlaceFormComponent
} from '../add-place-form/add-place-form.component';

import {
  JourneyMemoriesComponent
} from '../journey-memories/journey-memories.component';

type UniverseFilter =
  | UniverseStatus
  | 'all';

type UniverseView =
  | 'map'
  | 'list';

@Component({
  selector: 'app-universe-map',

  imports: [AddPlaceFormComponent,
    JourneyMemoriesComponent],

  templateUrl:
    './universe-map.component.html',

  styleUrl:
    './universe-map.component.scss',

  /**
   * MapLibre creates marker elements dynamically.
   * Disabling encapsulation lets this component style
   * those generated elements.
   */
  encapsulation:
    ViewEncapsulation.None
})
export class UniverseMapComponent
  implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(
    'mapContainer',
    {
      static: true
    }
  )
  mapContainer!: ElementRef<HTMLDivElement>;

  private map?: MapLibreMap;

  private markers =
    new Map<string, Marker>();

  private draftMarker?: Marker;

  activeFilter: UniverseFilter =
    'all';

  viewMode: UniverseView =
    'map';

  selectedPlace?: UniversePlace;

  places: UniversePlace[] = [];

  isLoading = true;

  errorMessage: string | null =
    null;

  isAddingPlace = false;

  isViewingMemories = false;

  editingPlace:
  UniversePlace | null =
  null;

  draftCoordinates:
    [number, number] | null =
    null;  

  private mapReady = false;

  constructor(
    private readonly zone:
      NgZone,
  
    private readonly journeyService:
      JourneyService
  ) {}

  ngOnInit(): void {
    this.loadUniverseJourneys();
  }

  ngAfterViewInit(): void {
    this.createMap();
  }

  ngOnDestroy(): void {

    this.draftMarker?.remove();
    this.draftMarker = undefined;

    this.markers.clear();
    this.map?.remove();
  }

  private loadUniverseJourneys(): void {
    this.isLoading = true;
    this.errorMessage = null;
  
    this.journeyService
      .getUniverseJourneys()
      .subscribe({
        next: response => {
          this.places =
            response.places;
  
          this.selectedPlace =
            this.places[0];
  
          this.isLoading = false;
  
          if (this.mapReady) {
            this.synchronizeMarkers();
            this.resetMapView(0);
          }
        },
  
        error: (
          error: HttpErrorResponse
        ) => {
          this.isLoading = false;
  
          this.errorMessage =
            error.error?.message ||
            'Your universe could not be loaded.';
  
          console.error(
            'Unable to load My Universe:',
            error
          );
        }
      });
  }

  get visitedCount(): number {
    return this.places.filter(
      place =>
        place.status === 'visited'
    ).length;
  }

  get plannedCount(): number {
    return this.places.filter(
      place =>
        place.status === 'planned'
    ).length;
  }

  get dreamingCount(): number {
    return this.places.filter(
      place =>
        place.status === 'dreaming'
    ).length;
  }

  get totalPhotos(): number {
    return this.places.reduce(
      (
        total: number,
        place: UniversePlace
      ): number =>
        total + place.photos,
      0
    );
  }

  get isPlaceFormOpen(): boolean {
    return (
      this.isAddingPlace ||
      this.editingPlace !== null
    );
  }

  get visiblePlaces(): UniversePlace[] {
    if (this.activeFilter === 'all') {
      return this.places;
    }

    return this.places.filter(
      place =>
        place.status ===
          this.activeFilter
    );
  }

  setViewMode(
    viewMode: UniverseView
  ): void {
    this.viewMode = viewMode;

    /**
     * MapLibre needs to recalculate its canvas after
     * becoming visible again.
     */
    if (viewMode === 'map') {
      setTimeout(
        () => {
          this.map?.resize();
        },
        0
      );
    }
  }

  openAddPlace(): void {
    this.draftMarker?.remove();
    this.draftMarker = undefined;
    
    this.editingPlace = null;
    this.isAddingPlace = true;
    this.selectedPlace = undefined;
    this.draftCoordinates = null;
    this.viewMode = 'map';
  
    if (this.map) {
      this.map
        .getCanvas()
        .style.cursor =
          'crosshair';
  
      setTimeout(
        () => {
          this.map?.resize();
        },
        0
      );
    }
  }

  openEditPlace(
    place: UniversePlace
  ): void {
    this.draftMarker?.remove();
    this.draftMarker = undefined;
  
    this.isAddingPlace = false;
    this.editingPlace = place;
    this.selectedPlace = undefined;
    this.viewMode = 'map';
  
    /**
     * Hide the permanent marker while the temporary,
     * draggable edit marker is visible.
     */
    const existingMarker =
      this.markers.get(
        place.id
      );
  
    if (existingMarker) {
      existingMarker
        .getElement()
        .style.display =
          'none';
    }
  
    if (this.map) {
      this.map
        .getCanvas()
        .style.cursor =
          'crosshair';
  
      setTimeout(
        () => {
          this.map?.resize();
        },
        0
      );
    }
  
    /**
     * Place the draggable marker at the journey's
     * currently saved coordinates.
     */
    this.setDraftLocation(
      place.coordinates[0],
      place.coordinates[1]
    );
  }
  
  cancelAddPlace(): void {
    const previouslyEditedPlace =
      this.editingPlace;
  
    this.draftMarker?.remove();
    this.draftMarker = undefined;
  
    this.isAddingPlace = false;
    this.editingPlace = null;
    this.draftCoordinates = null;
  
    if (this.map) {
      this.map
        .getCanvas()
        .style.cursor =
          '';
    }
  
    /**
     * Restore any permanent marker hidden during edit.
     */
    this.updateMarkerVisibility();
  
    this.selectedPlace =
      previouslyEditedPlace ||
      this.visiblePlaces[0];
  }
  
  handlePlaceSaved(
    place: UniversePlace
  ): void {
    this.draftMarker?.remove();
    this.draftMarker = undefined;
  
    this.isAddingPlace = false;
    this.editingPlace = null;
    this.draftCoordinates = null;
    this.activeFilter = 'all';
  
    const existingPlace =
      this.places.some(
        currentPlace =>
          currentPlace.id ===
          place.id
      );
  
    if (existingPlace) {
      /**
       * Replace the updated place without creating a
       * duplicate card or map marker.
       */
      this.places =
        this.places.map(
          currentPlace =>
            currentPlace.id ===
            place.id
              ? place
              : currentPlace
        );
    } else {
      this.places = [
        place,
        ...this.places
      ];
    }
  
    this.selectedPlace = place;
  
    if (this.map) {
      this.map
        .getCanvas()
        .style.cursor =
          '';
    }
  
    this.synchronizeMarkers();
  
    this.map?.flyTo({
      center:
        place.coordinates,
  
      zoom: 4,
  
      duration: 1100,
  
      essential: true
    });
  }

  setFilter(
    filter: UniverseFilter
  ): void {
    this.activeFilter = filter;

    this.selectedPlace =
      this.visiblePlaces[0];

    this.updateMarkerVisibility();
    this.resetMapView();
  }

  selectPlace(
    place: UniversePlace
  ): void {
    this.selectedPlace = place;

    this.map?.flyTo({
      center:
        place.coordinates,

      zoom: 3.5,

      duration: 1100,

      essential: true
    });
  }

  closePlace(): void {
    this.selectedPlace = undefined;
    this.resetMapView();
  }

  statusLabel(
    status: UniverseStatus
  ): string {
    switch (status) {
      case 'visited':
        return 'Visited';

      case 'planned':
        return 'Planned';

      case 'dreaming':
        return 'Dreaming';
    }
  }

  private createMap(): void {
    this.map =
      new MapLibreMap({
        container:
          this.mapContainer.nativeElement,

        style:
          'https://tiles.openfreemap.org/styles/liberty',

        center: [
          10,
          20
        ],

        zoom: 0.9,

        minZoom: 0.5,

        maxZoom: 8,

        /**
         * Prevents repeated copies of the world from
         * appearing when the user pans horizontally.
         */
        renderWorldCopies: false,

        attributionControl: false
      });

    this.map.addControl(
      new NavigationControl({
        showCompass: false,
        showZoom: true
      }),
      'top-left'
    );

    this.map.on(
      'load',
      () => {
        this.mapReady = true;
    
        this.synchronizeMarkers();
        this.resetMapView(0);
      }
    );

    this.map.on(
      'click',
      event => {
        if (!this.isPlaceFormOpen) {
          return;
        }
    
        this.zone.run(
          () => {
            this.setDraftLocation(
              event.lngLat.lng,
              event.lngLat.lat
            );
          }
        );
      }
    );

    this.map.on(
      'error',
      event => {
        console.error(
          'Universe map error:',
          event.error
        );
      }
    );
  }

  private setDraftLocation(
    longitude: number,
    latitude: number
  ): void {
    const normalizedLongitude =
      Number(
        longitude.toFixed(6)
      );
  
    const normalizedLatitude =
      Number(
        latitude.toFixed(6)
      );
  
    this.draftCoordinates = [
      normalizedLongitude,
      normalizedLatitude
    ];
  
    if (!this.map) {
      return;
    }
  
    /**
     * Create the temporary pin after the first click.
     */
    if (!this.draftMarker) {
      this.draftMarker =
        new Marker({
          color: '#08777c',
          draggable: true
        })
          .setLngLat(
            this.draftCoordinates
          )
          .addTo(
            this.map
          );
  
      /**
       * Keep the form coordinates synchronized when
       * the traveler drags the temporary pin.
       */
      this.draftMarker.on(
        'dragend',
        () => {
          const position =
            this.draftMarker
              ?.getLngLat();
  
          if (!position) {
            return;
          }
  
          this.zone.run(
            () => {
              this.draftCoordinates = [
                Number(
                  position.lng
                    .toFixed(6)
                ),
  
                Number(
                  position.lat
                    .toFixed(6)
                )
              ];
            }
          );
        }
      );
  
      return;
    }
  
    /**
     * Subsequent map clicks move the existing pin.
     */
    this.draftMarker.setLngLat(
      this.draftCoordinates
    );
  }

  private synchronizeMarkers(): void {
    for (
      const marker
      of this.markers.values()
    ) {
      marker.remove();
    }
  
    this.markers.clear();
    this.addMarkers();
    this.updateMarkerVisibility();
  }

  private resetMapView(
    duration = 900
  ): void {
    this.map?.fitBounds(
      [
        [
          -170,
          -55
        ],
        [
          180,
          75
        ]
      ],
      {
        padding: 45,
        duration
      }
    );
  }

  private addMarkers(): void {
    if (
      !this.map ||
      this.markers.size > 0
    ) {
      return;
    }

    for (const place of this.places) {
      const markerElement =
        this.createMarkerElement(place);

      const marker =
        new Marker({
          element: markerElement,
          anchor: 'bottom'
        })
          .setLngLat(
            place.coordinates
          )
          .addTo(this.map);

      this.markers.set(
        place.id,
        marker
      );
    }
  }

  private createMarkerElement(
    place: UniversePlace
  ): HTMLButtonElement {
    const markerElement =
      document.createElement('button');
  
    markerElement.type =
      'button';
  
    markerElement.className =
      `universe-marker ` +
      `universe-marker--${place.status}`;
  
    markerElement.title =
      `${place.country} — ` +
      `${this.statusLabel(place.status)}`;
  
    markerElement.setAttribute(
      'aria-label',
      markerElement.title
    );
  
    const pulseElement =
      document.createElement('span');
  
    pulseElement.className =
      'universe-marker__pulse';
  
    const pinElement =
      document.createElement('span');
  
    pinElement.className =
      'universe-marker__pin';
  
    const emojiElement =
      document.createElement('span');
  
    emojiElement.className =
      'universe-marker__emoji';
  
    /**
     * textContent prevents stored database values
     * from being interpreted as executable HTML.
     */
    emojiElement.textContent =
      place.emoji;
  
    pinElement.appendChild(
      emojiElement
    );
  
    markerElement.append(
      pulseElement,
      pinElement
    );
  
    markerElement.addEventListener(
      'click',
      event => {
        event.stopPropagation();
    
        /**
         * Existing destinations cannot be selected while
         * the traveler is placing a new pin.
         */
        if (this.isPlaceFormOpen) {
          return;
        }
    
        this.zone.run(
          () => {
            this.selectPlace(place);
          }
        );
      }
    );
  
    return markerElement;
  }

  private updateMarkerVisibility(): void {
    for (const place of this.places) {
      const marker =
        this.markers.get(place.id);

      if (!marker) {
        continue;
      }

      const shouldDisplay =
        this.activeFilter === 'all' ||
        place.status ===
          this.activeFilter;

      marker
        .getElement()
        .style.display =
          shouldDisplay
            ? ''
            : 'none';
    }
  }

  openMemories(): void {
    if (!this.selectedPlace) {
      return;
    }
  
    this.isViewingMemories =
      true;
  }
  
  closeMemories(): void {
    this.isViewingMemories =
      false;
  }
  
  /**
   * Updates the visible journey count immediately
   * after MongoDB confirms the photo upload.
   */
  handlePhotoUploaded(): void {
    const selectedPlaceId =
      this.selectedPlace?.id;
  
    if (!selectedPlaceId) {
      return;
    }
  
    this.places =
      this.places.map(
        place => {
          if (
            place.id !==
            selectedPlaceId
          ) {
            return place;
          }
  
          return {
            ...place,
  
            photos:
              place.photos + 1
          };
        }
      );
  
    this.selectedPlace =
      this.places.find(
        place =>
          place.id ===
          selectedPlaceId
      );
  }
}