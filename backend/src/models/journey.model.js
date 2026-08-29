const mongoose =
  require('mongoose');

const {
  Schema
} = mongoose;

/**
 * Stores one planning journey.
 *
 * The companionContext represents what Dash
 * currently understands about this specific trip.
 *
 * This is separate from TravelerProfile because
 * trip-specific preferences should not automatically
 * become long-term user preferences.
 */
const journeySchema =
  new Schema(
    {
      user: {
        type:
          Schema.Types.ObjectId,

        ref: 'User',

        required: true,

        index: true
      },

      title: {
        type: String,
        required: true,
        trim: true
      },

      journeyType: {
        type: String,

        enum: [
          'weekend',
          'family',
          'adventure',
          'food'
        ],

        required: true
      },

      status: {
        type: String,

        enum: [
          'planning',
          'planned',
          'active',
          'completed',
          'archived'
        ],

        default: 'planning'
      },

      companionContext: {
        terrain: {
          type: String,
          default: null
        },

        atmosphere: {
          type: String,
          default: null
        },

        destinationStyle: {
          type: String,
          default: null
        },

        transportation: {
          type: String,
          default: null
        },

        distancePreference: {
          type: String,
          default: null
        },

        weatherPreference: {
          type: String,
          default: null
        },

        budget: {
          type: String,
          default: null
        },

        duration: {
          type: String,
          default: null
        },

        season: {
          type: String,
          default: null
        },

        activities: {
          type: [String],
          default: []
        },

        interests: {
          type: [String],
          default: []
        },

        cuisines: {
          type: [String],
          default: []
        }
      },

      /**
 * Information used to display this journey inside
 * the My Universe map.
 *
 * longitude and latitude are stored separately so
 * their order cannot accidentally be reversed.
 */
universe: {
    isVisible: {
      type: Boolean,
      default: true
    },
  
    /**
     * This is separate from the journey workflow status.
     *
     * For example, a completed journey is normally
     * "visited", while a future journey is "planned".
     */
    status: {
      type: String,
  
      enum: [
        'visited',
        'planned',
        'dreaming'
      ],
  
      default: null
    },
  
    country: {
      type: String,
      trim: true,
      default: null
    },
  
    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null
    },
  
    region: {
      type: String,
      trim: true,
      default: null
    },
  
    locations: {
      type: [String],
      default: []
    },
  
    description: {
      type: String,
      trim: true,
      default: null
    },
  
    emoji: {
      type: String,
      default: '📍'
    },
  
    coordinates: {
      longitude: {
        type: Number,
        min: -180,
        max: 180,
        default: null
      },
  
      latitude: {
        type: Number,
        min: -90,
        max: 90,
        default: null
      }
    },
  
    startDate: {
      type: Date,
      default: null
    },
  
    endDate: {
      type: Date,
      default: null
    },
  
    /**
     * Supports labels such as "July 2025",
     * "Apr–May 2026" and "Someday".
     */
    dateLabel: {
      type: String,
      trim: true,
      default: null
    },
  
    photoCount: {
      type: Number,
      min: 0,
      default: 0
    },
  
    storyCount: {
      type: Number,
      min: 0,
      default: 0
    }
  },

      selectedDestination: {
        destinationId: {
          type: String,
          default: null
        },

        selectedAt: {
          type: Date,
          default: null
        }
      },

      destinationMatches: [
        {
          destinationId: {
            type: String,
            required: true
          },

          score: {
            type: Number,
            required: true
          },

          reasons: {
            type: [String],
            default: []
          }
        }
      ]
    },
    {
      timestamps: true
    }
  );

  /**
 * A traveler may save a catalog destination to
 * My Universe only once.
 *
 * The partial index ignores journeys that were
 * created manually and have no destinationId.
 */
journeySchema.index(
  {
    user: 1,

    'selectedDestination.destinationId':
      1
  },

  {
    unique: true,

    partialFilterExpression: {
      'selectedDestination.destinationId': {
        $type: 'string'
      }
    }
  }
);

module.exports =
  mongoose.model(
    'Journey',
    journeySchema
  );