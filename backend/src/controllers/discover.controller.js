const mongoose =
  require('mongoose');

const Destination =
  require('../models/destination.model');

const Journey =
  require('../models/journey.model');

const TravelerProfile =
  require('../models/traveler-profile.model');

/**
 * Converts preference values into a consistent format
 * before comparing Traveler DNA with destinations.
 */
function normalizeValues(
  values = []
) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
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
    .filter(Boolean);
}

/**
 * Finds values shared by the destination and the
 * traveler's stored preferences.
 */
function findMatches(
  destinationValues,
  travelerValues
) {
  const travelerValueSet =
    new Set(
      normalizeValues(
        travelerValues
      )
    );

  return normalizeValues(
    destinationValues
  ).filter(
    value =>
      travelerValueSet.has(
        value
      )
  );
}

function rangesOverlap(
  firstMinimum,
  firstMaximum,
  secondMinimum,
  secondMaximum
) {
  const values = [
    firstMinimum,
    firstMaximum,
    secondMinimum,
    secondMaximum
  ];

  if (
    values.some(
      value =>
        typeof value !==
          'number' ||
        !Number.isFinite(value)
    )
  ) {
    return false;
  }

  return (
    firstMinimum <=
      secondMaximum &&
    secondMinimum <=
      firstMaximum
  );
}

/**
 * Calculates a simple, explainable relevance score.
 *
 * This is intentionally deterministic for v1.
 * Later, Dash can combine this with behavioral
 * learning or AI recommendations.
 */
function calculateDestinationMatch(
  destination,
  travelerProfile
) {
  const travelerDNA =
    travelerProfile?.travelerDNA ||
    {};

  const discovery =
    destination.discovery ||
    {};

  let score =
    destination.featured
      ? 5
      : 0;

  const reasons = [];

  const terrainMatches =
    findMatches(
      discovery.terrains,
      travelerDNA.preferredTerrains
    );

  if (terrainMatches.length) {
    score += Math.min(
      terrainMatches.length * 20,
      40
    );

    reasons.push(
      `Matches your interest in ` +
      `${terrainMatches.join(', ')}`
    );
  }

  const activityMatches =
    findMatches(
      discovery.activities,
      travelerDNA.preferredActivities
    );

  if (activityMatches.length) {
    score += Math.min(
      activityMatches.length * 12,
      36
    );

    reasons.push(
      `Offers ${activityMatches.join(', ')}`
    );
  }

  const weatherMatches =
    findMatches(
      discovery.weather,
      travelerDNA.preferredWeather
    );

  if (weatherMatches.length) {
    score += Math.min(
      weatherMatches.length * 15,
      30
    );

    reasons.push(
      `Fits your ${weatherMatches.join(', ')} ` +
      `weather preference`
    );
  }

  const styleMatches =
    findMatches(
      discovery.travelStyles,
      travelerDNA.preferredTravelStyles
    );

  if (styleMatches.length) {
    score += Math.min(
      styleMatches.length * 15,
      30
    );

    reasons.push(
      `Works well for a ` +
      `${styleMatches.join(', ')} journey`
    );
  }

  const travelerBudget =
    travelerDNA.typicalBudgetRange ||
    {};

  const destinationBudget =
    discovery.budgetRange ||
    {};

  if (
    rangesOverlap(
      travelerBudget.min,
      travelerBudget.max,
      destinationBudget.min,
      destinationBudget.max
    )
  ) {
    score += 15;

    reasons.push(
      'Fits your typical travel budget'
    );
  }

  const typicalDuration =
    travelerDNA
      .typicalTripDurationDays;

  const destinationDuration =
    discovery.durationDays ||
    {};

  if (
    typeof typicalDuration ===
      'number' &&
    typeof destinationDuration.min ===
      'number' &&
    typeof destinationDuration.max ===
      'number' &&
    typicalDuration >=
      destinationDuration.min &&
    typicalDuration <=
      destinationDuration.max
  ) {
    score += 15;

    reasons.push(
      'Fits your usual trip length'
    );
  }

  if (!reasons.length) {
    reasons.push(
      'A fresh possibility for your Universe'
    );
  }

  return {
    /**
     * This is a relevance score, not a scientific
     * probability.
     */
    matchScore:
      Math.min(
        score,
        100
      ),

    matchReasons:
      reasons.slice(
        0,
        3
      )
  };
}

