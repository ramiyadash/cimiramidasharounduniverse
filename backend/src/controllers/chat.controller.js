const travelAiService =
  require('../services/travel-ai.service');

exports.sendMessage = async function (
  req,
  res,
  next
) {
  try {
    const {
      message,
      conversationId = 'default'
    } = req.body;

    if (
      typeof message !== 'string' ||
      !message.trim()
    ) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    const reply =
      await travelAiService.generateTravelResponse({
        conversationId,
        message: message.trim()
      });

    return res.json({
      conversationId,
      reply
    });
  } catch (error) {
    return next(error);
  }
};