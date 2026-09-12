const OpenAI =
  require('openai');

const {
  OPENAI_API_KEY,
  OPENAI_MODEL,
  OPENAI_MAX_OUTPUT_TOKENS,
  REQUEST_TIMEOUT_MS
} =
  require(
    '../../config/ai.config'
  );

let openaiClient;

/**
 * Initializes the client only when OpenAI is selected.
 *
 * This allows local Ollama development to continue
 * without requiring an OpenAI API key.
 */
function getOpenAIClient() {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is not configured.'
    );
  }

  if (!openaiClient) {
    openaiClient =
      new OpenAI({
        apiKey:
          OPENAI_API_KEY,

        timeout:
          REQUEST_TIMEOUT_MS
      });
  }

  return openaiClient;
}

exports.generate =
  async function generate({
    prompt,
    model =
      OPENAI_MODEL
  }) {
    if (
      typeof prompt !== 'string' ||
      !prompt.trim()
    ) {
      throw new Error(
        'An AI prompt is required.'
      );
    }

    if (!model) {
      throw new Error(
        'OPENAI_MODEL is not configured.'
      );
    }

    const client =
      getOpenAIClient();

    const response =
      await client.responses.create({
        model,

        input:
          prompt.trim(),

        max_output_tokens:
          OPENAI_MAX_OUTPUT_TOKENS,

        /**
         * We do not need to retrieve this response
         * from OpenAI after this request.
         */
        store:
          false
      });

    const text =
      typeof response.output_text ===
        'string'
        ? response.output_text
            .trim()
        : '';

    if (!text) {
      throw new Error(
        'OpenAI returned an empty response.'
      );
    }

    return {
      text,

      provider:
        'openai',

      model
    };
  };