const mongoose =
  require('mongoose');

const {
  Schema
} = mongoose;

/**
 * Stores metadata for one journey photo.
 *
 * The binary image remains in private object storage.
 * MongoDB stores ownership, association and descriptive
 * metadata only.
 */
const journeyMediaSchema =
  new Schema(
    {
      user: {
        type:
          Schema.Types.ObjectId,

        ref: 'User',

        required: true,

        index: true
      },

      journey: {
        type:
          Schema.Types.ObjectId,

        ref: 'Journey',

        required: true,

        index: true
      },

      mediaType: {
        type: String,

        enum: [
          'photo'
        ],

        default: 'photo',

        required: true
      },

      storageKey: {
        type: String,
        required: true,
        trim: true,
        unique: true
      },

      originalFileName: {
        type: String,
        required: true,
        trim: true
      },

      mimeType: {
        type: String,

        enum: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/heic',
          'image/heif'
        ],

        required: true
      },

      sizeBytes: {
        type: Number,
        required: true,
        min: 1,

        /**
         * Initial upload limit: 15 MB.
         */
        max:
          15 * 1024 * 1024
      },

      caption: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null
      },

      takenAt: {
        type: Date,
        default: null
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

      isCover: {
        type: Boolean,
        default: false
      },

      uploadStatus: {
        type: String,

        enum: [
          'pending',
          'ready',
          'failed'
        ],

        default: 'pending',

        required: true,

        index: true
      },

      uploadedAt: {
        type: Date,
        default: null
      }
    },
    {
      timestamps: true
    }
  );

/**
 * Supports quickly loading a traveler's ready photos
 * for a selected journey.
 */
journeyMediaSchema.index({
  user: 1,
  journey: 1,
  uploadStatus: 1,
  createdAt: -1
});

module.exports =
  mongoose.model(
    'JourneyMedia',
    journeyMediaSchema
  );