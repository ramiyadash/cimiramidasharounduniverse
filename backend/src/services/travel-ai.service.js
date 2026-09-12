const aiRouter =
  require(
    './ai/ai-router.service'
  );

const conversationService =
  require(
    './conversation/conversation.service'
  );

const {
  buildTravelPrompt
} =
  require(
    '../prompts/travel.prompt'
  );

exports.generateTravelResponse =
  async function generateTravelResponse({
    userId,
    conversationId,
    message
  }) {
    conversationService
      .addMessage(
        userId,
        conversationId,
        'user',
        message
      );

    const recentMessages =
      conversationService
        .getRecentMessages(
          userId,
          conversationId
        );

    const prompt =
      buildTravelPrompt(
        recentMessages
      );

    const result =
      await aiRouter.generate({
        task:
          aiRouter
            .AI_TASKS
            .TRAVEL_PLANNING,

        prompt,

        temperature:
          0.7
      });

    conversationService
      .addMessage(
        userId,
        conversationId,
        'assistant',
        result.text
      );

    return result;
  };