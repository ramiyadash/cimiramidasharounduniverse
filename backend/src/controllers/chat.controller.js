const travelAiService = require("../services/travel-ai.service");

exports.sendMessage = async (req, res, next) => {
  try {
    const { message, conversationId = "default" } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const reply = await travelAiService.generateTravelResponse({
        conversationId,
        message
      });
  
      res.json({
        conversationId,
        reply
      });
    }catch (error) {
    next(error);
  }
};