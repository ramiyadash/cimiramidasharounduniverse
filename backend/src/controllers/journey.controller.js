const mongoose =
  require('mongoose');

const Journey =
  require('../models/journey.model');

/**
 * Converts the workflow status into a My Universe
 * status when universe.status was not explicitly set.
 */
function getUniverseStatus(journey) {
  if (journey.universe?.status) {
    return journey.universe.status;
  }

  if (journey.status === 'completed') {
    return 'visited';
  }

  return 'planned';
}

const JOURNEY_TYPES = [
    'weekend',
    'family',
    'adventure',
    'food'
  ];
  
  const UNIVERSE_STATUSES = [
    'visited',
    'planned',
    'dreaming'
  ];
  
  /**
   * Converts a My Universe status into the internal
   * planning workflow status.
   */
  function getWorkflowStatus(
    universeStatus
  ) {
    switch (universeStatus) {
      case 'visited':
        return 'completed';
  
      case 'planned':
        return 'planned';
  
      case 'dreaming':
        return 'planning';
  
      default:
        return 'planning';
    }
  }
  
  /**
   * Converts an optional date value into a Date.
   *
   * null means the field was empty.
   * undefined means it was provided but invalid.
   */
  function parseOptionalDate(value) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null;
    }
  
    const parsedDate =
      new Date(value);
  
    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return undefined;
    }
  
    return parsedDate;
  }
  
  /**
   * POST /api/journeys
   *
   * Creates a map-ready journey owned exclusively by
   * the authenticated user.
   */
  exports.createJourney =
    async function createJourney(
      req,
      res,
      next
    ) {
      try {
        const {
          title,
          journeyType,
          universe
        } = req.body || {};
  
        const normalizedTitle =
          typeof title === 'string'
            ? title.trim()
            : '';
  
        if (
          !normalizedTitle ||
          normalizedTitle.length > 120
        ) {
          return res.status(400).json({
            message:
              'Journey name is required and must not exceed 120 characters.'
          });
        }
  
        if (
          !JOURNEY_TYPES.includes(
            journeyType
          )
        ) {
          return res.status(400).json({
            message:
              'A valid journey type is required.'
          });
        }
  
        if (
          !universe ||
          !UNIVERSE_STATUSES.includes(
            universe.status
          )
        ) {
          return res.status(400).json({
            message:
              'A valid Universe status is required.'
          });
        }
  
        const country =
          typeof universe.country ===
          'string'
            ? universe.country.trim()
            : '';
  
        if (
          !country ||
          country.length > 100
        ) {
          return res.status(400).json({
            message:
              'Country is required and must not exceed 100 characters.'
          });
        }
  
        const region =
          typeof universe.region ===
          'string'
            ? universe.region.trim()
            : '';
  
        if (region.length > 100) {
          return res.status(400).json({
            message:
              'Region must not exceed 100 characters.'
          });
        }
  
        const countryCode =
          typeof universe.countryCode ===
          'string'
            ? universe.countryCode
                .trim()
                .toUpperCase()
            : '';
  
        if (
          countryCode &&
          !/^[A-Z]{2}$/.test(
            countryCode
          )
        ) {
          return res.status(400).json({
            message:
              'Country code must contain two letters.'
          });
        }
  
        const locations =
          Array.isArray(
            universe.locations
          )
            ? universe.locations
                .filter(
                  location =>
                    typeof location ===
                    'string'
                )
                .map(
                  location =>
                    location.trim()
                )
                .filter(Boolean)
            : [];
  
        if (
          locations.length === 0 ||
          locations.length > 20
        ) {
          return res.status(400).json({
            message:
              'Provide between 1 and 20 locations.'
          });
        }
  
        if (
          locations.some(
            location =>
              location.length > 100
          )
        ) {
          return res.status(400).json({
            message:
              'Each location must not exceed 100 characters.'
          });
        }
  
        const longitude =
          Number(
            universe.coordinates
              ?.longitude
          );
  
        const latitude =
          Number(
            universe.coordinates
              ?.latitude
          );
  
        if (
          !Number.isFinite(
            longitude
          ) ||
          longitude < -180 ||
          longitude > 180 ||
          !Number.isFinite(
            latitude
          ) ||
          latitude < -90 ||
          latitude > 90
        ) {
          return res.status(400).json({
            message:
              'Select a valid location on the map.'
          });
        }
  
        const startDate =
          parseOptionalDate(
            universe.startDate
          );
  
        const endDate =
          parseOptionalDate(
            universe.endDate
          );
  
        if (
          startDate === undefined ||
          endDate === undefined
        ) {
          return res.status(400).json({
            message:
              'One or more journey dates are invalid.'
          });
        }
  
        if (
          startDate &&
          endDate &&
          endDate < startDate
        ) {
          return res.status(400).json({
            message:
              'The end date cannot be before the start date.'
          });
        }
  
        const description =
          typeof universe.description ===
          'string'
            ? universe.description.trim()
            : '';
  
        if (
          !description ||
          description.length > 1000
        ) {
          return res.status(400).json({
            message:
              'Description is required and must not exceed 1,000 characters.'
          });
        }
  
        const dateLabel =
          typeof universe.dateLabel ===
          'string'
            ? universe.dateLabel.trim()
            : '';
  
        if (
          !dateLabel ||
          dateLabel.length > 80
        ) {
          return res.status(400).json({
            message:
              'A journey date label is required.'
          });
        }
  
        const emoji =
          typeof universe.emoji ===
          'string' &&
          universe.emoji.trim()
            ? universe.emoji
                .trim()
                .slice(0, 16)
            : '📍';
  
        const journey =
          await Journey.create({
            /**
             * Critical ownership boundary:
             * never use req.body.user.
             */
            user:
              req.user._id,
  
            title:
              normalizedTitle,
  
            journeyType,
  
            status:
              getWorkflowStatus(
                universe.status
              ),
  
            universe: {
              isVisible: true,
  
              status:
                universe.status,
  
              country,
  
              countryCode:
                countryCode || null,
  
              region:
                region || null,
  
              locations,
  
              description,
  
              emoji,
  
              coordinates: {
                longitude,
                latitude
              },
  
              startDate,
              endDate,
              dateLabel,
  
              photoCount: 0,
              storyCount: 0
            }
          });
  
        const savedUniverse =
          journey.universe;
  
        return res.status(201).json({
          place: {
            id:
              journey._id.toString(),
  
            journeyId:
              journey._id.toString(),
  
            title:
              journey.title,
            
            journeyType:
              journey.journeyType,
            
            country:
              savedUniverse.country,
  
            countryCode:
              savedUniverse.countryCode ||
              null,
  
            region:
              savedUniverse.region ||
              null,
  
            locations:
              savedUniverse.locations,
  
            description:
              savedUniverse.description,
  
            date:
              savedUniverse.dateLabel,
  
            startDate:
              savedUniverse.startDate ||
              null,
  
            endDate:
              savedUniverse.endDate ||
              null,
  
            status:
              savedUniverse.status,
  
            coordinates: [
              savedUniverse.coordinates
                .longitude,
  
              savedUniverse.coordinates
                .latitude
            ],
  
            emoji:
              savedUniverse.emoji,
  
            journeys: 1,
            photos: 0,
            stories: 0
          }
        });
      } catch (error) {
        return next(error);
      }
    };

  
  /**
 * PATCH /api/journeys/:journeyId
 *
 * Updates a journey only when it belongs to the
 * authenticated user.
 */
