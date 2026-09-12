const mongoose =
  require('mongoose');

const {
  Schema
} = mongoose;

const storySectionSchema =
  new Schema(
    {
      heading: {
        type: String,
        trim: true,
        maxlength: 160,
        default: ''
      },

      date: {
        type: Date,
        default: null
      },

      narrative: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: ''
      },

      /**
       * Stores the selected photo order for this
       * section without duplicating media metadata.
       */
      media: [
        {
          type:
            Schema.Types.ObjectId,

          ref:
            'JourneyMedia'
        }
      ]
    },
    {
      _id: true
    }
  );

/**
 * Stores one private, editable story for a journey.
 *
 * JourneyMedia owns the actual photo metadata and
 * private S3 object. The story only references the
 * photos and controls their narrative arrangement.
 */
const journeyStorySchema =
  new Schema(
    {
      user: {
        type:
          Schema.Types.ObjectId,

        ref:
          'User',

        required: true,

        index: true
      },

      journey: {
        type:
          Schema.Types.ObjectId,

        ref:
          'Journey',

        required: true,

        index: true
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 160
      },

      introduction: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: ''
      },

      coverMedia: {
        type:
          Schema.Types.ObjectId,

        ref:
          'JourneyMedia',

        default: null
      },

      sections: {
        type: [
          storySectionSchema
        ],

        default: []
      },

      status: {
        type: String,

        enum: [
          'draft',
          'completed'
        ],

        default: 'draft',

        required: true
      },

      /**
       * Story sharing will be a later milestone.
       * All stories are strictly private for now.
       */
      visibility: {
        type: String,

        enum: [
          'private'
        ],

        default: 'private',

        required: true
      }
    },
    {
      timestamps: true
    }
  );

/**
 * The first version supports one canonical story
 * per journey.
 */
journeyStorySchema.index(
  {
    user: 1,
    journey: 1
  },
  {
    unique: true
  }
);

module.exports =
  mongoose.model(
    'JourneyStory',
    journeyStorySchema
  );