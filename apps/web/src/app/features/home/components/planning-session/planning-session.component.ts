import {
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import { JsonPipe } from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  CompanionChoice,
  CompanionMessage,
  CompanionReply,
  JourneyTheme
} from '../../../../shared/models/journey-theme.model';

import {
  TravelCompanionContext
} from
'../../../../shared/models/travel-companion-context.model';

@Component({
  selector: 'app-planning-session',
  imports: [
    JsonPipe,
    FormsModule
  ],
  templateUrl: './planning-session.component.html',
  styleUrl: './planning-session.component.scss'
})
export class PlanningSessionComponent implements OnChanges {

  @Input()
  journey!: JourneyTheme;

  // Stores the entire visible conversation in chronological order.
  conversation: CompanionMessage[] = [];

  context: TravelCompanionContext = {
    activities: [],
    interests: [],
    cuisines: []
  };

  // Stores the text currently entered in the composer.
  messageInput: string = '';

  // Prevents an empty message from being submitted.
  get canSendMessage(): boolean {
    return this.messageInput.trim().length > 0;
  }

  // NEW: Prevents Dash from repeating the reflection
  // after every additional selection.
  private hasShownContextReflection: boolean = false;

  // NEW:
  // Prevents Dash from repeatedly showing the same
  // trip-direction message during one planning session.
  private hasShownTripDirection: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['journey']?.currentValue) {
      this.startConversation();
    }
  }

  /**
   * Starts a fresh conversation whenever the journey changes.
   */
  startConversation(): void {
    // NEW: A new journey should receive a new reflection.
    this.hasShownContextReflection = false;

    // NEW:
  // A new journey should generate a new trip direction.
  this.hasShownTripDirection = false;
  
    this.context = {
      journeyType: this.journey.type,
      activities: [],
      interests: [],
      cuisines: []
    };
  
    this.conversation = [
      {
        sender: 'dash',
        text: this.journey.companionGreeting,
        icon: this.journey.icon,
        choices: this.journey.companionChoices
      }
    ];
  }

  /**
   * Adds the user's selected choice and Dash's next reply
   * to the conversation timeline.
   */
  selectChoice(
    choice: CompanionChoice
  ): void {
    this.removePreviousChoices();
  
    // Dash first learns from the selected option.
    this.learn(choice);
  
    // Add the user's selection to the timeline.
    this.conversation.push({
      sender: 'user',
      text: choice.title,
      icon: choice.icon
    });
  
    // NEW: Dash may briefly summarize what it has learned.
    const contextReflection: string | null =
      this.getContextReflection();
  
    if (contextReflection) {
      this.conversation.push({
        sender: 'dash',
        text: contextReflection,
        icon: this.journey.icon
      });
    }
  
    const reply: CompanionReply =
      this.getCompanionReply(choice);
  
    // Continue with Dash's normal follow-up question.
    this.conversation.push({
      sender: 'dash',
      text: reply.message,
      icon: this.journey.icon,
      choices: reply.followUpChoices
    });
  }

    /**
   * Adds a typed message to the conversation and lets
   * Dash learn from the text using local rules.
   */
  sendMessage(): void {
    const message: string =
      this.messageInput.trim();

    if (!message) {
      return;
    }

    // Old chips should no longer remain active after
    // the traveler begins typing a new response.
    this.removePreviousChoices();

    this.conversation.push({
      sender: 'user',
      text: message
    });

    // Learn from the typed sentence before responding.
    const learnedDetails: string[] =
      this.learnFromMessage(message);

    this.messageInput = '';

    this.conversation.push({
      sender: 'dash',
      text: this.buildTypedMessageReply(
        learnedDetails
      ),
      icon: this.journey.icon
    });
    
    // NEW:
    // Once enough preferences are known, Dash connects
    // them into a possible trip direction.
    const tripDirection: string | null =
      this.getTripDirection();
    
    if (tripDirection) {
      this.conversation.push({
        sender: 'dash',
        text: tripDirection,
        icon: this.journey.icon
      });
    }
  }
    /**
   * Extracts simple travel preferences from typed text.
   *
   * This is intentionally rule-based for now.
   * Later, AI can replace or supplement this method.
   */
    private learnFromMessage(
      message: string
    ): string[] {
      const normalizedMessage: string =
        message.toLowerCase();
    
      const learnedDetails: string[] = [];
    
      this.learnBudgetFromMessage(
        normalizedMessage,
        learnedDetails
      );
    
      this.learnDurationFromMessage(
        normalizedMessage,
        learnedDetails
      );
    
      this.learnDistanceFromMessage(
        normalizedMessage,
        learnedDetails
      );
    
      // NEW: Learn destinations such as mountains,
      // beaches, cities, and nature.
      this.learnTerrainFromMessage(
        normalizedMessage,
        learnedDetails
      );
    
      // NEW: Learn climate preferences such as
      // cold, warm, snowy, or tropical weather.
      this.learnWeatherFromMessage(
        normalizedMessage,
        learnedDetails
      );
    
      this.learnAtmosphereFromMessage(
        normalizedMessage,
        learnedDetails
      );
    
      this.learnActivitiesFromMessage(
        normalizedMessage,
        learnedDetails
      );
    
      return learnedDetails;
    }

  /**
 * Learns budgets written in several natural formats:
 *
 * "under $500"
 * "under 500"
 * "less than 500"
 * "500 budget"
 * "budget of 500"
 */
