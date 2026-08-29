import {
    Injectable
  } from '@angular/core';
  
  import {
    HttpClient
  } from '@angular/common/http';
  
  import {
    Observable,
    map
  } from 'rxjs';
  
  import {
    environment
  } from '../../../environments/environment';
  
  export type UniverseStatus =
    | 'visited'
    | 'planned'
    | 'dreaming';
  
  export type JourneyType =
    | 'weekend'
    | 'family'
    | 'adventure'
    | 'food';
  
  export interface UniversePlace {
    id: string;
    journeyId: string;
    title: string;
    journeyType: JourneyType;
    country: string;
    countryCode: string | null;
    region: string | null;
    locations: string;
    description: string;
    date: string;
    startDate: string | null;
    endDate: string | null;
    status: UniverseStatus;
    coordinates: [number, number];
    emoji: string;
    journeys: number;
    photos: number;
    stories: number;
  }
  
  export interface UniverseSummary {
    visited: number;
    planned: number;
    dreaming: number;
  }
  
  export interface UniverseResponse {
    places: UniversePlace[];
    summary: UniverseSummary;
  }
  
  export interface CreateUniverseJourneyRequest {
    title: string;
    journeyType: JourneyType;
  
    universe: {
      status: UniverseStatus;
      country: string;
      countryCode: string;
      region: string;
      locations: string[];
      description: string;
      dateLabel: string;
      startDate: string | null;
      endDate: string | null;
      emoji: string;
  
      coordinates: {
        longitude: number;
        latitude: number;
      };
    };
  }
  
  interface UniverseApiPlace
    extends Omit<
      UniversePlace,
      'locations'
    > {
    locations: string[];
  }
  
  interface UniverseApiResponse {
    places: UniverseApiPlace[];
    summary: UniverseSummary;
  }
  
  @Injectable({
    providedIn: 'root'
  })
  export class JourneyService {
    private readonly journeyUrl =
      `${environment.apiUrl}/journeys`;
  
    constructor(
      private readonly http:
        HttpClient
    ) {}
  
    getUniverseJourneys():
      Observable<UniverseResponse> {
      return this.http
        .get<UniverseApiResponse>(
          `${this.journeyUrl}/universe`,
          {
            withCredentials: true
          }
        )
        .pipe(
          map(
            response => ({
              summary:
                response.summary,
  
              places:
                response.places.map(
                  place =>
                    this.mapUniversePlace(
                      place
                    )
                )
            })
          )
        );
    }
  
    /**
     * Creates a journey for the authenticated user.
     *
     * No user ID is sent from Angular.
     */
    createJourney(
      request:
        CreateUniverseJourneyRequest
    ): Observable<UniversePlace> {
      return this.http
        .post<{
          place: UniverseApiPlace;
        }>(
          this.journeyUrl,
          request,
          {
            withCredentials: true
          }
        )
        .pipe(
          map(
            response =>
              this.mapUniversePlace(
                response.place
              )
          )
        );
    }
  
    /**
     * Updates an existing journey.
     *
     * The backend verifies that journeyId belongs
     * to the authenticated user before updating it.
     */
    updateJourney(
      journeyId: string,
      request:
        CreateUniverseJourneyRequest
    ): Observable<UniversePlace> {
      return this.http
        .patch<{
          place: UniverseApiPlace;
        }>(
          `${this.journeyUrl}/${journeyId}`,
          request,
          {
            withCredentials: true
          }
        )
        .pipe(
          map(
            response =>
              this.mapUniversePlace(
                response.place
              )
          )
        );
    }
  
    /**
     * Converts the structured locations returned by the
     * API into the existing display-friendly UI label.
     */
    private mapUniversePlace(
      place: UniverseApiPlace
    ): UniversePlace {
      return {
        ...place,
  
        locations:
          place.locations.join(
            ' · '
          )
      };
    }
  }