import { openai } from '@ai-sdk/openai';
import { generateText, generateObject, type LanguageModel } from 'ai';

import { PROMPT_TEMPLATES } from './prompts';
import { filterDraftSchema, labelSuggestionSchema, taskExtractionSchema } from './schemas';

import type {
  AiProviderConfig,
  AiServiceOptions,
  FilterDraftResult,
  LabelSuggestionResult,
  TaskExtractionResult,
  TriageEmailInput,
} from './types';

/**
 * Stateless AI service that encapsulates prompt execution.
 *
 * The service is intentionally framework-agnostic - it receives an AI model
 * and executes prompts.  Session/request orchestration remains in the app
 * layer.
 *
 * ## Privacy guardrails
 *
 * - Full email bodies are never fetched by this service; callers must supply
 *   the text body explicitly.
 * - All outputs are transient by default and should not be persisted unless
 *   the user explicitly saves or applies a suggestion.
 */
export class AiService {
  private model: LanguageModel;

  constructor(options: AiServiceOptions = {}) {
    this.model = AiService.resolveModel(options.config);
  }

  /**
   * Resolve a language model from the provider config.
   * Defaults to OpenAI `gpt-4o-mini` when no config is given.
   */
  private static resolveModel(config?: AiProviderConfig): LanguageModel {
    // Currently only OpenAI is wired up; the architecture supports adding
    // Anthropic / Gemini / Groq / local providers via additional @ai-sdk/*
    // packages without changing this service.
    const modelId = config?.model ?? 'gpt-4o-mini';
    return openai(modelId);
  }

  // -----------------------------------------------------------------------
  // Summarization
  // -----------------------------------------------------------------------

  async summarizeEmail(textBody: string): Promise<string> {
    const { text } = await generateText({
      model: this.model,
      system: PROMPT_TEMPLATES.summarize.systemPrompt,
      prompt: `Email Content:\n\n${textBody}`,
    });
    return text;
  }

  // -----------------------------------------------------------------------
  // Smart reply
  // -----------------------------------------------------------------------

  async suggestReply(textBody: string, userContext?: string): Promise<string> {
    const { text } = await generateText({
      model: this.model,
      system: PROMPT_TEMPLATES['smart-reply'].systemPrompt,
      prompt: `Original Email:\n\n${textBody}\n\nAdditional Context from User: ${userContext || 'None'}`,
    });
    return text;
  }

  // -----------------------------------------------------------------------
  // Task extraction
  // -----------------------------------------------------------------------

  async extractTasks(textBody: string): Promise<TaskExtractionResult> {
    const { object } = await generateObject({
      model: this.model,
      system: PROMPT_TEMPLATES['extract-tasks'].systemPrompt,
      prompt: `Email Content:\n\n${textBody}`,
      schema: taskExtractionSchema,
    });
    return object;
  }

  // -----------------------------------------------------------------------
  // Triage / label suggestions
  // -----------------------------------------------------------------------

  async triageEmails(emails: TriageEmailInput[], validLabelNames: string[]): Promise<LabelSuggestionResult[]> {
    const labelsHint = validLabelNames.length > 0 ? validLabelNames.join(', ') : 'No custom labels available.';

    const systemPrompt = `${PROMPT_TEMPLATES['label-suggestions'].systemPrompt}\n\nAvailable Labels to apply: ${labelsHint}.\nIf no label fits perfectly, use "None".`;

    const { object } = await generateObject({
      model: this.model,
      system: systemPrompt,
      prompt: `Please triage these emails:\n\n${JSON.stringify(emails, null, 2)}`,
      schema: labelSuggestionSchema,
    });

    return object.suggestions;
  }

  // -----------------------------------------------------------------------
  // Natural-language to filter draft
  // -----------------------------------------------------------------------

  async naturalLanguageToFilter(nlPrompt: string, validLabelNames: string[]): Promise<FilterDraftResult> {
    const labelsHint = validLabelNames.length > 0 ? validLabelNames.join(', ') : 'No custom labels available.';

    const systemPrompt = `${PROMPT_TEMPLATES['filter-draft'].systemPrompt}\n\nAvailable Labels: ${labelsHint}.`;

    const { object } = await generateObject({
      model: this.model,
      system: systemPrompt,
      prompt: `User request: "${nlPrompt}"`,
      schema: filterDraftSchema,
    });

    return object;
  }
}
