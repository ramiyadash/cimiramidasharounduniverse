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
    planningMessage: 'Great choice! Let’s find a quick getaway that feels refreshing without too much planning.',
    inputPlaceholder: 'Where would you like to escape this weekend?'
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
    planningMessage: 'Wonderful! Let’s plan something comfortable, fun, and realistic for everyone.',
    inputPlaceholder: 'Who is traveling, and how many days do you have?'
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
    planningMessage: 'Love it. Let’s build a trip around nature, movement, and memorable views.',
    inputPlaceholder: 'Tell me about your dream adventure...'
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
    planningMessage: 'Perfect. Let’s explore a place through food, neighborhoods, culture, and local stories.',
    inputPlaceholder: 'Which cuisine or country excites you?'
  }
];