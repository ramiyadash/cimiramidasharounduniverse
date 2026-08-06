const ollamaService =
  require("./ai/ollama.service");

const conversationService =
  require(
    "./conversation/conversation.service"
  );

const {
  buildTravelPrompt
} = require("../prompts/travel.prompt");

exports.generateTravelResponse =
  async function ({
    conversationId,
    message
  }) {
    // Store the latest traveler message.
    conversationService.addMessage(
      conversationId,
      "user",
      message
    );

    // Retrieve recent conversation history so Dash
    // can respond with context instead of treating
    // every message as a new conversation.
    const recentMessages =
      conversationService.getRecentMessages(
        conversationId
      );

    // Convert the conversation history into the
    // prompt sent to the local AI model.
    const prompt =
      buildTravelPrompt(
        recentMessages
      );

    // Ask Ollama to generate Dash's response.
    const reply =
      await ollamaService.generate(
        prompt
      );

    // Store Dash's response so it becomes part of
    // the context for the next message.
    conversationService.addMessage(
      conversationId,
      "assistant",
      reply
    );

    return reply;
  };