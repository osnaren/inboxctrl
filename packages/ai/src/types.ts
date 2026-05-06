import type { LanguageModel } from 'ai';

// ---------------------------------------------------------------------------
// Provider interfaces
// ---------------------------------------------------------------------------

/** Supported AI provider identifiers. Extensible via string union. */
export type AiProviderId = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'local' | (string & {});

/**
 * Descriptor for an AI provider that can be configured by the user.
 */
export interface AiProviderDescriptor {
  id: AiProviderId;
  name: string;
  bringYourOwnKey: boolean;
  /** Default model for this provider (e.g. 'gpt-4o-mini'). */
  defaultModel: string;
  /** Available model options. */
  models: string[];
}

/**
 * User-level AI configuration persisted in settings.
 */
export interface AiProviderConfig {
  providerId: AiProviderId;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * A resolved, ready-to-use AI provider.
 */
export interface ResolvedAiProvider {
  descriptor: AiProviderDescriptor;
  model: LanguageModel;
}

// ---------------------------------------------------------------------------
// Prompt identifiers
// ---------------------------------------------------------------------------

export type PromptId =
  | 'summarize'
  | 'smart-reply'
  | 'extract-tasks'
  | 'label-suggestions'
  | 'filter-draft'
  | (string & {});

/**
 * A registered prompt template.
 */
export interface PromptTemplate {
  id: PromptId;
  name: string;
  systemPrompt: string;
  /** Whether AI output is transient by default (privacy guardrail). */
  transientOutput: boolean;
}

// ---------------------------------------------------------------------------
// Structured output types
// ---------------------------------------------------------------------------

export interface LabelSuggestionResult {
  messageId: string;
  suggestedLabel: string;
  confidence: number;
  action: 'Archive' | 'Delete' | 'Keep in Inbox';
  reasoning: string;
}

export interface FilterDraftResult {
  criteria: {
    from?: string;
    to?: string;
    subject?: string;
    query?: string;
  };
  action: {
    addLabelIds?: string[];
    removeLabelIds?: string[];
    forward?: string;
  };
}

export interface TaskExtractionResult {
  tasks: string[];
}

// ---------------------------------------------------------------------------
// Service options
// ---------------------------------------------------------------------------

export interface TriageEmailInput {
  id: string;
  from: string;
  subject: string;
  snippet: string | null;
}

export interface AiServiceOptions {
  config?: AiProviderConfig;
}
