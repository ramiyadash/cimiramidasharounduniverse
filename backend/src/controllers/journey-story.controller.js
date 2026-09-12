const mongoose =
  require('mongoose');

const Journey =
  require('../models/journey.model');

const JourneyMedia =
  require('../models/journey-media.model');

const JourneyStory =
  require('../models/journey-story.model');

function isValidObjectId(
  value
) {
  return mongoose.Types.ObjectId
    .isValid(value);
}

/**
 * Finds a journey only when it belongs to the
 * authenticated traveler.
 */
async function findOwnedJourney(
  journeyId,
  userId,
  session = null
) {
  if (!isValidObjectId(journeyId)) {
    return null;
  }

  const query =
    Journey.findOne({
      _id:
        journeyId,

      user:
        userId,

      status: {
        $ne: 'archived'
      }
    });

  if (session) {
    query.session(session);
  }

  return query;
}

function normalizeText(
  value
) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

/**
 * Allows convenient draft saving without forcing
 * every field to be completed immediately.
 */
function validateStoryRequest(
  body = {},
  journeyTitle
) {
  const providedTitle =
    normalizeText(
      body.title
    );

  const title =
    providedTitle ||
    `${journeyTitle} Story`;

  const introduction =
    normalizeText(
      body.introduction
    );

  const status =
    body.status ||
    'draft';

  if (title.length > 160) {
    return {
      error:
        'The story title must be 160 characters or fewer.'
    };
  }

  if (
    introduction.length >
    2000
  ) {
    return {
      error:
        'The story introduction must be 2,000 characters or fewer.'
    };
  }

  if (
    ![
      'draft',
      'completed'
    ].includes(status)
  ) {
    return {
      error:
        'The story status is invalid.'
    };
  }

  const coverMedia =
    body.coverMedia ||
    null;

  if (
    coverMedia &&
    !isValidObjectId(
      coverMedia
    )
  ) {
    return {
      error:
        'The selected cover photo is invalid.'
    };
  }

  if (
    body.sections !== undefined &&
    !Array.isArray(
      body.sections
    )
  ) {
    return {
      error:
        'Story sections must be an array.'
    };
  }

  const suppliedSections =
    Array.isArray(
      body.sections
    )
      ? body.sections
      : [];

  if (
    suppliedSections.length >
    100
  ) {
    return {
      error:
        'A story can contain up to 100 sections.'
    };
  }

  const sections = [];

  for (
    const suppliedSection
    of suppliedSections
  ) {
    const heading =
      normalizeText(
        suppliedSection?.heading
      );

    const narrative =
      normalizeText(
        suppliedSection?.narrative
      );

    if (
      heading.length >
      160
    ) {
      return {
        error:
          'Section headings must be 160 characters or fewer.'
      };
    }

    if (
      narrative.length >
      5000
    ) {
      return {
        error:
          'Section narratives must be 5,000 characters or fewer.'
      };
    }

    let date =
      null;

    if (suppliedSection?.date) {
      date =
        new Date(
          suppliedSection.date
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return {
          error:
            'A story section contains an invalid date.'
        };
      }
    }

    const media =
      suppliedSection?.media ===
        undefined
        ? []
        : suppliedSection.media;

    if (!Array.isArray(media)) {
      return {
        error:
          'Section media must be an array.'
      };
    }

    if (media.length > 100) {
      return {
        error:
          'A story section can contain up to 100 photos.'
      };
    }

    if (
      media.some(
        mediaId =>
          !isValidObjectId(
            mediaId
          )
      )
    ) {
      return {
        error:
          'A story section contains an invalid photo.'
      };
    }

    sections.push({
      heading,
      narrative,
      date,
      media
    });
  }

  /**
   * A photo should only appear once in the story.
   */
  const sectionMediaIds =
    sections.flatMap(
      section =>
        section.media.map(
          mediaId =>
            mediaId.toString()
        )
    );

  if (
    new Set(
      sectionMediaIds
    ).size !==
    sectionMediaIds.length
  ) {
    return {
      error:
        'A photo cannot appear in more than one story section.'
    };
  }

  return {
    value: {
      title,
      introduction,
      coverMedia,
      sections,
      status
    }
  };
}

/**
 * Confirms every referenced photo is ready and belongs
 * to this user and journey.
 */
async function validateOwnedMedia(
  {
    coverMedia,
    sections
  },
  journeyId,
  userId
) {
  const mediaIds =
    [
      coverMedia,

      ...sections.flatMap(
        section =>
          section.media
      )
    ]
      .filter(Boolean)
      .map(
        mediaId =>
          mediaId.toString()
      );

  const uniqueMediaIds =
    [
      ...new Set(
        mediaIds
      )
    ];

  if (!uniqueMediaIds.length) {
    return null;
  }

  const ownedMediaCount =
    await JourneyMedia.countDocuments({
      _id: {
        $in:
          uniqueMediaIds
      },

      user:
        userId,

      journey:
        journeyId,

      mediaType:
        'photo',

      uploadStatus:
        'ready'
    });

  if (
    ownedMediaCount !==
    uniqueMediaIds.length
  ) {
    return (
      'One or more selected photos are unavailable ' +
      'or do not belong to this journey.'
    );
  }

  return null;
}

