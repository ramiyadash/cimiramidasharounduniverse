const mongoose =
  require('mongoose');

const {
  Schema
} = mongoose;

/**
 * Stores the conversation attached to a journey.
 *
 * This will eventually replace the in-memory
 * conversation.service.js storage.
 */
const conversationSchema =
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

      messages: [
        {
          sender: {
            type: String,

            enum: [
              'user',
              'dash'
            ],

            required: true
          },

          text: {
            type: String,
            required: true
          },

          createdAt: {
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

conversationSchema.index(
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
    'Conversation',
    conversationSchema
  );