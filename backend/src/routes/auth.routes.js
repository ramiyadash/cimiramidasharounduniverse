const express =
  require('express');

const {
  googleLogin,
  getCurrentUser,
  logout
} =
  require('../controllers/auth.controller');

const requireAuth =
  require('../middleware/auth.middleware');

const router =
  express.Router();

router.post(
  '/google',
  googleLogin
);

router.get(
  '/me',
  requireAuth,
  getCurrentUser
);

router.post(
  '/logout',
  logout
);

/**
 * Export the router directly so app.use()
 * receives an Express middleware function.
 */
module.exports =
  router;