const conversations =
  new Map();

const MAX_CONVERSATIONS =
  1000;

const MAX_STORED_MESSAGES =
  40;

function normalizeIdentifier(
  value,
  fieldName
) {
  const normalizedValue =
    typeof value === 'string'
      ? value.trim()
      : value?.toString()
        .trim();

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} is required.`
    );
  }

  if (
    normalizedValue.length >
    120
  ) {
    throw new Error(
      `${fieldName} is too long.`
    );
  }

  return normalizedValue;
}

/**
 * Creates an internal key that cannot overlap with
 * another authenticated traveler.
 */
function buildConversationKey(
  userId,
  conversationId
) {
  const normalizedUserId =
    normalizeIdentifier(
      userId,
      'User ID'
    );

  const normalizedConversationId =
    normalizeIdentifier(
      conversationId,
      'Conversation ID'
    );

  return (
    `${normalizedUserId}:` +
    `${normalizedConversationId}`
  );
}

function removeOldestConversation() {
  const oldestKey =
    conversations.keys()
      .next()
      .value;

  if (oldestKey) {
    conversations.delete(
      oldestKey
    );
  }
}

exports.getConversation =
  function getConversation(
    userId,
    conversationId
  ) {
    const conversationKey =
      buildConversationKey(
        userId,
        conversationId
      );

    if (
      !conversations.has(
        conversationKey
      )
    ) {
      if (
        conversations.size >=
        MAX_CONVERSATIONS
      ) {
        removeOldestConversation();
      }

      conversations.set(
        conversationKey,
        []
      );
    }

    return conversations.get(
      conversationKey
    );
  };

exports.addMessage =
  function addMessage(
    userId,
    conversationId,
    role,
    content
  ) {
    const conversation =
      exports.getConversation(
        userId,
        conversationId
      );

    conversation.push({
      role,
      content,
      createdAt:
        new Date()
    });

    /**
     * Prevent one long-running chat from consuming
     * memory indefinitely.
     */
    if (
      conversation.length >
      MAX_STORED_MESSAGES
    ) {
      conversation.splice(
        0,
        conversation.length -
          MAX_STORED_MESSAGES
      );
    }

    return conversation;
  };

exports.getRecentMessages =
  function getRecentMessages(
    userId,
    conversationId,
    limit = 8
  ) {
    const conversation =
      exports.getConversation(
        userId,
        conversationId
      );

    return conversation.slice(
      -limit
    );
  };