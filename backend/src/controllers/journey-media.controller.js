const {
    randomUUID
  } =
    require('crypto');
  
  const mongoose =
    require('mongoose');
  
  const {
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand
  } =
    require('@aws-sdk/client-s3');
  
  const {
    getSignedUrl
  } =
    require('@aws-sdk/s3-request-presigner');
  
  const Journey =
    require('../models/journey.model');
  
  const JourneyMedia =
    require('../models/journey-media.model');
  
  const {
    getMediaStorage
  } =
    require('../config/media-storage');
  
  /**
   * Individual photos are limited to 15 MB.
   */
  const MAX_PHOTO_SIZE =
    15 * 1024 * 1024;
  
  /**
   * The browser has five minutes to begin uploading
   * through the generated S3 URL.
   */
  const UPLOAD_URL_EXPIRATION_SECONDS =
    5 * 60;
  
  /**
   * Gallery image URLs remain valid for 15 minutes.
   */
  const DOWNLOAD_URL_EXPIRATION_SECONDS =
    15 * 60;
  
  const ALLOWED_IMAGE_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif'
  };
  
  /**
   * Confirms that a value can safely be used as a
   * MongoDB ObjectId.
   */
  function isValidObjectId(
    value
  ) {
    return mongoose.Types.ObjectId
      .isValid(value);
  }
  
  /**
   * Finds a journey only when it belongs to the
   * currently authenticated user.
   *
   * This prevents one traveler from uploading to,
   * completing media for, or viewing another
   * traveler's journey.
   */
  async function findOwnedJourney(
    journeyId,
    userId
  ) {
    if (!isValidObjectId(journeyId)) {
      return null;
    }
  
    return Journey.findOne({
      _id:
        journeyId,
  
      user:
        userId,
  
      status: {
        $ne: 'archived'
      }
    });
  }
  
  /**
   * Validates the information provided before an
   * S3 upload URL is generated.
   */
  function validateUploadRequest(
    body = {}
  ) {
    const fileName =
      typeof body.fileName === 'string'
        ? body.fileName.trim()
        : '';
  
    const mimeType =
      typeof body.mimeType === 'string'
        ? body.mimeType
            .trim()
            .toLowerCase()
        : '';
  
    const sizeBytes =
      Number(body.sizeBytes);
  
    const caption =
      typeof body.caption === 'string'
        ? body.caption.trim()
        : '';
  
    if (!fileName) {
      return {
        error:
          'A photo file name is required.'
      };
    }
  
    if (
      !Object.prototype.hasOwnProperty.call(
        ALLOWED_IMAGE_TYPES,
        mimeType
      )
    ) {
      return {
        error:
          'The selected photo type is not supported.'
      };
    }
  
    if (
      !Number.isInteger(sizeBytes) ||
      sizeBytes <= 0
    ) {
      return {
        error:
          'The selected photo is empty or invalid.'
      };
    }
  
    if (
      sizeBytes >
      MAX_PHOTO_SIZE
    ) {
      return {
        error:
          'Photos must be 15 MB or smaller.'
      };
    }
  
    if (caption.length > 500) {
      return {
        error:
          'Photo captions must be 500 characters or fewer.'
      };
    }
  
    let takenAt =
      null;
  
    if (body.takenAt) {
      takenAt =
        new Date(body.takenAt);
  
      if (
        Number.isNaN(
          takenAt.getTime()
        )
      ) {
        return {
          error:
            'The photo date is invalid.'
        };
      }
    }
  
    let coordinates =
      undefined;
  
    if (
      body.coordinates !== undefined &&
      body.coordinates !== null
    ) {
      const longitude =
        Number(
          body.coordinates.longitude
        );
  
      const latitude =
        Number(
          body.coordinates.latitude
        );
  
      if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180 ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        return {
          error:
            'The photo coordinates are invalid.'
        };
      }
  
      coordinates = {
        longitude,
        latitude
      };
    }
  
    return {
      value: {
        fileName,
        mimeType,
        sizeBytes,
        caption,
        takenAt,
        coordinates
      }
    };
  }
  
  /**
   * Builds the response sent to Angular.
   *
   * The S3 bucket remains private. Angular receives
   * only a short-lived signed download URL.
   */
  async function buildPhotoResponse(
    media
  ) {
    const {
      client,
      bucket
    } =
      getMediaStorage();
  
    const downloadUrl =
      await getSignedUrl(
        client,
  
        new GetObjectCommand({
          Bucket:
            bucket,
  
          Key:
            media.storageKey
        }),
  
        {
          expiresIn:
            DOWNLOAD_URL_EXPIRATION_SECONDS
        }
      );
  
    return {
      id:
        media._id.toString(),
  
      journeyId:
        media.journey.toString(),
  
      mediaType:
        media.mediaType,
  
      url:
        downloadUrl,
  
      originalFileName:
        media.originalFileName,
  
      mimeType:
        media.mimeType,
  
      sizeBytes:
        media.sizeBytes,
  
      caption:
        media.caption || '',
  
      takenAt:
        media.takenAt || null,
  
      coordinates:
        media.coordinates || null,
  
      isCover:
        Boolean(media.isCover),
  
      uploadedAt:
        media.uploadedAt || null,
  
      createdAt:
        media.createdAt
    };
  }
  
  /**
   * POST
   * /api/journeys/:journeyId/media/upload-url
   *
   * Creates a pending MongoDB media record and returns
   * a temporary URL that lets the browser upload the
   * photo directly into the private S3 bucket.
   */
  exports.createPhotoUploadUrl =
    async function createPhotoUploadUrl(
      req,
      res,
      next
    ) {
      let media;
  
      try {
        const {
          journeyId
        } =
          req.params;
  
        const journey =
          await findOwnedJourney(
            journeyId,
            req.user._id
          );
  
        if (!journey) {
          return res.status(404).json({
            message:
              'The journey was not found.'
          });
        }
  
        const validation =
          validateUploadRequest(
            req.body
          );
  
        if (validation.error) {
          return res.status(400).json({
            message:
              validation.error
          });
        }
  
        const {
          fileName,
          mimeType,
          sizeBytes,
          caption,
          takenAt,
          coordinates
        } =
          validation.value;
  
        const extension =
          ALLOWED_IMAGE_TYPES[
            mimeType
          ];
  
        /**
         * User and journey identifiers provide logical
         * separation inside the private bucket.
         *
         * The original filename is not used as part of
         * the storage key, preventing unsafe path values
         * and name collisions.
         */
        const storageKey =
          `users/${req.user._id.toString()}/` +
          `journeys/${journey._id.toString()}/` +
          `photos/${randomUUID()}.${extension}`;
  
        media =
          await JourneyMedia.create({
            user:
              req.user._id,
  
            journey:
              journey._id,
  
            mediaType:
              'photo',
  
            storageKey,
  
            originalFileName:
              fileName,
  
            mimeType,
  
            sizeBytes,
  
            caption,
  
            takenAt,
  
            coordinates,
  
            uploadStatus:
              'pending'
          });
  
        const {
          client,
          bucket
        } =
          getMediaStorage();
  
        const uploadUrl =
          await getSignedUrl(
            client,
  
            new PutObjectCommand({
              Bucket:
                bucket,
  
              Key:
                storageKey,
  
              ContentType:
                mimeType
            }),
  
            {
              expiresIn:
                UPLOAD_URL_EXPIRATION_SECONDS
            }
          );
  
        return res.status(201).json({
          mediaId:
            media._id.toString(),
  
          uploadUrl,
  
          method:
            'PUT',
  
          headers: {
            'Content-Type':
              mimeType
          },
  
          expiresInSeconds:
            UPLOAD_URL_EXPIRATION_SECONDS
        });
      } catch (error) {
        /**
         * Avoid leaving a pending database record if
         * generation of the S3 URL fails.
         */
        if (media?._id) {
          await JourneyMedia.deleteOne({
            _id:
              media._id,
  
            uploadStatus:
              'pending'
          }).catch(
            () => undefined
          );
        }
  
        return next(error);
      }
    };
  
  /**
   * POST
   * /api/journeys/:journeyId/media/:mediaId/complete
   *
   * Verifies that the uploaded S3 object exists and
   * matches the expected file information before
   * marking the MongoDB media record as ready.
   */
  exports.completePhotoUpload =
    async function completePhotoUpload(
      req,
      res,
      next
    ) {
      try {
        const {
          journeyId,
          mediaId
        } =
          req.params;
  
        if (
          !isValidObjectId(journeyId) ||
          !isValidObjectId(mediaId)
        ) {
          return res.status(400).json({
            message:
              'Valid journey and media IDs are required.'
          });
        }
  
        const journey =
          await findOwnedJourney(
            journeyId,
            req.user._id
          );
  
        if (!journey) {
          return res.status(404).json({
            message:
              'The journey was not found.'
          });
        }
  
        const media =
          await JourneyMedia.findOne({
            _id:
              mediaId,
  
            journey:
              journey._id,
  
            user:
              req.user._id
          });
  
        if (!media) {
          return res.status(404).json({
            message:
              'The uploaded photo was not found.'
          });
        }
  
        /**
         * Completion is idempotent. Repeating the
         * request does not increase photoCount twice.
         */
        if (
          media.uploadStatus ===
          'ready'
        ) {
          const photo =
            await buildPhotoResponse(
              media
            );
  
          return res.status(200).json({
            photo
          });
        }
  
        if (
          media.uploadStatus !==
          'pending'
        ) {
          return res.status(409).json({
            message:
              'This photo upload cannot be completed.'
          });
        }
  
        const {
          client,
          bucket
        } =
          getMediaStorage();
  
        let uploadedObject;
  
        try {
          uploadedObject =
            await client.send(
              new HeadObjectCommand({
                Bucket:
                  bucket,
  
                Key:
                  media.storageKey
              })
            );
        } catch (error) {
          return res.status(400).json({
            message:
              'The photo has not finished uploading.'
          });
        }
  
        const uploadedSize =
          Number(
            uploadedObject.ContentLength
          );
  
        const uploadedMimeType =
          (
            uploadedObject.ContentType ||
            ''
          ).toLowerCase();
  
        if (
          uploadedSize !==
            media.sizeBytes ||
          uploadedMimeType !==
            media.mimeType
        ) {
          /**
           * Remove an object that does not match the
           * file approved during upload initialization.
           */
          await client.send(
            new DeleteObjectCommand({
              Bucket:
                bucket,
  
              Key:
                media.storageKey
            })
          ).catch(
            () => undefined
          );
  
          media.uploadStatus =
            'failed';
  
          await media.save();
  
          return res.status(400).json({
            message:
              'The uploaded photo did not match the approved file.'
          });
        }
  
        const session =
          await mongoose.startSession();
  
        let completedMedia;
  
        try {
          await session.withTransaction(
            async () => {
              completedMedia =
                await JourneyMedia
                  .findOneAndUpdate(
                    {
                      _id:
                        media._id,
  
                      user:
                        req.user._id,
  
                      journey:
                        journey._id,
  
                      uploadStatus:
                        'pending'
                    },
  
                    {
                      $set: {
                        uploadStatus:
                          'ready',
  
                        uploadedAt:
                          new Date()
                      }
                    },
  
                    {
                      new: true,
                      session
                    }
                  );
  
              /**
               * Another request may already have completed
               * this photo. Only the request that changes
               * pending → ready increments the count.
               */
              if (!completedMedia) {
                completedMedia =
                  await JourneyMedia
                    .findOne({
                      _id:
                        media._id,
  
                      user:
                        req.user._id,
  
                      journey:
                        journey._id,
  
                      uploadStatus:
                        'ready'
                    })
                    .session(session);
  
                return;
              }
  
              await Journey.updateOne(
                {
                  _id:
                    journey._id,
  
                  user:
                    req.user._id
                },
  
                {
                  $inc: {
                    'universe.photoCount':
                      1
                  }
                },
  
                {
                  session
                }
              );
            }
          );
        } finally {
          await session.endSession();
        }
  
        if (!completedMedia) {
          return res.status(409).json({
            message:
              'The photo upload could not be completed.'
          });
        }
  
        const photo =
          await buildPhotoResponse(
            completedMedia
          );
  
        return res.status(200).json({
          photo
        });
      } catch (error) {
        return next(error);
      }
    };
  
  /**
   * GET
   * /api/journeys/:journeyId/media
   *
   * Lists only ready photos belonging to the signed-in
   * user's journey.
   */
  exports.listJourneyPhotos =
    async function listJourneyPhotos(
      req,
      res,
      next
    ) {
      try {
        const {
          journeyId
        } =
          req.params;
  
        const journey =
          await findOwnedJourney(
            journeyId,
            req.user._id
          );
  
        if (!journey) {
          return res.status(404).json({
            message:
              'The journey was not found.'
          });
        }
  
        const mediaRecords =
          await JourneyMedia.find({
            user:
              req.user._id,
  
            journey:
              journey._id,
  
            mediaType:
              'photo',
  
            uploadStatus:
              'ready'
          })
            .sort({
              isCover: -1,
              takenAt: -1,
              createdAt: -1
            });
  
        const photos =
          await Promise.all(
            mediaRecords.map(
              media =>
                buildPhotoResponse(
                  media
                )
            )
          );
  
        return res.status(200).json({
          photos
        });
      } catch (error) {
        return next(error);
      }
    };