private learnBudgetFromMessage(
  message: string,
  learnedDetails: string[]
): void {
  const budgetPatterns: RegExp[] = [
    // Examples:
    // "$500"
    // "under $500"
    // "less than $500"
    /\$(\d+(?:,\d{3})*(?:\.\d{1,2})?)/,

    // Examples:
    // "under 500"
    // "less than 500"
    // "budget of 500"
    // "maximum 500"
    /(?:budget(?:\s+of)?|under|below|less\s+than|up\s+to|maximum|max|around|about)\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/,

    // Examples:
    // "500 budget"
    // "500 dollar budget"
    // "500 dollars budget"
    /(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:dollar|dollars|\$)?\s*budget/
  ];

  let amount: string | null = null;

  for (const pattern of budgetPatterns) {
    const match: RegExpMatchArray | null =
      message.match(pattern);

    if (match) {
      amount = match[1].replace(/,/g, '');
      break;
    }
  }

  if (!amount) {
    return;
  }

  this.context.budget = `$${amount}`;

  this.addUnique(
    learnedDetails,
    `a budget of ${this.context.budget}`
  );
}

  private learnDurationFromMessage(
    message: string,
    learnedDetails: string[]
  ): void {
    const durationMatch: RegExpMatchArray | null =
      message.match(
        /(\d+)\s*(day|days|night|nights|week|weeks)/
      );
  
    if (!durationMatch) {
      return;
    }
  
    this.context.duration =
      `${durationMatch[1]} ${durationMatch[2]}`;
  
    learnedDetails.push(
      this.context.duration
    );
  }

  private learnDistanceFromMessage(
    message: string,
    learnedDetails: string[]
  ): void {
    const drivingTimeMatch:
      | RegExpMatchArray
      | null =
      message.match(
        /(?:within|under|less than|no more than)?\s*(\d+)\s*(hour|hours|hr|hrs)(?:\s*(?:away|drive|driving))?/
      );
  
    if (drivingTimeMatch) {
      this.context.distancePreference =
        `within ${drivingTimeMatch[1]} hours`;
  
      learnedDetails.push(
        this.context.distancePreference
      );
  
      return;
    }
  
    if (
      message.includes('nearby') ||
      message.includes('close to home')
    ) {
      this.context.distancePreference =
        'nearby';
  
      learnedDetails.push('nearby');
    }
  
    if (
      message.includes('far away') ||
      message.includes('farther away')
    ) {
      this.context.distancePreference =
        'farther away';
  
      learnedDetails.push('farther away');
    }
  }

  private learnAtmosphereFromMessage(
    message: string,
    learnedDetails: string[]
  ): void {
    const atmosphereOptions: string[] = [
      'relaxing',
      'quiet',
      'peaceful',
      'romantic',
      'lively',
      'adventurous',
      'family-friendly'
    ];
  
    const atmosphere: string | undefined =
      atmosphereOptions.find(
        (option: string): boolean =>
          message.includes(option)
      );
  
    if (!atmosphere) {
      return;
    }
  
    this.context.atmosphere = atmosphere;
  
    learnedDetails.push(
      `${atmosphere} atmosphere`
    );
  }

  private learnActivitiesFromMessage(
    message: string,
    learnedDetails: string[]
  ): void {
    const activityRules: Array<{
      keywords: string[];
      value: string;
    }> = [
      {
        keywords: [
          'hike',
          'hiking',
          'trail',
          'trails'
        ],
        value: 'hiking'
      },
      {
        keywords: [
          'scenic drive',
          'scenic drives',
          'road trip'
        ],
        value: 'scenic drives'
      },
      {
        keywords: [
          'museum',
          'museums'
        ],
        value: 'museums'
      },
      {
        keywords: [
          'live music',
          'concert'
        ],
        value: 'live music'
      },
      {
        keywords: [
          'coffee',
          'café',
          'cafe'
        ],
        value: 'coffee'
      },
      {
        keywords: [
          'beach',
          'swimming'
        ],
        value: 'beach activities'
      }
    ];
  
    activityRules.forEach(
      (
        rule: {
          keywords: string[];
          value: string;
        }
      ): void => {
        const matches: boolean =
          rule.keywords.some(
            (keyword: string): boolean =>
              message.includes(keyword)
          );
  
        if (!matches) {
          return;
        }
  
        this.addUnique(
          this.context.activities,
          rule.value
        );
  
        this.addUnique(
          learnedDetails,
          rule.value
        );
      }
    );
  }

    /**
   * Builds Dash's response after processing a typed message.
   */
  private buildTypedMessageReply(
    learnedDetails: string[]
  ): string {
    if (!learnedDetails.length) {
      return (
        `I’ve added that to our conversation. ` +
        `I may need a little more detail before I can organize it ` +
        `into your trip preferences.`
      );
    }

    const readableDetails: string =
      this.formatReadableList(
        learnedDetails
      );

    return (
      `Got it. I’ve added ${readableDetails} ` +
      `to what I understand about your trip.`
    );
  }

    /**
   * Builds a one-time trip direction once Dash knows
   * enough meaningful preferences.
   */
  private getTripDirection(): string | null {
    if (this.hasShownTripDirection) {
      return null;
    }

    const preferenceCount: number =
      this.getTripPreferenceCount();

    // Wait until Dash has learned enough context
    // to make a useful connection.
    if (preferenceCount < 3) {
      return null;
    }

    this.hasShownTripDirection = true;

    return this.buildTripDirectionMessage();
  }

    /**
   * Connects the accumulated context into a natural
   * travel direction.
   */
  private buildTripDirectionMessage(): string {
    const summary: string =
      this.buildTripPreferenceSummary();

    const direction: string =
      this.getDestinationDirection();

    return (
      `${summary} ` +
      `${direction}`
    );
  }

  /**
   * Counts the meaningful preferences Dash has learned.
   *
   * journeyType is not counted because it is selected
   * automatically when the journey changes.
   */
  private getTripPreferenceCount(): number {
    let count: number = 0;

    if (this.context.terrain) {
      count++;
    }

    if (this.context.destinationStyle) {
      count++;
    }

    if (this.context.atmosphere) {
      count++;
    }

    if (this.context.distancePreference) {
      count++;
    }

    if (this.context.weatherPreference) {
      count++;
    }

    if (this.context.budget) {
      count++;
    }

    if (this.context.duration) {
      count++;
    }

    if (this.context.transportation) {
      count++;
    }

    count += this.context.activities.length;
    count += this.context.interests.length;
    count += this.context.cuisines.length;

    return count;
  }

    /**
   * Turns Dash's learned preferences into a natural,
   * conversational summary.
   */
  private buildTripPreferenceSummary(): string {

    const descriptors: string[] = [];

    // Weather first.
    if (this.context.weatherPreference === 'warm weather') {
      descriptors.push('warm');
    } else if (this.context.weatherPreference === 'cold weather') {
      descriptors.push('cold');
    } else if (this.context.weatherPreference === 'snowy weather') {
      descriptors.push('snowy');
    } else if (this.context.weatherPreference === 'hot weather') {
      descriptors.push('hot');
    } else if (this.context.weatherPreference === 'mild weather') {
      descriptors.push('mild');
    }

    // Convert terrain into a more natural destination type.
    if (this.context.terrain) {
      descriptors.push(
        this.getTerrainDescription(
          this.context.terrain
        )
      );
    }

    let summary: string =
      `It sounds like you're looking for ${this.buildPhrase(descriptors)} getaway`;

    if (this.context.distancePreference) {
      summary += ` ${this.context.distancePreference}`;
    }

    if (this.context.budget) {
      summary += ` with a budget around ${this.context.budget}`;
    }

    if (this.context.duration) {
      summary += ` for ${this.context.duration}`;
    }

    return `${summary}.`;
  }

  /**
   * Makes terrain sound like natural conversation.
   */
  private getTerrainDescription(
    terrain: string
  ): string {

    switch (terrain) {

      case 'water':
        return 'waterside';

      case 'beach':
        return 'beach';

      case 'mountains':
        return 'mountain';

      case 'forest':
        return 'forest';

      case 'city':
        return 'city';

      case 'nature':
        return 'nature';

      default:
        return terrain;
    }

  }

    /**
   * Joins descriptive words into a natural phrase.
   *
   * Examples:
   * warm
   * warm waterside
   * warm quiet mountain
   */
  private buildPhrase(
    words: string[]
  ): string {

    return words
      .filter(Boolean)
      .join(' ');

  }

    /**
   * Suggests broad destination categories from the
   * context without naming real destinations yet.
   */
  private getDestinationDirection(): string {
    const terrain: string | undefined =
      this.context.terrain;

    const journeyType: string | undefined =
      this.context.journeyType;

    if (terrain === 'water') {
      return (
        `Nearby beaches, peaceful lakes, or coastal towns ` +
        `could be strong possibilities.`
      );
    }

    if (terrain === 'beach') {
      return (
        `A family-friendly beach town or quieter coastal ` +
        `community could fit this trip well.`
      );
    }

    if (terrain === 'mountains') {
      return (
        `Mountain towns, cabin areas, and scenic highland ` +
        `routes could be worth exploring.`
      );
    }

    if (terrain === 'forest') {
      return (
        `A forest retreat, nature lodge, or park-centered ` +
        `getaway could match this direction.`
      );
    }

    if (terrain === 'city') {
      return (
        `A walkable city with strong food, culture, and ` +
        `neighborhood experiences could be a good match.`
      );
    }

    if (journeyType === 'family') {
      return (
        `A destination with easy activities, flexible pacing, ` +
        `and something enjoyable for everyone could work well.`
      );
    }

    if (journeyType === 'adventure') {
      return (
        `A destination built around outdoor activities and ` +
        `memorable scenery could be the right direction.`
      );
    }

    if (journeyType === 'food') {
      return (
        `A walkable destination with local restaurants, markets, ` +
        `and neighborhood food experiences could fit beautifully.`
      );
    }

    return (
      `We now have enough direction to begin exploring ` +
      `destination ideas that match these preferences.`
    );
  }

    /**
   * Learns the kind of destination or terrain
   * mentioned in a typed message.
   */
  private learnTerrainFromMessage(
    message: string,
    learnedDetails: string[]
  ): void {
    const terrainRules: Array<{
      keywords: string[];
      terrain: string;
      destinationStyle?: string;
    }> = [
      {
        keywords: [
          'mountain',
          'mountains',
          'mountainous'
        ],
        terrain: 'mountains'
      },
      {
        keywords: [
          'beach',
          'beaches',
          'coast',
          'coastal',
          'ocean'
        ],
        terrain: 'beach',
        destinationStyle: 'coastal'
      },
      {
        keywords: [
          'lake',
          'lakeside'
        ],
        terrain: 'lake'
      },
      {
        keywords: [
          'forest',
          'woods',
          'woodland'
        ],
        terrain: 'forest',
        destinationStyle: 'nature'
      },
      {
        keywords: [
          'city',
          'urban',
          'downtown'
        ],
        terrain: 'city',
        destinationStyle: 'city'
      }
    ];

    const matchingRule:
      | {
          keywords: string[];
          terrain: string;
          destinationStyle?: string;
        }
      | undefined =
      terrainRules.find(
        (rule): boolean =>
          rule.keywords.some(
            (keyword: string): boolean =>
              message.includes(keyword)
          )
      );

    if (!matchingRule) {
      return;
    }

    this.context.terrain =
      matchingRule.terrain;

    if (matchingRule.destinationStyle) {
      this.context.destinationStyle =
        matchingRule.destinationStyle;
    }

    this.addUnique(
      learnedDetails,
      matchingRule.terrain
    );
  }

  /**
   * Learns weather and climate preferences from
   * conversational phrases such as "somewhere warm".
   */
  private learnWeatherFromMessage(
    message: string,
    learnedDetails: string[]
  ): void {
    const weatherRules: Array<{
      keywords: string[];
      value: string;
    }> = [
      {
        keywords: [
          'cold weather',
          'cold climate',
          'somewhere cold',
          'someplace cold',
          'cold',
          'chilly'
        ],
        value: 'cold weather'
      },
      {
        keywords: [
          'snowy weather',
          'somewhere snowy',
          'snowy',
          'snow'
        ],
        value: 'snowy weather'
      },
      {
        keywords: [
          'warm weather',
          'warm climate',
          'somewhere warm',
          'someplace warm',
          'warm',
          'sunny'
        ],
        value: 'warm weather'
      },
      {
        keywords: [
          'hot weather',
          'hot climate',
          'somewhere hot',
          'tropical'
        ],
        value: 'hot weather'
      },
      {
        keywords: [
          'mild weather',
          'mild climate',
          'somewhere mild'
        ],
        value: 'mild weather'
      }
    ];

    const matchingRule = weatherRules.find(
      (rule): boolean =>
        rule.keywords.some(
          (keyword: string): boolean =>
            message.includes(keyword)
        )
    );

    if (!matchingRule) {
      return;
    }

    this.context.weatherPreference =
      matchingRule.value;

    this.addUnique(
      learnedDetails,
      matchingRule.value
    );
  }

  /**
   * Prevents old choices from remaining clickable after
   * the user has already answered that question.
   */
  private removePreviousChoices(): void {
    this.conversation =
      this.conversation.map(
        (
          message: CompanionMessage
        ): CompanionMessage => ({
          ...message,
          choices: undefined
        })
      );
  }

  /**
   * Returns Dash's local response and contextual follow-up
   * choices. This can later be replaced by an AI response.
   */
  private getCompanionReply(
    choice: CompanionChoice
  ): CompanionReply {

    switch (choice.title) {

      case 'Mountains':
        return {
          message:
            'Great choice. What kind of mountain escape are you imagining?',
          followUpChoices: [
            {
              icon: '🏡',
              title: 'Quiet Cabin',
              prompt:
                'I want a peaceful cabin in the mountains.'
            },
            {
              icon: '🥾',
              title: 'Scenic Hiking',
              prompt:
                'I want beautiful mountain hiking trails.'
            },
            {
              icon: '☕',
              title: 'Mountain Town',
              prompt:
                'I want a charming mountain town with good food and coffee.'
            },
            {
              icon: '🌄',
              title: 'Scenic Drives',
              prompt:
                'I want mountain views and scenic drives.'
            }
          ]
        };

      case 'Water':
        return {
          message:
            'That sounds refreshing. What kind of water escape feels right?',
          followUpChoices: [
            {
              icon: '🏖',
              title: 'Beach',
              prompt:
                'I want a relaxing beach escape.'
            },
            {
              icon: '🛶',
              title: 'Peaceful Lake',
              prompt:
                'I want a quiet lake getaway.'
            },
            {
              icon: '⚓',
              title: 'Coastal Town',
              prompt:
                'I want a charming coastal town.'
            },
            {
              icon: '🌅',
              title: 'Ocean Views',
              prompt:
                'I want beautiful ocean views and sunsets.'
            }
          ]
        };

      case 'City':
        return {
          message:
            'Perfect. What would make the city weekend memorable?',
          followUpChoices: [
            {
              icon: '🍽',
              title: 'Food',
              prompt:
                'I want a city known for great food.'
            },
            {
              icon: '🎭',
              title: 'Culture',
              prompt:
                'I want museums, history, and culture.'
            },
            {
              icon: '🎶',
              title: 'Nightlife',
              prompt:
                'I want live music and nightlife.'
            },
            {
              icon: '🚶',
              title: 'Walkable City',
              prompt:
                'I want a walkable city with interesting neighborhoods.'
            }
          ]
        };

      case 'Beach':
        return {
          message:
            'A beach trip sounds wonderful. What pace would work best for everyone?',
          followUpChoices: [
            {
              icon: '😌',
              title: 'Relaxing',
              prompt:
                'We want a calm and relaxing family beach trip.'
            },
            {
              icon: '🏄',
              title: 'Activities',
              prompt:
                'We want plenty of beach activities.'
            },
            {
              icon: '⚖️',
              title: 'Balanced',
              prompt:
                'We want relaxation and activities.'
            }
          ]
        };

      case 'Nature':
        return {
          message:
            'I like that direction. What kind of outdoor experience would the family enjoy?',
          followUpChoices: [
            {
              icon: '🌲',
              title: 'Easy Trails',
              prompt:
                'We want easy family-friendly trails.'
            },
            {
              icon: '🦌',
              title: 'Wildlife',
              prompt:
                'We want wildlife and nature experiences.'
            },
            {
              icon: '🚗',
              title: 'Scenic Drives',
              prompt:
                'We want scenic drives and easy stops.'
            }
          ]
        };

      case 'Theme Parks':
        return {
          message:
            'Exciting choice. What kind of attraction should lead the trip?',
          followUpChoices: [
            {
              icon: '🎢',
              title: 'Thrill Rides',
              prompt:
                'We want exciting rides and attractions.'
            },
            {
              icon: '🧚',
              title: 'Magical',
              prompt:
                'We want a magical themed experience.'
            },
            {
              icon: '💦',
              title: 'Water Park',
              prompt:
                'We want a family water park vacation.'
            }
          ]
        };

      case 'Hiking':
        return {
          message:
            'Excellent. How challenging should the hiking feel?',
          followUpChoices: [
            {
              icon: '🌿',
              title: 'Easy',
              prompt:
                'I want easy and scenic hikes.'
            },
            {
              icon: '🥾',
              title: 'Moderate',
              prompt:
                'I want moderately challenging hikes.'
            },
            {
              icon: '⛰',
              title: 'Challenging',
              prompt:
                'I want a challenging hiking adventure.'
            }
          ]
        };

      case 'Camping':
        return {
          message:
            'Camping can make a journey unforgettable. What level of comfort do you prefer?',
          followUpChoices: [
            {
              icon: '🛏',
              title: 'Glamping',
              prompt:
                'I want comfortable glamping.'
            },
            {
              icon: '🏕',
              title: 'Campground',
              prompt:
                'I want a traditional campground.'
            },
            {
              icon: '🌌',
              title: 'Wilderness',
              prompt:
                'I want a remote wilderness experience.'
            }
          ]
        };

      case 'Road Trip':
        return {
          message:
            'Love it. What should define the road trip?',
          followUpChoices: [
            {
              icon: '🌄',
              title: 'Scenery',
              prompt:
                'I want a road trip focused on scenery.'
            },
            {
              icon: '🏘',
              title: 'Small Towns',
              prompt:
                'I want to explore charming small towns.'
            },
            {
              icon: '📍',
              title: 'Hidden Stops',
              prompt:
                'I want unexpected and unusual stops.'
            }
          ]
        };

      case 'Street Food':
        return {
          message:
            'Now we are talking. What kind of food experience sounds best?',
          followUpChoices: [
            {
              icon: '🌶',
              title: 'Bold Flavors',
              prompt:
                'I want bold and spicy street food.'
            },
            {
              icon: '🌙',
              title: 'Night Markets',
              prompt:
                'I want famous night markets.'
            },
            {
              icon: '🥟',
              title: 'Local Favorites',
              prompt:
                'I want authentic local favorites.'
            }
          ]
        };

      case 'Coffee':
        return {
          message:
            'Perfect. What kind of coffee journey are you imagining?',
          followUpChoices: [
            {
              icon: '☕',
              title: 'Café Hopping',
              prompt:
                'I want to explore local cafés.'
            },
            {
              icon: '🌱',
              title: 'Coffee Farms',
              prompt:
                'I want to visit coffee farms.'
            },
            {
              icon: '🚶',
              title: 'Walkable Streets',
              prompt:
                'I want cafés in walkable neighborhoods.'
            }
          ]
        };

      case 'History':
        return {
          message:
            'That is a wonderful combination. Which part of the local story interests you most?',
          followUpChoices: [
            {
              icon: '🏛',
              title: 'Architecture',
              prompt:
                'I want historic architecture.'
            },
            {
              icon: '🏺',
              title: 'Museums',
              prompt:
                'I want museums and historic sites.'
            },
            {
              icon: '🍲',
              title: 'Food Traditions',
              prompt:
                'I want to explore traditional local food.'
            }
          ]
        };

      case 'Surprise Me':
        return {
          message:
            'I like your trust. Should I keep the surprise comfortable or make it adventurous?',
          followUpChoices: [
            {
              icon: '😌',
              title: 'Comfortable',
              prompt:
                'Surprise me with something comfortable and relaxing.'
            },
            {
              icon: '🧭',
              title: 'Adventurous',
              prompt:
                'Surprise me with an adventurous destination.'
            },
            {
              icon: '🎲',
              title: 'Anything Goes',
              prompt:
                'Choose something completely unexpected.'
            }
          ]
        };

      default:
        return {
          message:
            `I like the sound of ${choice.title}. I’m starting to understand the kind of journey you want.`,
          followUpChoices: [
            {
              icon: '📍',
              title: 'Nearby',
              prompt:
                `Find a nearby ${choice.title.toLowerCase()} experience.`
            },
            {
              icon: '✈️',
              title: 'Farther Away',
              prompt:
                `Show me a farther-away ${choice.title.toLowerCase()} experience.`
            },
            {
              icon: '✨',
              title: 'Surprise Me',
              prompt:
                `Surprise me with a ${choice.title.toLowerCase()} experience.`
            }
          ]
        };
    }
  }

  private learn(
    choice: CompanionChoice
  ): void {
    switch (choice.title) {
  
      case 'Mountains':
        this.context.terrain = 'mountains';
        break;
  
      case 'Water':
        this.context.terrain = 'water';
        break;
  
      case 'City':
        this.context.destinationStyle = 'city';
        break;
  
      // NEW: Family journey choices
      case 'Beach':
        this.context.terrain = 'beach';
        this.context.destinationStyle = 'coastal';
        break;
  
      case 'Nature':
        this.context.destinationStyle = 'nature';
        break;
  
      case 'Theme Parks':
        this.context.destinationStyle = 'theme parks';
        this.addUnique(
          this.context.interests,
          'family attractions'
        );
        break;
  
      case 'Quiet Cabin':
        this.context.atmosphere = 'quiet';
        this.context.destinationStyle = 'cabin';
        break;
  
      case 'Scenic Hiking':
        this.addUnique(
          this.context.activities,
          'hiking'
        );
        break;
  
      case 'Scenic Drives':
        this.addUnique(
          this.context.activities,
          'scenic drives'
        );
        break;
  
      case 'Coffee':
        this.addUnique(
          this.context.cuisines,
          'coffee'
        );
        break;
  
      case 'Street Food':
        this.addUnique(
          this.context.cuisines,
          'street food'
        );
        break;
  
      // NEW: Distance choices
      case 'Nearby':
        this.context.distancePreference = 'nearby';
        break;
  
      case 'Farther Away':
        this.context.distancePreference = 'farther away';
        break;
  
      case 'Surprise Me':
        this.context.destinationStyle = 'surprise';
        break;
    }
  }

  private addUnique(
    list: string[],
    value: string
  ): void {
    if (!list.includes(value)) {
      list.push(value);
    }
  }

  /**
 * Returns a one-time reflection once Dash has learned
 * enough meaningful details about the trip.
 */
