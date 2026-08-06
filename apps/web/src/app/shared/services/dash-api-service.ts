import {
    HttpClient
  } from '@angular/common/http';
  
  import {
    Injectable
  } from '@angular/core';
  
  import {
    Observable
  } from 'rxjs';
  
  export interface TravelChatRequest {
    conversationId: string;
    message: string;
  }
  
  export interface TravelChatResponse {
    conversationId: string;
    reply: string;
  }
  
  @Injectable({
    providedIn: 'root'
  })
  export class DashApiService {
  
    private readonly apiUrl: string =
      'http://localhost:3001/api/chat';
  
    constructor(
      private readonly http:
        HttpClient
    ) {}
  
    sendMessage(
      request: TravelChatRequest
    ): Observable<TravelChatResponse> {
      return this.http.post<TravelChatResponse>(
        this.apiUrl,
        request
      );
    }
  }