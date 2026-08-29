const mongoose =
  require('mongoose');

const {
  Schema
} = mongoose;

/**
 * A global destination available through Discover.
 *
 * Destinations do not belong to individual users.
 * They are reusable catalog records that can be
 * matched against each traveler's Traveler DNA.
 */
const destinationSchema =
  new Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120
      },

      /**
       * Stable, human-readable catalog identifier.
       *
       * Examples:
       * st-augustine-fl
       * kyoto-japan
       */
      slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        index: true,

        match:
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      },

      country: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
      },

      countryCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        minlength: 2,
        maxlength: 2
      },

      region: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
      },

      locations: {
        type: [String],
        default: []
      },

      summary: {
        type: String,
        required: true,
        trim: true,
        maxlength: 280
      },

      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
      },

      emoji: {
        type: String,
        default: '📍',
        maxlength: 16
      },

      coordinates: {
        longitude: {
          type: Number,
          required: true,
          min: -180,
          max: 180
        },

        latitude: {
          type: Number,
          required: true,
          min: -90,
          max: 90
        }
      },

      /**
       * Attributes used to compare this destination
       * with the authenticated user's Traveler DNA.
       */
      discovery: {
        terrains: {
          type: [
            {
              type: String,
              trim: true,
              lowercase: true
            }
          ],

          default: []
        },

        activities: {
          type: [
            {
              type: String,
              trim: true,
              lowercase: true
            }
          ],

          default: []
        },

        weather: {
          type: [
            {
              type: String,
              trim: true,
              lowercase: true
            }
          ],

          default: []
        },

        travelStyles: {
          type: [
            {
              type: String,
              trim: true,
              lowercase: true
            }
          ],

          default: []
        },

        budgetRange: {
          min: {
            type: Number,
            min: 0,
            default: null
          },

          max: {
            type: Number,
            min: 0,
            default: null
          },

          currency: {
            type: String,
            trim: true,
            uppercase: true,
            default: 'USD',
            maxlength: 3
          }
        },

        durationDays: {
          min: {
            type: Number,
            min: 1,
            default: null
          },

          max: {
            type: Number,
            min: 1,
            default: null
          }
        },

        bestMonths: {
          type: [
            {
              type: Number,
              min: 1,
              max: 12
            }
          ],

          default: []
        }
      },

      /**
       * Images will eventually use the same secure
       * media-storage principles as Journey Memories.
       *
       * Catalog images are public product content,
       * while user memories remain private.
       */
      media: {
        heroImageUrl: {
          type: String,
          trim: true,
          default: null
        },

        heroImageAlt: {
          type: String,
          trim: true,
          maxlength: 240,
          default: null
        },

        attribution: {
          type: String,
          trim: true,
          maxlength: 300,
          default: null
        }
      },

      source: {
        type: String,

        enum: [
          'curated',
          'ai-assisted',
          'partner'
        ],

        default: 'curated'
      },

      featured: {
        type: Boolean,
        default: false,
        index: true
      },

      status: {
        type: String,

        enum: [
          'draft',
          'active',
          'archived'
        ],

        default: 'draft',
        index: true
      },

      lastVerifiedAt: {
        type: Date,
        default: null
      }
    },
    {
      timestamps: true
    }
  );

/**
 * Additional protection against reversed or invalid
 * ranges that individual field validation cannot
 * detect.
 */
destinationSchema.pre(
    'validate',
  
    function validateRanges() {
      const budget =
        this.discovery
          ?.budgetRange;
  
      if (
        budget?.min !== null &&
        budget?.max !== null &&
        budget?.min !== undefined &&
        budget?.max !== undefined &&
        budget.min >
          budget.max
      ) {
        throw new Error(
          'Destination minimum budget cannot exceed its maximum budget.'
        );
      }
  
      const duration =
        this.discovery
          ?.durationDays;
  
      if (
        duration?.min !== null &&
        duration?.max !== null &&
        duration?.min !== undefined &&
        duration?.max !== undefined &&
        duration.min >
          duration.max
      ) {
        throw new Error(
          'Destination minimum duration cannot exceed its maximum duration.'
        );
      }
    }
  );

destinationSchema.index({
  status: 1,
  featured: -1,
  country: 1
});

destinationSchema.index({
  name: 'text',
  country: 'text',
  region: 'text',
  summary: 'text',
  description: 'text'
});

module.exports =
  mongoose.model(
    'Destination',
    destinationSchema
  );