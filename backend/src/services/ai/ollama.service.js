const {
  OLLAMA_BASE_URL,
  OLLAMA_MODEL
} =
  require(
    '../../config/ollama.config'
  );

const {
  REQUEST_TIMEOUT_MS
} =
  require(
    '../../config/ai.config'
  );

/**
 * Generates text through the locally running
 * Ollama service.
 */
exports.generate =
  async function generate({
    prompt,
    model =
      OLLAMA_MODEL,
    temperature = 0.7
  }) {
    if (
      typeof prompt !== 'string' ||
      !prompt.trim()
    ) {
      throw new Error(
        'An AI prompt is required.'
      );
    }

    const abortController =
      new AbortController();

    const timeout =
      setTimeout(
        () => {
          abortController.abort();
        },
        REQUEST_TIMEOUT_MS
      );

    try {
      const response =
        await fetch(
          `${OLLAMA_BASE_URL}/api/generate`,
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                model,

                prompt:
                  prompt.trim(),

                stream:
                  false,

                options: {
                  temperature
                }
              }),

            signal:
              abortController.signal
          }
        );

      if (!response.ok) {
        throw new Error(
          `Ollama request failed with status ${response.status}.`
        );
      }

      const data =
        await response.json();

      const text =
        typeof data.response ===
          'string'
          ? data.response.trim()
          : '';

      if (!text) {
        throw new Error(
          'Ollama returned an empty response.'
        );
      }

      return {
        text,

        provider:
          'ollama',

        model:
          data.model ||
          model
      };
    } catch (error) {
      if (
        error.name ===
        'AbortError'
      ) {
        throw new Error(
          'Ollama took too long to respond.'
        );
      }

      throw error;
    } finally {
      clearTimeout(
        timeout
      );
    }
  };