function buildStoryResponse(
  story
) {
  return {
    id:
      story._id.toString(),

    journeyId:
      story.journey.toString(),

    title:
      story.title,

    introduction:
      story.introduction || '',

    coverMediaId:
      story.coverMedia
        ? story.coverMedia.toString()
        : null,

    sections:
      story.sections.map(
        section => ({
          id:
            section._id.toString(),

          heading:
            section.heading || '',

          date:
            section.date || null,

          narrative:
            section.narrative || '',

          mediaIds:
            section.media.map(
              mediaId =>
                mediaId.toString()
            )
        })
      ),

    status:
      story.status,

    visibility:
      story.visibility,

    createdAt:
      story.createdAt,

    updatedAt:
      story.updatedAt
  };
}

/**
 * GET /api/journeys/:journeyId/story
 *
 * Returns the authenticated user's story, or null
 * when the journey does not have a story yet.
 */
exports.getJourneyStory =
  async function getJourneyStory(
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

      const story =
        await JourneyStory.findOne({
          user:
            req.user._id,

          journey:
            journey._id
        });

      return res.status(200).json({
        story:
          story
            ? buildStoryResponse(
                story
              )
            : null
      });
    } catch (error) {
      return next(error);
    }
  };

/**
 * PUT /api/journeys/:journeyId/story
 *
 * Creates or replaces the authenticated user's
 * private story draft for this journey.
 */
exports.saveJourneyStory =
  async function saveJourneyStory(
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

      const validation =
        validateStoryRequest(
          req.body,
          journey.title
        );

      if (validation.error) {
        return res.status(400).json({
          message:
            validation.error
        });
      }

      const mediaError =
        await validateOwnedMedia(
          validation.value,
          journey._id,
          req.user._id
        );

      if (mediaError) {
        return res.status(400).json({
          message:
            mediaError
        });
      }

      const session =
        await mongoose.startSession();

      let story;

      try {
        await session.withTransaction(
          async () => {
            story =
              await JourneyStory.findOne({
                user:
                  req.user._id,

                journey:
                  journey._id
              }).session(session);

            if (story) {
              story.title =
                validation.value.title;

              story.introduction =
                validation.value
                  .introduction;

              story.coverMedia =
                validation.value
                  .coverMedia;

              story.sections =
                validation.value
                  .sections;

              story.status =
                validation.value.status;

              /**
               * Public visibility cannot be supplied
               * by the browser in this milestone.
               */
              story.visibility =
                'private';

              await story.save({
                session
              });
            } else {
              const createdStories =
                await JourneyStory.create(
                  [
                    {
                      user:
                        req.user._id,

                      journey:
                        journey._id,

                      title:
                        validation.value
                          .title,

                      introduction:
                        validation.value
                          .introduction,

                      coverMedia:
                        validation.value
                          .coverMedia,

                      sections:
                        validation.value
                          .sections,

                      status:
                        validation.value
                          .status,

                      visibility:
                        'private'
                    }
                  ],
                  {
                    session
                  }
                );

              story =
                createdStories[0];
            }

            /**
             * This version has one story per journey,
             * so the denormalized map count is either
             * zero or one.
             */
            await Journey.updateOne(
              {
                _id:
                  journey._id,

                user:
                  req.user._id
              },

              {
                $set: {
                  'universe.storyCount':
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

      return res.status(200).json({
        story:
          buildStoryResponse(
            story
          )
      });
    } catch (error) {
      return next(error);
    }
  };

/**
 * DELETE /api/journeys/:journeyId/story
 *
 * Deletes the story but preserves its journey photos.
 */
exports.deleteJourneyStory =
  async function deleteJourneyStory(
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

      const session =
        await mongoose.startSession();

      let deletedStory;

      try {
        await session.withTransaction(
          async () => {
            deletedStory =
              await JourneyStory
                .findOneAndDelete({
                  user:
                    req.user._id,

                  journey:
                    journey._id
                })
                .session(session);

            await Journey.updateOne(
              {
                _id:
                  journey._id,

                user:
                  req.user._id
              },

              {
                $set: {
                  'universe.storyCount':
                    0
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

      if (!deletedStory) {
        return res.status(404).json({
          message:
            'This journey does not have a story.'
        });
      }

      return res.status(200).json({
        message:
          'The journey story was deleted.'
      });
    } catch (error) {
      return next(error);
    }
  };