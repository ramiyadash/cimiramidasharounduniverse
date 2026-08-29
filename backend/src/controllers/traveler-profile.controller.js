const TravelerProfile =
  require('../models/traveler-profile.model');

/**
 * Supported Traveler DNA values.
 *
 * Keeping these values controlled prevents spelling
 * variations such as "Mountain", "mountains" and
 * "mountain" from weakening destination matching.
 */
const ALLOWED_PREFERENCES = {
  preferredTerrains: [
    'water',
    'coast',
    'beach',
    'mountains',
    'forest',
    'waterfalls',
    'city',
    'parks',
    'desert',
    'countryside',
    'islands'
  ],

  preferredActivities: [
    'hiking',
    'food',
    'history',
    'walking',
    'beach',
    'nightlife',
    'art',
    'nature',
    'adventure',
    'shopping',
    'music',
    'wellness'
  ],

  preferredWeather: [
    'warm',
    'mild',
    'cool',
    'cold',
    'tropical',
    'dry'
  ],

  preferredTravelStyles: [
    'weekend',
    'family',
    'adventure',
    'food'
  ]
};

function emptyTravelerDNA() {
  return {
    preferredTerrains: [],
    preferredActivities: [],
    preferredWeather: [],
    preferredTravelStyles: [],

    typicalBudgetRange: {
      min: null,
      max: null
    },

    typicalTripDurationDays:
      null
  };
}

/**
 * Returns unique, normalized preference values.
 */
function validatePreferenceValues(
  values,
  fieldName
) {
  if (
    values === undefined ||
    values === null
  ) {
    return {
      value: []
    };
  }

  if (!Array.isArray(values)) {
    return {
      error:
        `${fieldName} must be an array.`
    };
  }

  const normalizedValues = [
    ...new Set(
      values
        .filter(
          value =>
            typeof value ===
            'string'
        )
        .map(
          value =>
            value
              .trim()
              .toLowerCase()
        )
        .filter(Boolean)
    )
  ];

  const allowedValues =
    ALLOWED_PREFERENCES[
      fieldName
    ];

  const unsupportedValues =
    normalizedValues.filter(
      value =>
        !allowedValues.includes(
          value
        )
    );

  if (unsupportedValues.length) {
    return {
      error:
        `Unsupported ${fieldName}: ` +
        `${unsupportedValues.join(', ')}.`
    };
  }

  return {
    value:
      normalizedValues
  };
}

function validateNullableNumber(
  value,
  label,
  minimum,
  maximum
) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return {
      value: null
    };
  }

  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    ) ||
    numericValue < minimum ||
    numericValue > maximum
  ) {
    return {
      error:
        `${label} must be between ` +
        `${minimum} and ${maximum}.`
    };
  }

  return {
    value:
      numericValue
  };
}

/**
 * Validates and normalizes the complete Traveler DNA
 * payload before it reaches MongoDB.
 */
function validateTravelerDNA(
  requestBody
) {
  const travelerDNA =
    requestBody?.travelerDNA;

  if (
    !travelerDNA ||
    typeof travelerDNA !==
      'object' ||
    Array.isArray(
      travelerDNA
    )
  ) {
    return {
      error:
        'Traveler DNA is required.'
    };
  }

  const validatedDNA =
    emptyTravelerDNA();

  for (
    const fieldName
    of [
      'preferredTerrains',
      'preferredActivities',
      'preferredWeather',
      'preferredTravelStyles'
    ]
  ) {
    const validation =
      validatePreferenceValues(
        travelerDNA[fieldName],
        fieldName
      );

    if (validation.error) {
      return validation;
    }

    validatedDNA[fieldName] =
      validation.value;
  }

  const budget =
    travelerDNA
      .typicalBudgetRange ||
    {};

  const minimumBudgetValidation =
    validateNullableNumber(
      budget.min,
      'Minimum budget',
      0,
      100000
    );

  if (
    minimumBudgetValidation.error
  ) {
    return minimumBudgetValidation;
  }

  const maximumBudgetValidation =
    validateNullableNumber(
      budget.max,
      'Maximum budget',
      0,
      100000
    );

  if (
    maximumBudgetValidation.error
  ) {
    return maximumBudgetValidation;
  }

  if (
    minimumBudgetValidation
      .value !== null &&
    maximumBudgetValidation
      .value !== null &&
    minimumBudgetValidation
      .value >
      maximumBudgetValidation
        .value
  ) {
    return {
      error:
        'Minimum budget cannot exceed maximum budget.'
    };
  }

  const durationValidation =
    validateNullableNumber(
      travelerDNA
        .typicalTripDurationDays,
      'Typical trip duration',
      1,
      365
    );

  if (durationValidation.error) {
    return durationValidation;
  }

  validatedDNA.typicalBudgetRange = {
    min:
      minimumBudgetValidation
        .value,

    max:
      maximumBudgetValidation
        .value
  };

  validatedDNA
    .typicalTripDurationDays =
    durationValidation.value;

  return {
    value:
      validatedDNA
  };
}

