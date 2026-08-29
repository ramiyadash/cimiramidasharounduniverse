const express =
  require('express');

const requireAuth =
  require('../middleware/auth.middleware');

const {
  createJourney,
  getUniverseJourneys,
  updateJourney
} =
  require('../controllers/journey.controller');

const router =
  express.Router();

/**
 * Creates a journey for the authenticated user.
 */
router.post(
  '/',
  requireAuth,
  createJourney
);

/**
 * Returns only the authenticated user's journeys.
 */
router.get(
  '/universe',
  requireAuth,
  getUniverseJourneys
);

router.patch(
    '/:journeyId',
    requireAuth,
    updateJourney
  );

module.exports =
  router;