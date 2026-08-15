const express =
  require('express');

const {
  getUniverseJourneys
} =
  require('../controllers/journey.controller');

const router =
  express.Router();

/**
 * Returns map-ready journey data for a traveler.
 */
router.get(
  '/universe/:userId',
  getUniverseJourneys
);

module.exports = router;