/**
 * Converts a catalog Destination into the response
 * shape Angular will use.
 */
function buildDestinationResponse(
  destination,
  travelerProfile,
  savedJourneyByDestination
) {
  const destinationId =
    destination._id.toString();

  const match =
    calculateDestinationMatch(
      destination,
      travelerProfile
    );

  const savedJourney =
    savedJourneyByDestination.get(
      destinationId
    );

  return {
    id:
      destinationId,

    slug:
      destination.slug,

    name:
      destination.name,

    country:
      destination.country,

    countryCode:
      destination.countryCode,

    region:
      destination.region,

    locations:
      destination.locations || [],

    summary:
      destination.summary,

    description:
      destination.description,

    emoji:
      destination.emoji || '📍',

    coordinates: [
      destination.coordinates
        .longitude,

      destination.coordinates
        .latitude
    ],

    discovery:
      destination.discovery || {},

    media:
      destination.media || {},

    featured:
      Boolean(
        destination.featured
      ),

    ...match,

    isSaved:
      Boolean(savedJourney),

    savedJourneyId:
      savedJourney
        ? savedJourney._id.toString()
        : null
  };
}

/**
 * GET /api/discover
 *
 * Returns active catalog destinations personalized
 * for the authenticated user.
 */
exports.getDiscoverDestinations =
  async function getDiscoverDestinations(
    req,
    res,
    next
  ) {
    try {
      const requestedLimit =
        Number(req.query.limit);

      const limit =
        Number.isInteger(
          requestedLimit
        ) &&
        requestedLimit > 0
          ? Math.min(
              requestedLimit,
              50
            )
          : 24;

      const requestedStyle =
        typeof req.query.style ===
          'string'
          ? req.query.style
              .trim()
              .toLowerCase()
          : null;

      const requestedTerrain =
        typeof req.query.terrain ===
          'string'
          ? req.query.terrain
              .trim()
              .toLowerCase()
          : null;

      const requestedWeather =
        typeof req.query.weather ===
          'string'
          ? req.query.weather
              .trim()
              .toLowerCase()
          : null;

      const [
        travelerProfile,
        destinations,
        savedJourneys
      ] =
        await Promise.all([
          TravelerProfile.findOne({
            user:
              req.user._id
          }).lean(),

          Destination.find({
            status:
              'active'
          }).lean(),

          Journey.find({
            user:
              req.user._id,

            status: {
              $ne: 'archived'
            },

            'selectedDestination.destinationId': {
              $type: 'string'
            }
          })
            .select(
              '_id selectedDestination.destinationId'
            )
            .lean()
        ]);

      const savedJourneyByDestination =
        new Map();

      for (
        const journey
        of savedJourneys
      ) {
        savedJourneyByDestination.set(
          journey
            .selectedDestination
            .destinationId,

          journey
        );
      }

      let discoveryResults =
        destinations.map(
          destination =>
            buildDestinationResponse(
              destination,
              travelerProfile,
              savedJourneyByDestination
            )
        );

      if (requestedStyle) {
        discoveryResults =
          discoveryResults.filter(
            destination =>
              normalizeValues(
                destination
                  .discovery
                  .travelStyles
              ).includes(
                requestedStyle
              )
          );
      }

      if (requestedTerrain) {
        discoveryResults =
          discoveryResults.filter(
            destination =>
              normalizeValues(
                destination
                  .discovery
                  .terrains
              ).includes(
                requestedTerrain
              )
          );
      }

      if (requestedWeather) {
        discoveryResults =
          discoveryResults.filter(
            destination =>
              normalizeValues(
                destination
                  .discovery
                  .weather
              ).includes(
                requestedWeather
              )
          );
      }

      discoveryResults.sort(
        (
          firstDestination,
          secondDestination
        ) => {
          if (
            secondDestination
              .matchScore !==
            firstDestination
              .matchScore
          ) {
            return (
              secondDestination
                .matchScore -
              firstDestination
                .matchScore
            );
          }

          if (
            secondDestination
              .featured !==
            firstDestination
              .featured
          ) {
            return secondDestination
              .featured
              ? 1
              : -1;
          }

          return firstDestination
            .name
            .localeCompare(
              secondDestination.name
            );
        }
      );

      return res.status(200).json({
        destinations:
          discoveryResults.slice(
            0,
            limit
          ),

        personalized:
          Boolean(
            travelerProfile
          )
      });
    } catch (error) {
      return next(error);
    }
  };

