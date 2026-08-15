const mongoose =
  require('mongoose');

const {
  Schema
} = mongoose;

/**
 * Stores account-level identity.
 *
 * Keep this model intentionally small.
 * Travel behavior belongs in TravelerProfile,
 * not directly on User.
 */
const userSchema =
  new Schema(
    {
      displayName: {
        type: String,
        required: true,
        trim: true
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
      },

      /**
         * Google's stable identifier for this account.
         *
         * We must not use email as Google's permanent
         * account identifier because an email may change.
         */
        googleSubject: {
            type: String,
            unique: true,
            sparse: true,
            default: null
        },
        
        authProvider: {
            type: String,
            enum: [
            'google',
            'development'
            ],
            default: 'development'
        },
        
        lastLoginAt: {
            type: Date,
            default: null
        },

      avatarUrl: {
        type: String,
        default: null
      },

      status: {
        type: String,
        enum: [
          'active',
          'inactive'
        ],
        default: 'active'
      }
    },
    {
      timestamps: true
    }
  );

module.exports =
  mongoose.model(
    'User',
    userSchema
  );