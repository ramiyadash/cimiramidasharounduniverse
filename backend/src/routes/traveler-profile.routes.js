const express =
  require('express');

const requireAuth =
  require('../middleware/auth.middleware');

const {
  getTravelerProfile,
  updateTravelerProfile
} =
  require('../controllers/traveler-profile.controller');

const router =
  express.Router();

router.get(
  '/',
  requireAuth,
  getTravelerProfile
);

router.patch(
  '/',
  requireAuth,
  updateTravelerProfile
);

module.exports =
  router;