/**
 * Chooses the closest existing journey type from the
 * destination's catalog attributes.
 */
function determineJourneyType(
  destination
) {
  const supportedTypes = [
    'weekend',
    'family',
    'adventure',
    'food'
  ];

  const travelStyles =
    normalizeValues(
      destination
        .discovery
        ?.travelStyles
    );

  return (
    supportedTypes.find(
      journeyType =>
        travelStyles.includes(
          journeyType
        )
    ) ||
    'adventure'
  );
}

/**
 * POST /api/discover/:destinationId/save
 *
 * Saves a catalog destination as a real dreaming
 * Journey belonging only to the authenticated user.
 */
exports.saveDestinationToUniverse =
  async function saveDestinationToUniverse(
    req,
    res,
    next
  ) {
    try {
      const {
        destinationId
      } =
        req.params;

      if (
        !mongoose.Types.ObjectId
          .isValid(destinationId)
      ) {
        return res.status(400).json({
          message:
            'A valid destination ID is required.'
        });
      }

      const destination =
        await Destination.findOne({
          _id:
            destinationId,

          status:
            'active'
        });

      if (!destination) {
        return res.status(404).json({
          message:
            'The destination was not found.'
        });
      }

      const existingJourney =
        await Journey.findOne({
          user:
            req.user._id,

          status: {
            $ne: 'archived'
          },

          'selectedDestination.destinationId':
            destinationId
        });

      /**
       * Saving is idempotent. Repeated requests return
       * the existing Journey instead of creating a
       * second pin.
       */
      if (existingJourney) {
        return res.status(200).json({
          message:
            'This destination is already in your Universe.',

          destinationId,

          journeyId:
            existingJourney._id
              .toString(),

          alreadySaved:
            true
        });
      }

      const journey =
        await Journey.create({
          user:
            req.user._id,

          title:
            `${destination.name} Dream`,

          journeyType:
            determineJourneyType(
              destination
            ),

          status:
            'planning',

          universe: {
            isVisible:
              true,

            status:
              'dreaming',

            country:
              destination.country,

            countryCode:
              destination.countryCode,

            region:
              destination.region,

            locations:
              destination.locations,

            description:
              destination.description,

            emoji:
              destination.emoji ||
              '📍',

            coordinates: {
              longitude:
                destination
                  .coordinates
                  .longitude,

              latitude:
                destination
                  .coordinates
                  .latitude
            },

            dateLabel:
              'Someday',

            photoCount:
              0,

            storyCount:
              0
          },

          selectedDestination: {
            destinationId:
              destinationId,

            selectedAt:
              new Date()
          }
        });

      return res.status(201).json({
        message:
          `${destination.name} was added to your Universe.`,

        destinationId,

        journeyId:
          journey._id.toString(),

        alreadySaved:
          false
      });
    } catch (error) {
      /**
       * The unique compound index handles two save
       * requests arriving at nearly the same time.
       */
      if (
        error?.code === 11000
      ) {
        const existingJourney =
          await Journey.findOne({
            user:
              req.user._id,

            'selectedDestination.destinationId':
              req.params.destinationId
          });

        if (existingJourney) {
          return res.status(200).json({
            message:
              'This destination is already in your Universe.',

            destinationId:
              req.params.destinationId,

            journeyId:
              existingJourney._id
                .toString(),

            alreadySaved:
              true
          });
        }
      }

      return next(error);
    }
  };