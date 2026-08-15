require('dotenv').config();
const {
    connectDatabase
  } = require('../config/database');
  
  const User =
    require('../models/user.model');
  
  const TravelerProfile =
    require('../models/traveler-profile.model');
  
  const Journey =
    require('../models/journey.model');
  
  const Conversation =
    require('../models/conversation.model');
  
  /**
   * Creates a small development dataset so we can
   * verify that the MongoDB models and relationships
   * are working correctly.
   */
  async function seedDevelopmentData() {
    try {
      await connectDatabase();
  
      /**
       * Remove only the development test records
       * created by this script.
       *
       * We deliberately do NOT wipe entire collections.
       */
      const testEmail =
        'dash-dev@example.com';
  
      const existingUser =
        await User.findOne({
          email: testEmail
        });
  
      if (existingUser) {
        await Conversation.deleteMany({
          user: existingUser._id
        });
  
        await Journey.deleteMany({
          user: existingUser._id
        });
  
        await TravelerProfile.deleteMany({
          user: existingUser._id
        });
  
        await User.deleteOne({
          _id: existingUser._id
        });
      }
  
      /**
       * 1. Create test user.
       */
      const user =
        await User.create({
          displayName:
            'Dash Development Traveler',
  
          email:
            testEmail
        });
  
      console.log(
        'Created User:',
        user._id.toString()
      );
  
      /**
       * 2. Create long-term traveler profile.
       */
      const travelerProfile =
        await TravelerProfile.create({
          user: user._id,
  
          travelerDNA: {
            preferredTerrains: [
              'water',
              'mountains'
            ],
  
            preferredActivities: [
              'nightlife',
              'food'
            ],
  
            preferredWeather: [
              'warm'
            ],
  
            preferredTravelStyles: [
              'weekend'
            ],
  
            typicalBudgetRange: {
              min: 300,
              max: 600
            },
  
            typicalTripDurationDays: 3
          }
        });
  
      console.log(
        'Created TravelerProfile:',
        travelerProfile._id.toString()
      );
  
      /**
       * 3. Create one active planning journey.
       */
      const journey =
        await Journey.create({
          user: user._id,
  
          title:
            'Warm Weekend Escape',
  
          journeyType:
            'weekend',
  
          status:
            'planning',
  
          companionContext: {
            terrain:
              'water',
  
            weatherPreference:
              'warm weather',
  
            budget:
              '$500',
  
            distancePreference:
              'within 4 hours',
  
            activities: [
              'nightlife'
            ],
  
            interests: [],
  
            cuisines: []
          },
  
          destinationMatches: [
            {
              destinationId:
                'st-augustine-fl',
  
              score: 95,
  
              reasons: [
                'Warm weather',
                'Matches water',
                'Within driving range',
                'Within budget'
              ]
            }
          ]
        });
  
      console.log(
        'Created Journey:',
        journey._id.toString()
      );
  
      /**
       * 4. Create the conversation associated
       * with that journey.
       */
      const conversation =
        await Conversation.create({
          user: user._id,
  
          journey: journey._id,
  
          messages: [
            {
              sender:
                'user',
  
              text:
                'I want a warm weekend near the water.'
            },
            {
              sender:
                'dash',
  
              text:
                'A warm waterside getaway sounds promising.'
            }
          ]
        });
  
      console.log(
        'Created Conversation:',
        conversation._id.toString()
      );
  
      console.log(
        'Development seed completed successfully.'
      );
  
      process.exit(0);
    } catch (error) {
      console.error(
        'Development seed failed:',
        error
      );
  
      process.exit(1);
    }
  }
  
  seedDevelopmentData();