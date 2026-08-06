import {
    Injectable
  } from '@angular/core';
  
  import {
    Destination
  } from '../models/destination.model';
  
  import {
    DestinationMatch
  } from '../models/destination-match.model';
  
  import {
    TravelCompanionContext
  } from '../models/travel-companion-context.model';
  
  @Injectable({
    providedIn: 'root'
  })
  export class DestinationMatcherService {
  
    /**
     * Scores every known destination against Dash's current
     * understanding of the traveler.
     *
     * The destinations are returned from highest score to lowest.
     */
    rankDestinations(
      destinations: Destination[],
      context: TravelCompanionContext
    ): DestinationMatch[] {
      return destinations
        .map(
          (
            destination: Destination
          ): DestinationMatch =>
            this.scoreDestination(
              destination,
              context
            )
        )
        .sort(
          (
            first: DestinationMatch,
            second: DestinationMatch
          ): number =>
            second.score - first.score
        );
    }
  
    /**
     * Calculates how closely one destination matches
     * the current TravelCompanionContext.
     *
     * Scoring weights:
     *
     * Journey type:        20 points
     * Terrain:             20 points
     * Weather:             15 points
     * Distance:            15 points
     * Budget:              15 points
     * Activities/interests 15 points
     *
     * A category only contributes to possiblePoints when
     * Dash actually knows that preference.
     *
     * Example:
     *
     * If Dash only knows journey type and terrain:
     *
     * possiblePoints = 40
     *
     * A destination matching both receives:
     *
     * 40 / 40 = 100%
     */
    private scoreDestination(
      destination: Destination,
      context: TravelCompanionContext
    ): DestinationMatch {
      // Total points earned by the destination.
      let earnedPoints: number = 0;
  
      // Total points currently available based on
      // preferences Dash has learned.
      let possiblePoints: number = 0;
  
      // Human-readable explanations shown in the UI.
      const reasons: string[] = [];
  
      /**
       * JOURNEY TYPE — 20 POINTS
       *
       * Examples:
       * weekend
       * family
       * adventure
       * food
       */
      if (context.journeyType) {
        possiblePoints += 20;
  
        if (
          destination.journeyTypes.includes(
            context.journeyType
          )
        ) {
          earnedPoints += 20;
  
          reasons.push(
            `Fits a ${this.formatValue(
              context.journeyType
            )} journey`
          );
        }
      }
  
      /**
       * TERRAIN — 20 POINTS
       *
       * Terrain receives a high weight because it strongly
       * affects whether the destination matches the trip idea.
       *
       * Examples:
       * mountains
       * water
       * beach
       * forest
       * city
       */
      if (context.terrain) {
        possiblePoints += 20;
  
        const normalizedTerrain:
          Destination['terrain'][number] =
          this.normalizeTerrain(
            context.terrain
          );
  
        if (
          destination.terrain.includes(
            normalizedTerrain
          )
        ) {
          earnedPoints += 20;
  
          reasons.push(
            `Matches ${this.formatValue(
              context.terrain
            )}`
          );
        }
      }
  
      /**
       * WEATHER — 15 POINTS
       *
       * Converts conversational values such as
       * "warm weather" into the knowledge-base value "warm".
       */
      if (context.weatherPreference) {
        possiblePoints += 15;
  
        const normalizedWeather: string =
          this.normalizeWeather(
            context.weatherPreference
          );
  
        if (
          destination.weather.includes(
            normalizedWeather as
              Destination['weather'][number]
          )
        ) {
          earnedPoints += 15;
  
          reasons.push(
            `${this.capitalize(
              normalizedWeather
            )} weather`
          );
        }
      }
  
      /**
       * DISTANCE — 15 POINTS
       *
       * Supports values such as:
       * "within 4 hours"
       * "nearby"
       * "farther away"
       */
      if (context.distancePreference) {
        possiblePoints += 15;
  
        const maximumDriveTime:
          number | null =
          this.extractMaximumDriveTime(
            context.distancePreference
          );
  
        /**
         * Numeric distance preference:
         *
         * Example:
         * "within 4 hours"
         */
        if (
          maximumDriveTime !== null &&
          destination.driveTimeHours !==
            undefined &&
          destination.driveTimeHours <=
            maximumDriveTime
        ) {
          earnedPoints += 15;
  
          reasons.push(
            `${destination.driveTimeHours} hours away`
          );
        }
  
        /**
         * General nearby preference.
         *
         * For V1, nearby is defined as 3 hours or less.
         */
        else if (
          context.distancePreference ===
            'nearby' &&
          destination.driveTimeHours !==
            undefined &&
          destination.driveTimeHours <= 3
        ) {
          earnedPoints += 15;
  
          reasons.push('Nearby');
        }
  
        /**
         * General farther-away preference.
         *
         * For V1, farther away is defined as more than 4 hours.
         */
        else if (
          context.distancePreference ===
            'farther away' &&
          destination.driveTimeHours !==
            undefined &&
          destination.driveTimeHours > 4
        ) {
          earnedPoints += 15;
  
          reasons.push(
            'Fits a farther-away trip'
          );
        }
      }
  
      /**
       * BUDGET — 15 POINTS
       *
       * A destination receives the full points when its
       * estimated V1 budget is at or below the user's budget.
       */
      if (context.budget) {
        possiblePoints += 15;
  
        const maximumBudget:
          number | null =
          this.extractBudget(
            context.budget
          );
  
        if (
          maximumBudget !== null &&
          destination.estimatedBudget <=
            maximumBudget
        ) {
          earnedPoints += 15;
  
          reasons.push(
            `Around $${destination.estimatedBudget}`
          );
        }
      }
  
      /**
       * ACTIVITIES / INTERESTS / CUISINES — 15 POINTS
       *
       * All three arrays represent things the traveler wants
       * the destination to offer.
       *
       * Examples:
       * nightlife
       * hiking
       * museums
       * coffee
       * street food
       */
      const desiredActivities: string[] = [
        ...context.activities,
        ...context.interests,
        ...context.cuisines
      ];
  
      if (desiredActivities.length) {
        possiblePoints += 15;
  
        const matchingActivities:
          string[] =
          desiredActivities.filter(
            (
              preference: string
            ): boolean =>
              this.matchesDestinationText(
                destination,
                preference
              )
          );
  
        /**
         * This category supports partial credit.
         *
         * Example:
         *
         * Traveler wants:
         * nightlife
         * museums
         * coffee
         *
         * Destination matches:
         * nightlife
         * museums
         *
         * Activity points:
         *
         * 15 × (2 / 3) = 10 points
         */
        if (matchingActivities.length) {
          earnedPoints +=
            15 *
            (
              matchingActivities.length /
              desiredActivities.length
            );
  
          reasons.push(
            ...matchingActivities.map(
              (
                activity: string
              ): string =>
                this.capitalize(activity)
            )
          );
        }
      }
  
      /**
       * Convert earned points into a percentage.
       *
       * Example:
       *
       * earnedPoints = 70
       * possiblePoints = 85
       *
       * score = 82%
       */
      const score: number =
        possiblePoints > 0
          ? Math.round(
              (
                earnedPoints /
                possiblePoints
              ) * 100
            )
          : 0;
  
      return {
        destination,
        score,
  
        /**
         * Avoid duplicate reasons and keep the card concise.
         */
        reasons:
          this.unique(reasons).slice(0, 4)
      };
    }
  
    /**
     * Checks the destination's searchable metadata for
     * an activity, interest, or cuisine preference.
     */
    private matchesDestinationText(
      destination: Destination,
      preference: string
    ): boolean {
      const normalizedPreference: string =
        preference.toLowerCase();
  
      const searchableValues: string[] = [
        ...destination.activities,
        ...destination.tags,
        ...destination.terrain,
        destination.description
      ].map(
        (value: string): string =>
          value.toLowerCase()
      );
  
      return searchableValues.some(
        (value: string): boolean =>
          value.includes(
            normalizedPreference
          ) ||
          normalizedPreference.includes(
            value
          )
      );
    }
  
    /**
     * Converts values stored by the companion into
     * supported DestinationTerrain values.
     */
    private normalizeTerrain(
      terrain: string
    ): Destination['terrain'][number] {
      const terrainMap: Record<
        string,
        Destination['terrain'][number]
      > = {
        water: 'water',
        beach: 'beach',
        mountains: 'mountains',
        mountain: 'mountains',
        forest: 'forest',
        city: 'city',
        coastal: 'water',
        nature: 'forest'
      };
  
      return (
        terrainMap[
          terrain.toLowerCase()
        ] ?? 'city'
      );
    }
  
    /**
     * Converts conversational weather values such as:
     *
     * "warm weather" → "warm"
     * "cold climate" → "cold"
     */
    private normalizeWeather(
      weatherPreference: string
    ): string {
      return weatherPreference
        .toLowerCase()
        .replace(' weather', '')
        .replace(' climate', '')
        .trim();
    }
  
    /**
     * Extracts a number from a distance preference.
     *
     * Example:
     *
     * "within 4 hours" → 4
     */
    private extractMaximumDriveTime(
      distancePreference: string
    ): number | null {
      const match:
        | RegExpMatchArray
        | null =
        distancePreference.match(
          /(\d+(?:\.\d+)?)/
        );
  
      return match
        ? Number(match[1])
        : null;
    }
  
    /**
     * Extracts a numeric budget from a stored string.
     *
     * Examples:
     *
     * "$500" → 500
     * "$1,200" → 1200
     */
    private extractBudget(
      budget: string
    ): number | null {
      const match:
        | RegExpMatchArray
        | null =
        budget.match(
          /(\d+(?:,\d{3})*(?:\.\d{1,2})?)/
        );
  
      if (!match) {
        return null;
      }
  
      return Number(
        match[1].replace(/,/g, '')
      );
    }
  
    /**
     * Converts stored values into readable text.
     *
     * Example:
     *
     * "food-and-culture"
     * becomes
     * "food and culture"
     */
    private formatValue(
      value: string
    ): string {
      return value.replace(/-/g, ' ');
    }
  
    /**
     * Capitalizes the first character of UI reasons.
     */
    private capitalize(
      value: string
    ): string {
      return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
      );
    }
  
    /**
     * Removes duplicate reason labels.
     */
    private unique(
      values: string[]
    ): string[] {
      return [...new Set(values)];
    }
  }