private getContextReflection(): string | null {
  if (this.hasShownContextReflection) {
    return null;
  }

  const learnedDetails: string[] =
    this.getLearnedContextDetails();

  // Wait until Dash knows at least three preferences.
  // journeyType is not counted because it is known immediately.
  if (learnedDetails.length < 3) {
    return null;
  }

  this.hasShownContextReflection = true;

  return this.buildContextReflection(
    learnedDetails
  );
}

/**
 * Converts the current context into readable phrases.
 */
private getLearnedContextDetails(): string[] {
  const details: string[] = [];

  if (this.context.distancePreference) {
    details.push(
      this.context.distancePreference
    );
  }

  if (this.context.terrain) {
    details.push(
      this.context.terrain
    );
  }

  if (this.context.weatherPreference) {
    details.push(
      this.context.weatherPreference
    );
  }

  // Don't repeat information that's already implied
  // by the selected terrain (e.g. Beach + Coastal).
  if (
    this.context.destinationStyle &&
    !this.isDestinationStyleAlreadyRepresented()
  ) {
    details.push(
      this.context.destinationStyle
    );
  }

  if (this.context.atmosphere) {
    details.push(
      `${this.context.atmosphere} atmosphere`
    );
  }

  if (this.context.transportation) {
    details.push(
      this.context.transportation
    );
  }

  this.context.activities.forEach(
    (activity: string): void => {
      details.push(activity);
    }
  );

  this.context.interests.forEach(
    (interest: string): void => {
      details.push(interest);
    }
  );

  this.context.cuisines.forEach(
    (cuisine: string): void => {
      details.push(cuisine);
    }
  );

  // NEW:
  // Removes exact duplicate phrases before Dash
  // builds the reflection sentence.
  return [...new Set(details)];
}

  /**
   * Prevents Dash from describing the same preference twice.
   * Example:
   * terrain = "beach"
   * destinationStyle = "coastal"
   *
   * Dash should say "beach", not "beach and coastal".
   */
  private isDestinationStyleAlreadyRepresented(): boolean {
    const terrain: string | undefined =
      this.context.terrain;

    const destinationStyle: string | undefined =
      this.context.destinationStyle;

    if (!terrain || !destinationStyle) {
      return false;
    }

    const overlappingValues: Record<string, string[]> = {
      beach: ['coastal', 'beach'],
      mountains: ['mountain', 'mountains'],
      city: ['city', 'urban'],
      forest: ['nature', 'woodland']
    };

    return (
      overlappingValues[terrain]?.includes(destinationStyle) ?? false
    );
  }

  /**
   * Creates a natural sentence from Dash's understanding.
   */
  private buildContextReflection(
    details: string[]
  ): string {
    const readableDetails: string =
      this.formatReadableList(
        details.slice(0, 4)
      );

    return (
      `I’m starting to understand what would make this trip special for you. ` +
      `So far, I’m thinking ${readableDetails}.`
    );
  }

  /**
   * Formats values as:
   * "mountains"
   * "mountains and hiking"
   * "mountains, hiking, and scenic drives"
   */
  private formatReadableList(
    values: string[]
  ): string {
    if (values.length === 0) {
      return '';
    }

    if (values.length === 1) {
      return values[0];
    }

    if (values.length === 2) {
      return `${values[0]} and ${values[1]}`;
    }

    const lastValue: string =
      values[values.length - 1];

    const earlierValues: string =
      values
        .slice(0, -1)
        .join(', ');

    return `${earlierValues}, and ${lastValue}`;
  }

  /**
   * Clears the timeline and starts the selected journey again.
   */
  resetConversation(): void {
    this.startConversation();
  }
}