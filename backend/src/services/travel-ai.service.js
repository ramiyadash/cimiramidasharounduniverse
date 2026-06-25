const ollamaService = require("./ollama.service");
const { buildTravelPrompt } = require("../prompts/travel.prompt");

exports.generateTravelResponse = async (message) => {
  const prompt = buildTravelPrompt(message);
  return ollamaService.generate(prompt);
};