const mongoose =
  require('mongoose');

const {
  Schema
} = mongoose;

/**
 * Long-term travel preferences and behavioral
 * patterns learned across many journeys.
 *
 * This is where Traveler DNA will grow over time.
 */
const travelerProfileSchema =
  new Schema(
    {
      user: {
        type:
          Schema.Types.ObjectId,

        ref: 'User',

        required: true,

        unique: true,

        index: true
      },

      travelerDNA: {
        preferredTerrains: {
          type: [String],
          default: []
        },

        preferredActivities: {
          type: [String],
          default: []
        },

        preferredWeather: {
          type: [String],
          default: []
        },

        preferredTravelStyles: {
          type: [String],
          default: []
        },

        typicalBudgetRange: {
          min: {
            type: Number,
            default: null
          },

          max: {
            type: Number,
            default: null
          }
        },

        typicalTripDurationDays: {
          type: Number,
          default: null
        }
      },

      savedDestinations: [
        {
          destinationId: {
            type: String,
            required: true
          },

          savedAt: {
            type: Date,
            default: Date.now
          }
        }
      ]
    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    'TravelerProfile',
    travelerProfileSchema
  );