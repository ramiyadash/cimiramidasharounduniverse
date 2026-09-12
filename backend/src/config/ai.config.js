function parsePositiveInteger(
    value,
    fallback
  ) {
    const parsedValue =
      Number.parseInt(
        value,
        10
      );

    return Number.isInteger(
      parsedValue
    ) &&
      parsedValue > 0
      ? parsedValue
      : fallback;
  }

  function parseBoolean(
    value,
    fallback = false
  ) {
    if (
      typeof value !==
      'string'
    ) {
      return fallback;
    }

    return (
      value.trim()
        .toLowerCase() ===
      'true'
    );
  }

  module.exports = {
    DEFAULT_PROVIDER:
      process.env
        .AI_PROVIDER_DEFAULT ||
      'ollama',

    TRAVEL_PLANNING_PROVIDER:
      process.env
        .AI_PROVIDER_TRAVEL_PLANNING ||
      process.env
        .AI_PROVIDER_DEFAULT ||
      'ollama',

    STORY_DRAFT_PROVIDER:
      process.env
        .AI_PROVIDER_STORY_DRAFT ||
      process.env
        .AI_PROVIDER_DEFAULT ||
      'ollama',

    FALLBACK_PROVIDER:
      process.env
        .AI_FALLBACK_PROVIDER ||
      null,

    /**
     * This must remain false unless we intentionally
     * approve local content being sent externally when
     * Ollama is unavailable.
     */
    ALLOW_EXTERNAL_FALLBACK:
      parseBoolean(
        process.env
          .AI_ALLOW_EXTERNAL_FALLBACK,
        false
      ),

    REQUEST_TIMEOUT_MS:
      parsePositiveInteger(
        process.env
          .AI_REQUEST_TIMEOUT_MS,
        90000
      ),

    OPENAI_API_KEY:
      process.env
        .OPENAI_API_KEY ||
      '',

    OPENAI_MODEL:
      process.env
        .OPENAI_MODEL ||
      '',

    OPENAI_MAX_OUTPUT_TOKENS:
      parsePositiveInteger(
        process.env
          .OPENAI_MAX_OUTPUT_TOKENS,
        1200
      )
  };