import {
    Destination
  } from '../models/destination.model';
  
  export const DESTINATION_KNOWLEDGE:
    Destination[] = [
      {
        id: 'savannah-ga',
  
        name: 'Savannah',
  
        state: 'Georgia',
  
        country: 'USA',
  
        description:
          'A historic riverfront city known for walkable squares, local restaurants, nightlife, architecture, and southern character.',
  
        image:
          '/images/destinations/savannah.jpg',
  
        driveTimeHours: 3,
  
        estimatedBudget: 450,
  
        weather: [
          'warm',
          'mild'
        ],
  
        terrain: [
          'city',
          'historic',
          'water'
        ],
  
        activities: [
          'walking',
          'food',
          'nightlife',
          'history',
          'riverfront',
          'ghost tours'
        ],
  
        bestSeasons: [
          'spring',
          'fall'
        ],
  
        journeyTypes: [
          'weekend',
          'family',
          'food'
        ],
  
        familyFriendly: true,
  
        tags: [
          'walkable',
          'romantic',
          'historic',
          'nightlife',
          'food'
        ]
      },
  
      {
        id: 'st-augustine-fl',
  
        name: 'St. Augustine',
  
        state: 'Florida',
  
        country: 'USA',
  
        description:
          'A compact coastal destination combining historic streets, beaches, local food, museums, and waterfront views.',
  
        image:
          '/images/destinations/st-augustine.jpg',
  
        driveTimeHours: 1.5,
  
        estimatedBudget: 400,
  
        weather: [
          'warm',
          'mild'
        ],
  
        terrain: [
          'beach',
          'historic',
          'water'
        ],
  
        activities: [
          'beach activities',
          'walking',
          'history',
          'food',
          'museums',
          'waterfront'
        ],
  
        bestSeasons: [
          'spring',
          'fall',
          'winter'
        ],
  
        journeyTypes: [
          'weekend',
          'family',
          'food'
        ],
  
        familyFriendly: true,
  
        tags: [
          'nearby',
          'coastal',
          'historic',
          'walkable',
          'family-friendly'
        ]
      },
  
      {
        id: 'charleston-sc',
  
        name: 'Charleston',
  
        state: 'South Carolina',
  
        country: 'USA',
  
        description:
          'A coastal historic city with renowned food, architecture, markets, waterfront neighborhoods, and evening entertainment.',
  
        image:
          '/images/destinations/charleston.jpg',
  
        driveTimeHours: 4,
  
        estimatedBudget: 575,
  
        weather: [
          'warm',
          'mild'
        ],
  
        terrain: [
          'city',
          'historic',
          'water'
        ],
  
        activities: [
          'food',
          'walking',
          'history',
          'nightlife',
          'markets',
          'waterfront'
        ],
  
        bestSeasons: [
          'spring',
          'fall'
        ],
  
        journeyTypes: [
          'weekend',
          'family',
          'food'
        ],
  
        familyFriendly: true,
  
        tags: [
          'food',
          'historic',
          'coastal',
          'romantic',
          'nightlife'
        ]
      },
  
      {
        id: 'blue-ridge-ga',
  
        name: 'Blue Ridge',
  
        state: 'Georgia',
  
        country: 'USA',
  
        description:
          'A relaxed mountain destination with cabins, scenic drives, waterfalls, hiking trails, and a charming small downtown.',
  
        image:
          '/images/destinations/blue-ridge.jpg',
  
        driveTimeHours: 5,
  
        estimatedBudget: 475,
  
        weather: [
          'cool',
          'mild'
        ],
  
        terrain: [
          'mountains',
          'forest'
        ],
  
        activities: [
          'hiking',
          'scenic drives',
          'cabins',
          'waterfalls',
          'small towns',
          'nature'
        ],
  
        bestSeasons: [
          'spring',
          'fall',
          'winter'
        ],
  
        journeyTypes: [
          'weekend',
          'family',
          'adventure'
        ],
  
        familyFriendly: true,
  
        tags: [
          'quiet',
          'cabins',
          'mountains',
          'scenic',
          'nature'
        ]
      },
  
      {
        id: 'asheville-nc',
  
        name: 'Asheville',
  
        state: 'North Carolina',
  
        country: 'USA',
  
        description:
          'A mountain city offering hiking, scenic roads, local food, breweries, art, live music, and distinctive neighborhoods.',
  
        image:
          '/images/destinations/asheville.jpg',
  
        driveTimeHours: 6,
  
        estimatedBudget: 550,
  
        weather: [
          'cool',
          'mild'
        ],
  
        terrain: [
          'mountains',
          'forest',
          'city'
        ],
  
        activities: [
          'hiking',
          'scenic drives',
          'food',
          'live music',
          'art',
          'nightlife'
        ],
  
        bestSeasons: [
          'spring',
          'summer',
          'fall'
        ],
  
        journeyTypes: [
          'weekend',
          'adventure',
          'food'
        ],
  
        familyFriendly: true,
  
        tags: [
          'mountain town',
          'food',
          'art',
          'live music',
          'outdoors'
        ]
      },
  
      {
        id: 'gatlinburg-tn',
  
        name: 'Gatlinburg',
  
        state: 'Tennessee',
  
        country: 'USA',
  
        description:
          'A lively gateway to the Smoky Mountains with family attractions, hiking access, scenic views, cabins, and entertainment.',
  
        image:
          '/images/destinations/gatlinburg.jpg',
  
        driveTimeHours: 7,
  
        estimatedBudget: 525,
  
        weather: [
          'cool',
          'mild'
        ],
  
        terrain: [
          'mountains',
          'forest'
        ],
  
        activities: [
          'hiking',
          'family attractions',
          'cabins',
          'scenic views',
          'wildlife',
          'entertainment'
        ],
  
        bestSeasons: [
          'spring',
          'summer',
          'fall',
          'winter'
        ],
  
        journeyTypes: [
          'family',
          'adventure',
          'weekend'
        ],
  
        familyFriendly: true,
  
        tags: [
          'family-friendly',
          'mountains',
          'attractions',
          'cabins',
          'nature'
        ]
      },
  
      {
        id: 'great-smoky-mountains',
  
        name: 'Great Smoky Mountains',
  
        state: 'Tennessee / North Carolina',
  
        country: 'USA',
  
        description:
          'A major national-park destination known for mountain scenery, wildlife, waterfalls, hiking, scenic drives, and camping.',
  
        image:
          '/images/destinations/great-smoky-mountains.jpg',
  
        driveTimeHours: 7,
  
        estimatedBudget: 400,
  
        weather: [
          'cool',
          'mild'
        ],
  
        terrain: [
          'mountains',
          'forest'
        ],
  
        activities: [
          'hiking',
          'camping',
          'wildlife',
          'waterfalls',
          'scenic drives',
          'nature'
        ],
  
        bestSeasons: [
          'spring',
          'summer',
          'fall'
        ],
  
        journeyTypes: [
          'adventure',
          'family'
        ],
  
        familyFriendly: true,
  
        tags: [
          'national park',
          'hiking',
          'camping',
          'wildlife',
          'scenic'
        ]
      },
  
      {
        id: 'orlando-fl',
  
        name: 'Orlando',
  
        state: 'Florida',
  
        country: 'USA',
  
        description:
          'A family-centered destination with major theme parks, water parks, entertainment, dining, and indoor attractions.',
  
        image:
          '/images/destinations/orlando.jpg',
  
        driveTimeHours: 2,
  
        estimatedBudget: 700,
  
        weather: [
          'warm',
          'hot'
        ],
  
        terrain: [
          'city',
          'theme-parks'
        ],
  
        activities: [
          'theme parks',
          'water parks',
          'family attractions',
          'shopping',
          'food',
          'entertainment'
        ],
  
        bestSeasons: [
          'winter',
          'spring',
          'fall'
        ],
  
        journeyTypes: [
          'family',
          'weekend'
        ],
  
        familyFriendly: true,
  
        tags: [
          'theme parks',
          'family-friendly',
          'entertainment',
          'warm',
          'activities'
        ]
      },
  
      {
        id: 'naples-fl',
  
        name: 'Naples',
  
        state: 'Florida',
  
        country: 'USA',
  
        description:
          'A polished Gulf Coast destination with beaches, warm weather, sunsets, restaurants, shopping, and a relaxed pace.',
  
        image:
          '/images/destinations/naples.jpg',
  
        driveTimeHours: 5,
  
        estimatedBudget: 650,
  
        weather: [
          'warm',
          'hot'
        ],
  
        terrain: [
          'beach',
          'water'
        ],
  
        activities: [
          'beach activities',
          'food',
          'shopping',
          'sunsets',
          'boating',
          'relaxing'
        ],
  
        bestSeasons: [
          'winter',
          'spring'
        ],
  
        journeyTypes: [
          'weekend',
          'family',
          'food'
        ],
  
        familyFriendly: true,
  
        tags: [
          'beach',
          'relaxing',
          'warm',
          'upscale',
          'sunsets'
        ]
      },
  
      {
        id: 'key-west-fl',
  
        name: 'Key West',
  
        state: 'Florida',
  
        country: 'USA',
  
        description:
          'A tropical island city known for sunsets, water activities, local food, nightlife, history, and a distinctive relaxed culture.',
  
        image:
          '/images/destinations/key-west.jpg',
  
        driveTimeHours: 8,
  
        estimatedBudget: 900,
  
        weather: [
          'warm',
          'hot',
          'tropical'
        ],
  
        terrain: [
          'beach',
          'water',
          'historic'
        ],
  
        activities: [
          'nightlife',
          'food',
          'boating',
          'snorkeling',
          'history',
          'sunsets'
        ],
  
        bestSeasons: [
          'winter',
          'spring'
        ],
  
        journeyTypes: [
          'weekend',
          'adventure',
          'food'
        ],
  
        familyFriendly: true,
  
        tags: [
          'tropical',
          'nightlife',
          'water',
          'island',
          'food'
        ]
      }
    ];