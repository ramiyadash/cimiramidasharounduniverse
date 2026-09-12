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

  export type JourneyStoryStatus =
    | 'draft'
    | 'completed';

  export interface JourneyStorySection {
    id: string;
    heading: string;
    date: string | null;
    narrative: string;
    mediaIds: string[];
  }

  export interface JourneyStory {
    id: string;
    journeyId: string;
    title: string;
    introduction: string;
    coverMediaId: string | null;
    sections: JourneyStorySection[];
    status: JourneyStoryStatus;
    visibility: 'private';
    createdAt: string;
    updatedAt: string;
  }

  export interface SaveJourneyStorySection {
    heading: string;
    date: string | null;
    narrative: string;
    media: string[];
  }

  export interface SaveJourneyStoryRequest {
    title: string;
    introduction: string;
    coverMedia: string | null;
    sections: SaveJourneyStorySection[];
    status: JourneyStoryStatus;
  }

  @Injectable({
    providedIn: 'root'
  })
  export class JourneyStoryService {
    private readonly journeyUrl =
      `${environment.apiUrl}/journeys`;

    constructor(
      private readonly http:
        HttpClient
    ) {}

    getJourneyStory(
      journeyId: string
    ): Observable<{
      story: JourneyStory | null;
    }> {
      return this.http.get<{
        story: JourneyStory | null;
      }>(
        `${this.journeyUrl}/` +
        `${journeyId}/story`,

        {
          withCredentials: true
        }
      );
    }

    saveJourneyStory(
      journeyId: string,
      request: SaveJourneyStoryRequest
    ): Observable<{
      story: JourneyStory;
    }> {
      return this.http.put<{
        story: JourneyStory;
      }>(
        `${this.journeyUrl}/` +
        `${journeyId}/story`,

        request,

        {
          withCredentials: true
        }
      );
    }

    deleteJourneyStory(
      journeyId: string
    ): Observable<{
      message: string;
    }> {
      return this.http.delete<{
        message: string;
      }>(
        `${this.journeyUrl}/` +
        `${journeyId}/story`,

        {
          withCredentials: true
        }
      );
    }
  }