exports.updateJourney =
async function updateJourney(
  req,
  res,
  next
) {
  try {
    const {
      journeyId
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        journeyId
      )
    ) {
      return res.status(400).json({
        message:
          'A valid journey ID is required.'
      });
    }

    const {
      title,
      journeyType,
      universe
    } = req.body || {};

    const normalizedTitle =
      typeof title === 'string'
        ? title.trim()
        : '';

    if (
      !normalizedTitle ||
      normalizedTitle.length > 120
    ) {
      return res.status(400).json({
        message:
          'Journey name is required and must not exceed 120 characters.'
      });
    }

    if (
      !JOURNEY_TYPES.includes(
        journeyType
      )
    ) {
      return res.status(400).json({
        message:
          'A valid journey type is required.'
      });
    }

    if (
      !universe ||
      !UNIVERSE_STATUSES.includes(
        universe.status
      )
    ) {
      return res.status(400).json({
        message:
          'A valid Universe status is required.'
      });
    }

    const country =
      typeof universe.country ===
      'string'
        ? universe.country.trim()
        : '';

    if (
      !country ||
      country.length > 100
    ) {
      return res.status(400).json({
        message:
          'Country is required and must not exceed 100 characters.'
      });
    }

    const region =
      typeof universe.region ===
      'string'
        ? universe.region.trim()
        : '';

    const countryCode =
      typeof universe.countryCode ===
      'string'
        ? universe.countryCode
            .trim()
            .toUpperCase()
        : '';

    if (
      countryCode &&
      !/^[A-Z]{2}$/.test(
        countryCode
      )
    ) {
      return res.status(400).json({
        message:
          'Country code must contain two letters.'
      });
    }

    const locations =
      Array.isArray(
        universe.locations
      )
        ? universe.locations
            .filter(
              location =>
                typeof location ===
                'string'
            )
            .map(
              location =>
                location.trim()
            )
            .filter(Boolean)
        : [];

    if (
      locations.length === 0 ||
      locations.length > 20
    ) {
      return res.status(400).json({
        message:
          'Provide between 1 and 20 locations.'
      });
    }

    const longitude =
      Number(
        universe.coordinates
          ?.longitude
      );

    const latitude =
      Number(
        universe.coordinates
          ?.latitude
      );

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180 ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      return res.status(400).json({
        message:
          'Select a valid location on the map.'
      });
    }

    const startDate =
      parseOptionalDate(
        universe.startDate
      );

    const endDate =
      parseOptionalDate(
        universe.endDate
      );

    if (
      startDate === undefined ||
      endDate === undefined
    ) {
      return res.status(400).json({
        message:
          'One or more journey dates are invalid.'
      });
    }

    if (
      startDate &&
      endDate &&
      endDate < startDate
    ) {
      return res.status(400).json({
        message:
          'The end date cannot be before the start date.'
      });
    }

    const description =
      typeof universe.description ===
      'string'
        ? universe.description.trim()
        : '';

    if (
      !description ||
      description.length > 1000
    ) {
      return res.status(400).json({
        message:
          'Description is required and must not exceed 1,000 characters.'
      });
    }

    const dateLabel =
      typeof universe.dateLabel ===
      'string'
        ? universe.dateLabel.trim()
        : '';

    if (
      !dateLabel ||
      dateLabel.length > 80
    ) {
      return res.status(400).json({
        message:
          'A journey date label is required.'
      });
    }

    const emoji =
      typeof universe.emoji ===
      'string' &&
      universe.emoji.trim()
        ? universe.emoji
            .trim()
            .slice(0, 16)
        : '📍';

    const journey =
      await Journey.findOneAndUpdate(
        {
          /**
           * Both conditions are required.
           *
           * A valid journey ID alone is never enough
           * to authorize an update.
           */
          _id:
            journeyId,

          user:
            req.user._id
        },

        {
          $set: {
            title:
              normalizedTitle,

            journeyType,

            status:
              getWorkflowStatus(
                universe.status
              ),

            'universe.isVisible':
              true,

            'universe.status':
              universe.status,

            'universe.country':
              country,

            'universe.countryCode':
              countryCode || null,

            'universe.region':
              region || null,

            'universe.locations':
              locations,

            'universe.description':
              description,

            'universe.emoji':
              emoji,

            'universe.coordinates.longitude':
              longitude,

            'universe.coordinates.latitude':
              latitude,

            'universe.startDate':
              startDate,

            'universe.endDate':
              endDate,

            'universe.dateLabel':
              dateLabel
          }
        },

        {
          new: true,
          runValidators: true
        }
      ).lean();

    if (!journey) {
      /**
       * Do not reveal whether the journey exists
       * under another user's account.
       */
      return res.status(404).json({
        message:
          'Journey not found.'
      });
    }

    return res.status(200).json({
      place: {
        id:
          journey._id.toString(),

        journeyId:
          journey._id.toString(),

        title:
          journey.title,

        journeyType:
          journey.journeyType,

        country:
          journey.universe.country,

        countryCode:
          journey.universe
            .countryCode ||
          null,

        region:
          journey.universe.region ||
          null,

        locations:
          journey.universe.locations,

        description:
          journey.universe.description,

        date:
          journey.universe.dateLabel,

        startDate:
          journey.universe.startDate ||
          null,

        endDate:
          journey.universe.endDate ||
          null,

        status:
          journey.universe.status,

        coordinates: [
          journey.universe
            .coordinates
            .longitude,

          journey.universe
            .coordinates
            .latitude
        ],

        emoji:
          journey.universe.emoji,

        journeys: 1,

        photos:
          journey.universe.photoCount ||
          0,

        stories:
          journey.universe.storyCount ||
          0
      }
    });
  } catch (error) {
    return next(error);
  }
};  
/**
 * GET /api/journeys/universe
 *
 * Returns only the journeys belonging to the
 * authenticated user.
 *
 * The user ID never comes from URL parameters,
 * query parameters or the request body.
 */
