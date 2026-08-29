const express =
  require('express');

const requireAuth =
  require('../middleware/auth.middleware');

const {
  createPhotoUploadUrl,
  completePhotoUpload,
  listJourneyPhotos
} =
  require('../controllers/journey-media.controller');

const router =
  express.Router();

/**
 * Generates a short-lived S3 URL for uploading
 * a photo belonging to the authenticated user's
 * journey.
 */
router.post(
  '/:journeyId/media/upload-url',
  requireAuth,
  createPhotoUploadUrl
);

/**
 * Confirms that the photo reached S3 and marks
 * its MongoDB record as ready.
 */
router.post(
  '/:journeyId/media/:mediaId/complete',
  requireAuth,
  completePhotoUpload
);

/**
 * Returns ready photos belonging to one journey.
 */
router.get(
  '/:journeyId/media',
  requireAuth,
  listJourneyPhotos
);

module.exports =
  router;