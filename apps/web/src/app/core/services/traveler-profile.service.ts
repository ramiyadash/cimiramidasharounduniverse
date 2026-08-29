import {
    Injectable
  } from '@angular/core';
  
  import {
    HttpClient
  } from '@angular/common/http';
  
  import {
    Observable
  } from 'rxjs';
  
  import {
    environment
  } from '../../../environments/environment';
  
  export interface TravelerDNA {
    preferredTerrains: string[];
    preferredActivities: string[];
    preferredWeather: string[];
    preferredTravelStyles: string[];
  
    typicalBudgetRange: {
      min: number | null;
      max: number | null;
    };
  
    typicalTripDurationDays:
      number | null;
  }
  
  export interface TravelerProfile {
    id: string | null;
    travelerDNA: TravelerDNA;
    updatedAt: string | null;
  }
  
  export interface TravelerProfileResponse {
    travelerProfile:
      TravelerProfile;
  
    personalized:
      boolean;
  }
  
  export interface UpdateTravelerProfileResponse
    extends TravelerProfileResponse {
    message: string;
  }
  
  @Injectable({
    providedIn: 'root'
  })
  export class TravelerProfileService {
    private readonly profileUrl =
      `${environment.apiUrl}/traveler-profile`;
  
    constructor(
      private readonly http:
        HttpClient
    ) {}
  
    getTravelerProfile():
      Observable<TravelerProfileResponse> {
      return this.http
        .get<TravelerProfileResponse>(
          this.profileUrl,
          {
            withCredentials: true
          }
        );
    }
  
    updateTravelerProfile(
      travelerDNA: TravelerDNA
    ): Observable<
      UpdateTravelerProfileResponse
    > {
      return this.http
        .patch<
          UpdateTravelerProfileResponse
        >(
          this.profileUrl,
  
          {
            travelerDNA
          },
  
          {
            withCredentials: true
          }
        );
    }
  }