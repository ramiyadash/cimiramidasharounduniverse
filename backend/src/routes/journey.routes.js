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

const {
    getJourneyStory,
    saveJourneyStory,
    deleteJourneyStory
  } =
    require('../controllers/journey-story.controller');

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

/**
 * Loads the private story belonging to the
 * authenticated user's journey.
 */
router.get(
  '/:journeyId/story',
  requireAuth,
  getJourneyStory
);

/**
 * Creates or replaces the journey's private story.
 */
router.put(
  '/:journeyId/story',
  requireAuth,
  saveJourneyStory
);

/**
 * Deletes the story without deleting its memories.
 */
router.delete(
  '/:journeyId/story',
  requireAuth,
  deleteJourneyStory
);

module.exports =
  router;