const mongoose =
  require('mongoose');

const Journey =
  require('../models/journey.model');

/**
 * Converts a journey workflow status into a
 * My Universe map status when universe.status
 * has not been explicitly assigned.
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

/**
 * GET /api/journeys/universe/:userId
 *
 * Returns the journeys that can be displayed on
 * the My Universe map for one traveler.
 *
 * Once authentication is implemented, userId will
 * come from req.user._id instead of the URL.
 */
exports.getUniverseJourneys =
  async function getUniverseJourneys(
    req,
    res,
    next
  ) {
    try {
      const {
        userId
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          message:
            'A valid user ID is required.'
        });
      }

      const journeys =
        await Journey.find({
          user: userId,

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
               * MapLibre expects coordinates in
               * [longitude, latitude] order.
               */
              coordinates: [
                universe.coordinates
                  .longitude,

                universe.coordinates
                  .latitude
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