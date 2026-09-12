import {
    Injectable
  } from '@angular/core';

  import {
    HttpClient,
    HttpHeaders,
    HttpParams
  } from '@angular/common/http';

  import {
    EMPTY,
    Observable,
    expand,
    map,
    reduce,
    throwError
  } from 'rxjs';

  import {
    environment
  } from '../../../environments/environment';

  export interface GooglePhotosPollingConfiguration {
    pollInterval?: string;
    timeoutIn?: string;
  }

  export interface GooglePhotosPickingSession {
    id: string;
    pickerUri: string;
    mediaItemsSet?: boolean;

    pollingConfig?:
      GooglePhotosPollingConfiguration;
  }

  export type GooglePhotosMediaType =
    | 'PHOTO'
    | 'VIDEO'
    | 'TYPE_UNSPECIFIED';

  export interface GooglePhotosMediaMetadata {
    width?: string;
    height?: string;
  }

  export interface GooglePhotosMediaFile {
    baseUrl: string;
    mimeType: string;
    filename: string;

    mediaFileMetadata?:
      GooglePhotosMediaMetadata;
  }

  export interface GooglePhotosPickedMediaItem {
    id: string;
    createTime: string;
    type: GooglePhotosMediaType;
    mediaFile: GooglePhotosMediaFile;
  }

  export interface GooglePhotosMediaResponse {
    mediaItems:
      GooglePhotosPickedMediaItem[];

    nextPageToken?: string;
  }

  @Injectable({
    providedIn: 'root'
  })
  export class GooglePhotosPickerService {
    private readonly apiUrl =
      'https://photospicker.googleapis.com/v1';

    private readonly pickerScope =
      'https://www.googleapis.com/auth/photospicker.mediaitems.readonly';

    /**
     * The token remains only in browser memory.
     *
     * It is not placed in localStorage, sessionStorage,
     * cookies, MongoDB, or application logs.
     */
    private accessToken:
      string | null =
      null;

    private accessTokenExpiresAt:
      number =
      0;

    constructor(
      private readonly http:
        HttpClient
    ) {}

    /**
     * Requests limited access to only the Google Photos
     * items the traveler explicitly selects.
     */
    requestAccessToken():
      Promise<string> {
      if (
        this.accessToken &&
        Date.now() <
          this.accessTokenExpiresAt
      ) {
        return Promise.resolve(
          this.accessToken
        );
      }

      return new Promise<string>(
        (
          resolve,
          reject
        ): void => {
          const oauth2 =
            window.google
              ?.accounts
              ?.oauth2;

          if (!oauth2) {
            reject(
              new Error(
                'Google authorization could not be loaded.'
              )
            );

            return;
          }

          const tokenClient =
            oauth2.initTokenClient({
              client_id:
                environment.googleClientId,

              scope:
                this.pickerScope,

              include_granted_scopes:
                true,

              callback:
                (
                  response:
                    GoogleOAuthTokenResponse
                ): void => {
                  if (
                    response.error ||
                    !response.access_token
                  ) {
                    reject(
                      new Error(
                        response
                          .error_description ||
                        response.error ||
                        'Google Photos access was not granted.'
                      )
                    );

                    return;
                  }

                  const expiresInSeconds:
                    number =
                    response.expires_in ||
                    3600;

                  this.accessToken =
                    response.access_token;

                  /**
                   * Expire the local copy one minute early
                   * so it is not used near its actual expiry.
                   */
                  this.accessTokenExpiresAt =
                    Date.now() +
                    Math.max(
                      expiresInSeconds - 60,
                      0
                    ) *
                      1000;

                  resolve(
                    response.access_token
                  );
                },

              error_callback:
                (
                  error:
                    GoogleOAuthError
                ): void => {
                  reject(
                    new Error(
                      error.type ===
                        'popup_closed'
                        ? 'Google authorization was closed.'
                        : 'Google authorization could not be completed.'
                    )
                  );
                }
            });

          /**
           * Google will display account selection or
           * consent when required.
           */
          tokenClient
            .requestAccessToken();
        }
      );
    }

    /**
     * Creates the temporary Google Photos selection
     * session after authorization succeeds.
     */
    createSession(
      accessToken: string
    ): Observable<
      GooglePhotosPickingSession
    > {
      return this.http.post<
        GooglePhotosPickingSession
      >(
        `${this.apiUrl}/sessions`,

        {},

        {
          headers:
            this.authorizationHeaders(
              accessToken
            )
        }
      );
    }

    /**
     * Checks whether the traveler has finished selecting
     * items inside Google Photos.
     */
    getSession(
      sessionId: string,
      accessToken: string
    ): Observable<
      GooglePhotosPickingSession
    > {
      return this.http.get<
        GooglePhotosPickingSession
      >(
        `${this.apiUrl}/sessions/${encodeURIComponent(
          sessionId
        )}`,

        {
          headers:
            this.authorizationHeaders(
              accessToken
            )
        }
      );
    }

    /**
     * Retrieves only the media explicitly selected
     * during this picker session.
     */
    getSelectedMedia(
      sessionId: string,
      accessToken: string,
      pageToken?: string
    ): Observable<
      GooglePhotosMediaResponse
    > {
      let params =
        new HttpParams()
          .set(
            'sessionId',
            sessionId
          )
          .set(
            'pageSize',
            100
          );

      if (pageToken) {
        params =
          params.set(
            'pageToken',
            pageToken
          );
      }

      return this.http.get<
        GooglePhotosMediaResponse
      >(
        `${this.apiUrl}/mediaItems`,

        {
          headers:
            this.authorizationHeaders(
              accessToken
            ),

          params
        }
      );
    }

    /**
 * Retrieves every page of media selected during
 * the Google Photos picker session.
 */
getAllSelectedMedia(
    sessionId: string,
    accessToken: string
  ): Observable<
    GooglePhotosPickedMediaItem[]
  > {
    return this.getSelectedMedia(
      sessionId,
      accessToken
    ).pipe(
      expand(
        response =>
          response.nextPageToken
            ? this.getSelectedMedia(
                sessionId,
                accessToken,
                response.nextPageToken
              )
            : EMPTY
      ),

      map(
        response =>
          response.mediaItems || []
      ),

      reduce(
        (
          allItems,
          currentItems
        ) => [
          ...allItems,
          ...currentItems
        ],

        [] as
          GooglePhotosPickedMediaItem[]
      )
    );
  }

  /**
   * Downloads the bytes for one explicitly selected
   * Google photo.
   *
   * Google strips location metadata from =d downloads.
   */
  downloadPhoto(
    item: GooglePhotosPickedMediaItem,
    accessToken: string
  ): Observable<Blob> {
    if (
      item.type !== 'PHOTO'
    ) {
      return throwError(
        () =>
          new Error(
            'Only photos can be imported in this version.'
          )
      );
    }

    return this.http.get(
      `${item.mediaFile.baseUrl}=d`,

      {
        headers:
          this.authorizationHeaders(
            accessToken
          ),

        responseType:
          'blob'
      }
    );
  }

    /**
     * Removes a finished or abandoned temporary picker
     * session from Google.
     */
    deleteSession(
      sessionId: string,
      accessToken: string
    ): Observable<void> {
      return this.http.delete<void>(
        `${this.apiUrl}/sessions/${encodeURIComponent(
          sessionId
        )}`,

        {
          headers:
            this.authorizationHeaders(
              accessToken
            )
        }
      );
    }

    /**
     * Google recommends /autoclose for web applications.
     * It closes the Google Photos tab after the traveler
     * confirms their selection.
     */
    getAutoclosePickerUrl(
      pickerUri: string
    ): string {
      return (
        pickerUri.replace(
          /\/$/,
          ''
        ) +
        '/autoclose'
      );
    }

    clearAccessToken(): void {
      this.accessToken =
        null;

      this.accessTokenExpiresAt =
        0;
    }

    private authorizationHeaders(
      accessToken: string
    ): HttpHeaders {
      return new HttpHeaders({
        Authorization:
          `Bearer ${accessToken}`
      });
    }
  }