const ollamaProvider =
  require(
    './ollama.service'
  );

const openAiProvider =
  require(
    './openai.service'
  );

const {
  DEFAULT_PROVIDER,
  TRAVEL_PLANNING_PROVIDER,
  STORY_DRAFT_PROVIDER,
  FALLBACK_PROVIDER,
  ALLOW_EXTERNAL_FALLBACK
} =
  require(
    '../../config/ai.config'
  );

const AI_TASKS = {
  TRAVEL_PLANNING:
    'travel-planning',

  STORY_DRAFT:
    'story-draft'
};

const providers = {
  ollama:
    ollamaProvider,

  openai:
    openAiProvider
};

function getConfiguredProvider(
  task
) {
  switch (task) {
    case AI_TASKS
      .TRAVEL_PLANNING:
      return (
        TRAVEL_PLANNING_PROVIDER
      );

    case AI_TASKS
      .STORY_DRAFT:
      return (
        STORY_DRAFT_PROVIDER
      );

    default:
      return DEFAULT_PROVIDER;
  }
}

function getProvider(
  providerName
) {
  const provider =
    providers[
      providerName
    ];

  if (!provider) {
    throw new Error(
      `Unsupported AI provider: ${providerName}.`
    );
  }

  return provider;
}

function isExternalProvider(
  providerName
) {
  return (
    providerName ===
    'openai'
  );
}

/**
 * Runs one AI task using its configured provider.
 *
 * Prompt contents are deliberately excluded from
 * error logs.
 */
exports.generate =
  async function generate({
    task,
    prompt,
    temperature
  }) {
    const primaryProviderName =
      getConfiguredProvider(
        task
      );

    const primaryProvider =
      getProvider(
        primaryProviderName
      );

    try {
      const result =
        await primaryProvider
          .generate({
            prompt,
            temperature
          });

      return {
        ...result,

        task,

        usedFallback:
          false
      };
    } catch (primaryError) {
      console.error(
        `AI provider "${primaryProviderName}" failed for task "${task}":`,
        primaryError.message
      );

      if (
        !FALLBACK_PROVIDER ||
        FALLBACK_PROVIDER ===
          primaryProviderName
      ) {
        throw primaryError;
      }

      /**
       * Never move content from a local provider to
       * an external provider unless this privacy
       * escalation has been explicitly enabled.
       */
      if (
        !isExternalProvider(
          primaryProviderName
        ) &&
        isExternalProvider(
          FALLBACK_PROVIDER
        ) &&
        !ALLOW_EXTERNAL_FALLBACK
      ) {
        throw new Error(
          'The local AI provider is unavailable. External fallback is disabled for privacy.'
        );
      }

      const fallbackProvider =
        getProvider(
          FALLBACK_PROVIDER
        );

      try {
        const result =
          await fallbackProvider
            .generate({
              prompt,
              temperature
            });

        return {
          ...result,

          task,

          usedFallback:
            true
        };
      } catch (fallbackError) {
        console.error(
          `AI fallback provider "${FALLBACK_PROVIDER}" failed for task "${task}":`,
          fallbackError.message
        );

        throw fallbackError;
      }
    }
  };

exports.AI_TASKS =
  AI_TASKS;