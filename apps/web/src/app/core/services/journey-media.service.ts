import {
    Injectable
  } from '@angular/core';
  
  import {
    HttpClient,
    HttpEvent,
    HttpHeaders
  } from '@angular/common/http';
  
  import {
    Observable
  } from 'rxjs';
  
  import {
    environment
  } from '../../../environments/environment';
  
  export interface JourneyPhoto {
    id: string;
    journeyId: string;
    mediaType: 'photo';
    url: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    caption: string;
    takenAt: string | null;
  
    coordinates: {
      longitude: number | null;
      latitude: number | null;
    } | null;
  
    isCover: boolean;
    uploadedAt: string | null;
    createdAt: string;
  }
  
  export interface CreatePhotoUploadRequest {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    caption?: string;
    takenAt?: string | null;
  
    coordinates?: {
      longitude: number;
      latitude: number;
    } | null;
  }
  
  export interface PhotoUploadUrlResponse {
    mediaId: string;
    uploadUrl: string;
    method: 'PUT';
  
    headers: {
      'Content-Type': string;
    };
  
    expiresInSeconds: number;
  }
  
  @Injectable({
    providedIn: 'root'
  })
  export class JourneyMediaService {
    private readonly journeyUrl =
      `${environment.apiUrl}/journeys`;
  
    constructor(
      private readonly http:
        HttpClient
    ) {}
  
    /**
     * Requests permission to upload one photo for an
     * authenticated user's journey.
     */
    createPhotoUploadUrl(
      journeyId: string,
      request: CreatePhotoUploadRequest
    ): Observable<PhotoUploadUrlResponse> {
      return this.http.post<PhotoUploadUrlResponse>(
        `${this.journeyUrl}/` +
        `${journeyId}/media/upload-url`,
  
        request,
  
        {
          withCredentials: true
        }
      );
    }
  
    /**
     * Uploads the file directly to the private S3
     * bucket using the temporary presigned URL.
     *
     * The Dash backend does not receive the image data.
     */
    uploadPhotoToS3(
      uploadUrl: string,
      file: File,
      mimeType: string
    ): Observable<HttpEvent<string>> {
      return this.http.put(
        uploadUrl,
        file,
        {
          headers:
            new HttpHeaders({
              'Content-Type':
                mimeType
            }),
  
          observe:
            'events',
  
          reportProgress:
            true,
  
          responseType:
            'text'
        }
      );
    }
  
    /**
     * Tells the backend that the direct S3 upload has
     * finished. The backend verifies the object before
     * marking it ready.
     */
    completePhotoUpload(
      journeyId: string,
      mediaId: string
    ): Observable<{
      photo: JourneyPhoto;
    }> {
      return this.http.post<{
        photo: JourneyPhoto;
      }>(
        `${this.journeyUrl}/` +
        `${journeyId}/media/` +
        `${mediaId}/complete`,
  
        {},
  
        {
          withCredentials: true
        }
      );
    }
  
    /**
     * Loads the private photo gallery for one journey.
     * Each returned URL is short-lived.
     */
    getJourneyPhotos(
      journeyId: string
    ): Observable<{
      photos: JourneyPhoto[];
    }> {
      return this.http.get<{
        photos: JourneyPhoto[];
      }>(
        `${this.journeyUrl}/` +
        `${journeyId}/media`,
  
        {
          withCredentials: true
        }
      );
    }
  }