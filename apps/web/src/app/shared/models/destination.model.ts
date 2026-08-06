import {
    JourneyType
  } from './journey-theme.model';
  
  export type DestinationWeather =
    | 'cold'
    | 'cool'
    | 'mild'
    | 'warm'
    | 'hot'
    | 'tropical';
  
  export type DestinationTerrain =
    | 'mountains'
    | 'forest'
    | 'water'
    | 'beach'
    | 'city'
    | 'historic'
    | 'theme-parks';
  
  export interface Destination {
    id: string;
  
    name: string;
  
    state?: string;
  
    country: string;
  
    description: string;
  
    image: string;
  
    /**
     * Approximate driving time from the current V1 home base.
     * Later, this should be calculated from the user's location.
     */
    driveTimeHours?: number;
  
    /**
     * Approximate total budget for a short trip.
     * This is temporary V1 data, not a live price.
     */
    estimatedBudget: number;
  
    weather: DestinationWeather[];
  
    terrain: DestinationTerrain[];
  
    activities: string[];
  
    bestSeasons: string[];
  
    journeyTypes: JourneyType[];
  
    familyFriendly: boolean;
  
    tags: string[];
  }