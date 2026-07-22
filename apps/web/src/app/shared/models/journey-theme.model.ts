export type JourneyType = 'weekend' | 'family' | 'adventure' | 'food';

export interface JourneyTheme {
  type: JourneyType;
  icon: string;
  title: string;
  description: string;
  accentColor: string;
  softBackground: string;
  selectedBackground: string;
  planningTitle: string;
  planningMessage: string;
  inputPlaceholder: string;

  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  heroImage: string;
  heroImageAlt: string;
  heroPrompts: string[];
}

export const JOURNEY_THEMES: JourneyTheme[] = [
  {
    type: 'weekend',
    icon: '✈️',
    title: 'Weekend Escape',
    description: 'Recharge in just 2–3 days',
    accentColor: '#2563eb',
    softBackground: '#eef7ff',
    selectedBackground: 'linear-gradient(135deg, #dbeafe, #ffffff)',
    planningTitle: 'Weekend Escape',
    planningMessage:
      'Great choice! Let’s find a quick getaway that feels refreshing without too much planning.',
    inputPlaceholder:
      'Where would you like to escape this weekend?',

    heroTitle: 'Ready for your next',
    heroHighlight: 'escape?',
    heroSubtitle:
      'Turn a free weekend into a refreshing journey filled with discovery, rest, and memorable moments.',
    heroImage:
      '/images/journeys/weekend-escape.jpg',
    heroImageAlt:
      'Scenic destination for a relaxing weekend escape',
    heroPrompts: [
        'A quiet mountain escape',
        'A lively city weekend',
        'Somewhere near the water'
    ]
  },
  {
    type: 'family',
    icon: '👨‍👩‍👧',
    title: 'Family Vacation',
    description: 'Easy, practical, kid-friendly',
    accentColor: '#ea580c',
    softBackground: '#fff2e8',
    selectedBackground: 'linear-gradient(135deg, #ffedd5, #ffffff)',
    planningTitle: 'Family Vacation',
    planningMessage:
      'Wonderful! Let’s plan something comfortable, fun, and realistic for everyone.',
    inputPlaceholder:
      'Who is traveling, and how many days do you have?',

    heroTitle: 'Create your next family',
    heroHighlight: 'memory.',
    heroSubtitle:
      'Plan comfortable, joyful journeys that bring everyone together without making the experience feel overwhelming.',
    heroImage:
      '/images/journeys/family-vacation.jpg',
    heroImageAlt:
      'Family enjoying a comfortable vacation together',
    heroPrompts: [
        'Kid-friendly beach trip',
        'Easy nature getaway',
        'Family city adventure'
    ]  
  },
  {
    type: 'adventure',
    icon: '🥾',
    title: 'Adventure Journey',
    description: 'Nature, hiking, unforgettable views',
    accentColor: '#16a34a',
    softBackground: '#effdf4',
    selectedBackground: 'linear-gradient(135deg, #dcfce7, #ffffff)',
    planningTitle: 'Adventure Journey',
    planningMessage:
      'Love it. Let’s build a trip around nature, movement, and memorable views.',
    inputPlaceholder:
      'Tell me about your dream adventure...',

    heroTitle: 'Where will your next',
    heroHighlight: 'adventure begin?',
    heroSubtitle:
      'Discover trails, landscapes, and unforgettable places that make you feel fully alive.',
    heroImage:
      '/images/journeys/adventure-journey.jpg',
    heroImageAlt:
      'Hiker exploring a scenic mountain landscape',
    heroPrompts: [
        'Mountain hiking',
        'Wildlife and nature',
        'Road trip adventure'
    ]  
  },
  {
    type: 'food',
    icon: '🍜',
    title: 'Food & Culture',
    description: 'Local flavors and stories',
    accentColor: '#dc2626',
    softBackground: '#fff1f2',
    selectedBackground: 'linear-gradient(135deg, #fee2e2, #ffffff)',
    planningTitle: 'Food & Culture',
    planningMessage:
      'Perfect. Let’s explore a place through food, neighborhoods, culture, and local stories.',
    inputPlaceholder:
      'Which cuisine or country excites you?',

    heroTitle: 'Which flavors will tell your next',
    heroHighlight: 'story?',
    heroSubtitle:
      'Explore destinations through local food, neighborhoods, traditions, and the people behind every dish.',
    heroImage:
      '/images/journeys/food-and-culture.jpg',
    heroImageAlt:
      'Local food and cultural dishes prepared for travelers',
    heroPrompts: [
        'Street food journey',
        'Historic neighborhoods',
        'Local markets and cafés'
    ]    
  }
];