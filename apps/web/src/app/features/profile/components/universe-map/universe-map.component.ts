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

interface UniversePlace {
  id: string;
  country: string;
  locations: string;
  date: string;
  status: UniverseStatus;
  coordinates: [number, number];
  emoji: string;
  journeys: number;
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
   * MapLibre creates its marker elements dynamically.
   * Disabling style encapsulation allows this component's
   * marker styles to reach those generated elements.
   *
   * All classes are prefixed with "universe-" to prevent
   * them from affecting other application components.
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

  selectedPlace?: UniversePlace;

  /**
   * Temporary local data for our first visual milestone.
   *
   * Later, this will come from Journey, Story and
   * TravelerProfile records in MongoDB.
   */
  readonly places: UniversePlace[] = [
    {
      id: 'peru-2025',
      country: 'Peru',
      locations:
        'Cusco · Machu Picchu · Lima',
      date: 'July 2025',
      status: 'visited',
      coordinates: [
        -75.0152,
        -9.19
      ],
      emoji: '🇵🇪',
      journeys: 1,
      stories: 3
    },
    {
      id: 'india-2026',
      country: 'India',
      locations:
        'Mumbai · Andaman · Bhubaneswar · Meghalaya',
      date: 'Apr–May 2026',
      status: 'visited',
      coordinates: [
        78.9629,
        20.5937
      ],
      emoji: '🇮🇳',
      journeys: 1,
      stories: 5
    },
    {
      id: 'guatemala-2026',
      country: 'Guatemala',
      locations:
        'Antigua · Lake Atitlán · Tikal',
      date: 'July 2026',
      status: 'visited',
      coordinates: [
        -90.2308,
        15.7835
      ],
      emoji: '🇬🇹',
      journeys: 1,
      stories: 3
    },
    {
      id: 'japan-2027',
      country: 'Japan',
      locations:
        'Tokyo · Kyoto · Osaka',
      date: '2027',
      status: 'planned',
      coordinates: [
        138.2529,
        36.2048
      ],
      emoji: '🇯🇵',
      journeys: 1,
      stories: 0
    },
    {
      id: 'iceland-dream',
      country: 'Iceland',
      locations:
        'Reykjavík · South Coast',
      date: 'Someday',
      status: 'dreaming',
      coordinates: [
        -19.0208,
        64.9631
      ],
      emoji: '🇮🇸',
      journeys: 0,
      stories: 0
    }
  ];

  constructor(
    private readonly zone: NgZone
  ) {}

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

  setFilter(
    filter: UniverseFilter
  ): void {
    this.activeFilter = filter;
    this.selectedPlace = undefined;

    this.updateMarkerVisibility();

    this.map?.flyTo({
      center: [
        10,
        18
      ],
      zoom: 1.25,
      duration: 900
    });
  }

  selectPlace(
    place: UniversePlace
  ): void {
    this.selectedPlace = place;

    this.map?.flyTo({
      center:
        place.coordinates,
      zoom: 3.4,
      duration: 1200,
      essential: true
    });
  }

  closePlace(): void {
    this.selectedPlace = undefined;

    this.map?.flyTo({
      center: [
        10,
        18
      ],
      zoom: 1.25,
      duration: 900
    });
  }

  statusLabel(
    status: UniverseStatus
  ): string {
    switch (status) {
      case 'visited':
        return 'Visited';

      case 'planned':
        return 'Planning';

      case 'dreaming':
        return 'Dreaming';
    }
  }

  private createMap(): void {
    this.map =
      new MapLibreMap({
        container:
          this.mapContainer.nativeElement,
  
        /**
         * OpenFreeMap provides a full vector map based
         * on OpenStreetMap data without requiring an
         * application API key.
         */
        style:
          'https://tiles.openfreemap.org/styles/liberty',
  
        center: [
          5,
          18
        ],
  
        zoom: 1.8,
  
        minZoom: 0.8,
  
        maxZoom: 8,
  
        attributionControl: false
      });
  
    this.map.addControl(
      new NavigationControl({
        showCompass: false,
        showZoom: true
      }),
      'top-right'
    );

    this.addMarkers();
  
    /**
     * The OpenFreeMap style is a normal flat map.
     * Once its style loads, switch its projection
     * into the interactive globe used by My Universe.
     */
    this.map.on(
      'style.load',
      () => {
        this.map?.setProjection({
          type: 'globe'
        });
    
        /**
         * DOM markers do not depend on the vector tiles
         * finishing their download. Add them as soon as
         * the map style is ready.
         */
        if (this.markers.size === 0) {
          this.addMarkers();
        }
      }
    );
  
    /**
     * Keep this during development. If a tile,
     * style or worker fails, the exact reason will
     * appear in the browser console.
     */
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

    markerElement.setAttribute(
      'aria-label',
      `${place.country}: ` +
      `${this.statusLabel(place.status)}`
    );

    markerElement.innerHTML = `
      <span
        class="universe-marker__pulse">
      </span>

      <span
        class="universe-marker__core">
        ${place.emoji}
      </span>
    `;

    markerElement.addEventListener(
      'click',
      () => {
        /**
         * The marker is created outside Angular's
         * template, so explicitly return to Angular's
         * zone before updating the selected card.
         */
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