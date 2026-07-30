import { JourneyType } from './journey-theme.model';

export interface TravelCompanionContext {

    // Current journey being planned.
    journeyType?: JourneyType;

    // General preferences.
    terrain?: string;

    atmosphere?: string;

    destinationStyle?: string;

    transportation?: string;

    distancePreference?: string;

    budget?: string;

    duration?: string;

    season?: string;

    // Preferred climate or weather for this trip.
    weatherPreference?: string; 

    // Growing lists.
    activities: string[];

    interests: string[];

    cuisines: string[];

}