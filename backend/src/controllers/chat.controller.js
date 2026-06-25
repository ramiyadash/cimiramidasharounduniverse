const travelAiService = require("../services/travel-ai.service");

exports.sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const reply = await travelAiService.generateTravelResponse(message);

    res.json({ reply });
  } catch (error) {
    next(error);
  }
};