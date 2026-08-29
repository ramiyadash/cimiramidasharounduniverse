const express =
  require('express');

const requireAuth =
  require('../middleware/auth.middleware');

const {
  getDiscoverDestinations,
  saveDestinationToUniverse
} =
  require('../controllers/discover.controller');

const router =
  express.Router();

router.get(
  '/',
  requireAuth,
  getDiscoverDestinations
);

router.post(
  '/:destinationId/save',
  requireAuth,
  saveDestinationToUniverse
);

module.exports =
  router;