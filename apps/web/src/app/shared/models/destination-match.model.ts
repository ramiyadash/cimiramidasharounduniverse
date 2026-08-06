import {
    Destination
  } from './destination.model';
  
  export interface DestinationMatch {
    destination: Destination;
    score: number;
    reasons: string[];
  }