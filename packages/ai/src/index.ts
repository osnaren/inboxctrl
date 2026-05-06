// Service
export { AiService } from './service';

// Provider registry
export { getProviderDescriptor, getAllProviderDescriptors, registerProvider } from './providers';

// Prompt registry
export { PROMPT_TEMPLATES, getPromptTemplate, getAllPromptTemplates } from './prompts';

// Schemas
export { labelSuggestionSchema, taskExtractionSchema, filterDraftSchema } from './schemas';
export type { LabelSuggestionOutput, TaskExtractionOutput, FilterDraftOutput } from './schemas';

// Types
export type {
  AiProviderId,
  AiProviderConfig,
  AiProviderDescriptor,
  AiServiceOptions,
  FilterDraftResult,
  LabelSuggestionResult,
  PromptId,
  PromptTemplate,
  ResolvedAiProvider,
  TaskExtractionResult,
  TriageEmailInput,
} from './types';