function hasPersonalizedDNA(
  travelerDNA
) {
  return (
    travelerDNA
      .preferredTerrains
      .length > 0 ||
    travelerDNA
      .preferredActivities
      .length > 0 ||
    travelerDNA
      .preferredWeather
      .length > 0 ||
    travelerDNA
      .preferredTravelStyles
      .length > 0 ||
    travelerDNA
      .typicalBudgetRange
      .min !== null ||
    travelerDNA
      .typicalBudgetRange
      .max !== null ||
    travelerDNA
      .typicalTripDurationDays !==
      null
  );
}

function buildProfileResponse(
  profile
) {
  const travelerDNA =
    profile?.travelerDNA
      ? {
          preferredTerrains:
            profile
              .travelerDNA
              .preferredTerrains ||
            [],

          preferredActivities:
            profile
              .travelerDNA
              .preferredActivities ||
            [],

          preferredWeather:
            profile
              .travelerDNA
              .preferredWeather ||
            [],

          preferredTravelStyles:
            profile
              .travelerDNA
              .preferredTravelStyles ||
            [],

          typicalBudgetRange: {
            min:
              profile
                .travelerDNA
                .typicalBudgetRange
                ?.min ??
              null,

            max:
              profile
                .travelerDNA
                .typicalBudgetRange
                ?.max ??
              null
          },

          typicalTripDurationDays:
            profile
              .travelerDNA
              .typicalTripDurationDays ??
            null
        }
      : emptyTravelerDNA();

  return {
    travelerProfile: {
      id:
        profile?._id
          ?.toString() ||
        null,

      travelerDNA,

      updatedAt:
        profile?.updatedAt ||
        null
    },

    personalized:
      hasPersonalizedDNA(
        travelerDNA
      )
  };
}

/**
 * GET /api/traveler-profile
 *
 * Returns the authenticated user's Traveler DNA.
 * An empty response is returned when the user has
 * not created a profile yet.
 */
exports.getTravelerProfile =
  async function getTravelerProfile(
    req,
    res,
    next
  ) {
    try {
      const profile =
        await TravelerProfile
          .findOne({
            user:
              req.user._id
          })
          .lean();

      return res.status(200).json(
        buildProfileResponse(
          profile
        )
      );
    } catch (error) {
      return next(error);
    }
  };

/**
 * PATCH /api/traveler-profile
 *
 * Creates or updates Traveler DNA belonging only
 * to the authenticated user.
 */
exports.updateTravelerProfile =
  async function updateTravelerProfile(
    req,
    res,
    next
  ) {
    try {
      const validation =
        validateTravelerDNA(
          req.body
        );

      if (validation.error) {
        return res.status(400).json({
          message:
            validation.error
        });
      }

      const profile =
        await TravelerProfile
          .findOneAndUpdate(
            {
              user:
                req.user._id
            },

            {
              $set: {
                travelerDNA:
                  validation.value
              },

              $setOnInsert: {
                user:
                  req.user._id
              }
            },

            {
              new: true,
              upsert: true,
              runValidators: true,
              setDefaultsOnInsert: true
            }
          )
          .lean();

      return res.status(200).json({
        message:
          'Your Traveler DNA has been updated.',

        ...buildProfileResponse(
          profile
        )
      });
    } catch (error) {
      /**
       * The unique user index protects against two
       * first-time profile requests racing.
       */
      if (
        error?.code === 11000
      ) {
        return res.status(409).json({
          message:
            'Your Traveler Profile was created by another request. Please try saving again.'
        });
      }

      return next(error);
    }
  };