exports.getUniverseJourneys =
  async function getUniverseJourneys(
    req,
    res,
    next
  ) {
    try {
      const journeys =
        await Journey.find({
          /**
           * Strict ownership boundary.
           *
           * requireAuth created req.user after
           * validating the signed session cookie.
           */
          user: req.user._id,

          status: {
            $ne: 'archived'
          },

          'universe.isVisible': {
            $ne: false
          },

          'universe.coordinates.longitude': {
            $ne: null
          },

          'universe.coordinates.latitude': {
            $ne: null
          }
        })
          /**
           * Return only fields needed by My Universe.
           */
          .select({
            title: 1,
            journeyType: 1,
            status: 1,
            universe: 1,
            createdAt: 1
          })
          .sort({
            'universe.startDate': -1,
            createdAt: -1
          })
          .lean();

      const places =
        journeys.map(
          journey => {
            const universe =
              journey.universe || {};

            return {
              id:
                journey._id.toString(),

              journeyId:
                journey._id.toString(),

              title:
                journey.title,
              
              journeyType:
                journey.journeyType,  
                
              country:
                universe.country ||
                journey.title,

              countryCode:
                universe.countryCode ||
                null,

              region:
                universe.region ||
                null,

              locations:
                universe.locations ||
                [],

              description:
                universe.description ||
                '',

              date:
                universe.dateLabel ||
                '',

              startDate:
                universe.startDate ||
                null,

              endDate:
                universe.endDate ||
                null,

              status:
                getUniverseStatus(
                  journey
                ),

              /**
               * MapLibre requires:
               * [longitude, latitude]
               */
              coordinates: [
                universe.coordinates
                  ?.longitude,

                universe.coordinates
                  ?.latitude
              ],

              emoji:
                universe.emoji ||
                '📍',

              journeys: 1,

              photos:
                universe.photoCount ||
                0,

              stories:
                universe.storyCount ||
                0
            };
          }
        );

      const summary = {
        visited:
          places.filter(
            place =>
              place.status ===
              'visited'
          ).length,

        planned:
          places.filter(
            place =>
              place.status ===
              'planned'
          ).length,

        dreaming:
          places.filter(
            place =>
              place.status ===
              'dreaming'
          ).length
      };

      return res.status(200).json({
        places,
        summary
      });
    } catch (error) {
      return next(error);
    }
  };