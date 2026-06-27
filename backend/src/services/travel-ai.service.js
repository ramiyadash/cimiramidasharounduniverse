const ollamaService = require("./ai/ollama.service");
const conversationService = require("./conversation/conversation.service");
const { buildTravelPrompt } = require("../prompts/travel.prompt");

exports.generateTravelResponse = async ({ conversationId, message }) => {
    conversationService.addMessage(conversationId, "user", message);
  
    const recentMessages = conversationService.getRecentMessages(conversationId);
  
    const prompt = buildTravelPrompt(recentMessages);
  
    const reply = await ollamaService.generate(prompt);
  
    conversationService.addMessage(conversationId, "assistant", reply);
  
    return reply;
  };