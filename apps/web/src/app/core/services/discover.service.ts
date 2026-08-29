import {
    Injectable
  } from '@angular/core';
  
  import {
    HttpClient,
    HttpParams
  } from '@angular/common/http';
  
  import {
    Observable
  } from 'rxjs';
  
  import {
    environment
  } from '../../../environments/environment';
  
  export interface DestinationBudgetRange {
    min: number | null;
    max: number | null;
    currency: string;
  }
  
  export interface DestinationDuration {
    min: number | null;
    max: number | null;
  }
  
  export interface DestinationDiscovery {
    terrains: string[];
    activities: string[];
    weather: string[];
    travelStyles: string[];
    budgetRange: DestinationBudgetRange;
    durationDays: DestinationDuration;
    bestMonths: number[];
  }
  
  export interface DestinationMedia {
    heroImageUrl: string | null;
    heroImageAlt: string | null;
    attribution: string | null;
  }
  
  export interface DiscoverDestination {
    id: string;
    slug: string;
    name: string;
    country: string;
    countryCode: string;
    region: string;
    locations: string[];
    summary: string;
    description: string;
    emoji: string;
    coordinates: [
      number,
      number
    ];
  
    discovery:
      DestinationDiscovery;
  
    media:
      DestinationMedia;
  
    featured: boolean;
    matchScore: number;
    matchReasons: string[];
    isSaved: boolean;
    savedJourneyId: string | null;
  }
  
  export interface DiscoverResponse {
    destinations:
      DiscoverDestination[];
  
    personalized:
      boolean;
  }
  
  export interface SaveDestinationResponse {
    message: string;
    destinationId: string;
    journeyId: string;
    alreadySaved: boolean;
  }
  
  export interface DiscoverFilters {
    style?: string | null;
    terrain?: string | null;
    weather?: string | null;
    limit?: number;
  }
  
  @Injectable({
    providedIn: 'root'
  })
  export class DiscoverService {
    private readonly discoverUrl =
      `${environment.apiUrl}/discover`;
  
    constructor(
      private readonly http:
        HttpClient
    ) {}
  
    /**
     * Loads destination recommendations for the
     * authenticated traveler.
     *
     * No user ID is sent from Angular.
     */
    getDestinations(
      filters: DiscoverFilters = {}
    ): Observable<DiscoverResponse> {
      let params =
        new HttpParams();
  
      if (filters.style) {
        params =
          params.set(
            'style',
            filters.style
          );
      }
  
      if (filters.terrain) {
        params =
          params.set(
            'terrain',
            filters.terrain
          );
      }
  
      if (filters.weather) {
        params =
          params.set(
            'weather',
            filters.weather
          );
      }
  
      if (filters.limit) {
        params =
          params.set(
            'limit',
            filters.limit.toString()
          );
      }
  
      return this.http
        .get<DiscoverResponse>(
          this.discoverUrl,
          {
            params,
            withCredentials: true
          }
        );
    }
  
    /**
     * Saves a catalog destination as a real dreaming
     * Journey in the authenticated user's Universe.
     */
    saveToUniverse(
      destinationId: string
    ): Observable<SaveDestinationResponse> {
      return this.http
        .post<SaveDestinationResponse>(
          `${this.discoverUrl}/` +
          `${destinationId}/save`,
  
          {},
  
          {
            withCredentials: true
          }
        );
    }
  }