import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';

import {
  Map as MapLibreMap,
  Marker,
  NavigationControl
} from 'maplibre-gl';

type UniverseStatus =
  | 'visited'
  | 'planned'
  | 'dreaming';

type UniverseFilter =
  | UniverseStatus
  | 'all';

type UniverseView =
  | 'map'
  | 'list';

interface UniversePlace {
  id: string;
  country: string;
  region: string;
  locations: string;
  date: string;
  description: string;
  status: UniverseStatus;
  coordinates: [number, number];
  emoji: string;
  journeys: number;
  photos: number;
  stories: number;
}

@Component({
  selector: 'app-universe-map',

  imports: [],

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
  implements AfterViewInit, OnDestroy {

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

  activeFilter: UniverseFilter =
    'all';

  viewMode: UniverseView =
    'map';

  selectedPlace?: UniversePlace;

  /**
   * Temporary development data.
   *
   * This will eventually come from MongoDB journeys,
   * stories and the traveler profile.
   */
  readonly places: UniversePlace[] = [
    {
      id: 'peru-2025',
      country: 'Peru',
      region: 'South America',
      locations:
        'Cusco · Machu Picchu · Lima',
      date: 'July 2025',
      description:
        'Ancient cities, mountain landscapes and unforgettable discoveries across Peru.',
      status: 'visited',
      coordinates: [
        -75.0152,
        -9.19
      ],
      emoji: '🇵🇪',
      journeys: 1,
      photos: 87,
      stories: 3
    },
    {
      id: 'india-2026',
      country: 'India',
      region: 'Asia',
      locations:
        'Mumbai · Andaman · Bhubaneswar · Meghalaya',
      date: 'Apr–May 2026',
      description:
        'A journey filled with culture, food, coastlines and remarkable landscapes.',
      status: 'visited',
      coordinates: [
        78.9629,
        20.5937
      ],
      emoji: '🇮🇳',
      journeys: 1,
      photos: 134,
      stories: 5
    },
    {
      id: 'guatemala-2026',
      country: 'Guatemala',
      region: 'Central America',
      locations:
        'Antigua · Lake Atitlán · Tikal',
      date: 'July 2026',
      description:
        'Colorful towns, volcanic lakes and the ancient stories of the Maya world.',
      status: 'visited',
      coordinates: [
        -90.2308,
        15.7835
      ],
      emoji: '🇬🇹',
      journeys: 1,
      photos: 62,
      stories: 3
    },
    {
      id: 'japan-2027',
      country: 'Japan',
      region: 'Asia',
      locations:
        'Tokyo · Kyoto · Osaka',
      date: 'Planned for 2027',
      description:
        'A future journey through modern cities, historic neighborhoods and local flavors.',
      status: 'planned',
      coordinates: [
        138.2529,
        36.2048
      ],
      emoji: '🇯🇵',
      journeys: 1,
      photos: 0,
      stories: 0
    },
    {
      id: 'iceland-dream',
      country: 'Iceland',
      region: 'Europe',
      locations:
        'Reykjavík · South Coast',
      date: 'Someday',
      description:
        'A dream of waterfalls, glaciers, northern lights and dramatic open landscapes.',
      status: 'dreaming',
      coordinates: [
        -19.0208,
        64.9631
      ],
      emoji: '🇮🇸',
      journeys: 0,
      photos: 0,
      stories: 0
    }
  ];

  constructor(
    private readonly zone: NgZone
  ) {
    this.selectedPlace =
      this.places[0];
  }

  ngAfterViewInit(): void {
    this.createMap();
  }

  ngOnDestroy(): void {
    this.markers.clear();
    this.map?.remove();
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
        /**
         * Wait until the map canvas and style are ready
         * before attaching the destination markers.
         */
        this.addMarkers();
        this.resetMapView(0);
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
  
    markerElement.type = 'button';
  
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
  
    markerElement.innerHTML = `
      <span
        class="universe-marker__pulse">
      </span>
  
      <span
        class="universe-marker__pin">
  
        <span
          class="universe-marker__emoji">
          ${place.emoji}
        </span>
  
      </span>
    `;
  
    markerElement.addEventListener(
      'click',
      () => {
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
}