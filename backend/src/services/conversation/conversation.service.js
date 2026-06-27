const conversations = new Map();

exports.getConversation = (conversationId) => {
  if (!conversations.has(conversationId)) {
    conversations.set(conversationId, []);
  }

  return conversations.get(conversationId);
};

exports.addMessage = (conversationId, role, content) => {
  const conversation = exports.getConversation(conversationId);

  conversation.push({
    role,
    content,
    createdAt: new Date()
  });

  return conversation;
};

exports.getRecentMessages = (conversationId, limit = 8) => {
  const conversation = exports.getConversation(conversationId);
  return conversation.slice(-limit);
};