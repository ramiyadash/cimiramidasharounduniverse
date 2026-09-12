const travelAiService =
  require(
    '../services/travel-ai.service'
  );

exports.sendMessage =
  async function sendMessage(
    req,
    res,
    next
  ) {
    try {
      const {
        message,
        conversationId =
          'default'
      } =
        req.body;

      if (
        typeof message !==
          'string' ||
        !message.trim()
      ) {
        return res
          .status(400)
          .json({
            message:
              'A message is required.'
          });
      }

      if (
        typeof conversationId !==
          'string' ||
        !conversationId.trim() ||
        conversationId
          .trim()
          .length > 120
      ) {
        return res
          .status(400)
          .json({
            message:
              'The conversation ID is invalid.'
          });
      }

      const result =
        await travelAiService
          .generateTravelResponse({
            userId:
              req.user._id
                .toString(),

            conversationId:
              conversationId
                .trim(),

            message:
              message.trim()
          });

      return res
        .status(200)
        .json({
          conversationId:
            conversationId
              .trim(),

          reply:
            result.text,

          ai: {
            provider:
              result.provider,

            model:
              result.model,

            usedFallback:
              result.usedFallback
          }
        });
    } catch (error) {
      return next(error);
    }
  };