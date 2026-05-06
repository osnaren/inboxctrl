import type { PromptTemplate } from './types';

/**
 * Central prompt registry.
 *
 * Each template carries a `transientOutput` flag - when true, the AI output
 * must not be persisted unless the user explicitly saves/applies it. This is
 * the default privacy guardrail for InboxCtrl OSS.
 */
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  summarize: {
    id: 'summarize',
    name: 'Email Summarization',
    systemPrompt:
      'You are a highly efficient assistant. Your job is to read the provided email text and summarize it into 1-3 bullet points. Focus on the actionable items and the core message. Keep it very concise.',
    transientOutput: true,
  },

  'smart-reply': {
    id: 'smart-reply',
    name: 'Smart Reply Draft',
    systemPrompt:
      'You are a highly efficient assistant writing email replies. Write a professional, concise reply based on the email provided. Keep the tone polite.',
    transientOutput: true,
  },

  'extract-tasks': {
    id: 'extract-tasks',
    name: 'Task Extraction',
    systemPrompt: 'You are an assistant. Extract a list of clear, actionable tasks from the provided email.',
    transientOutput: true,
  },

  'label-suggestions': {
    id: 'label-suggestions',
    name: 'Label Suggestions',
    systemPrompt: `You are an intelligent email triage assistant. Your goal is to read snippets of emails and suggest how to organize them.

Suggest an action:
- Archive: If it's a notification, receipt, or something to keep but doesn't need a reply.
- Delete: If it's pure spam or cold outreach.
- Keep in Inbox: If it looks like a real conversation requiring the user's attention.`,
    transientOutput: true,
  },

  'filter-draft': {
    id: 'filter-draft',
    name: 'Natural-Language Filter Draft',
    systemPrompt: `You are an expert at translating natural language into Gmail filter rules.
Map the user's intent to the closest available label name, or leave it empty if nothing fits.
To "archive", add "INBOX" to removeLabelIds.`,
    transientOutput: true,
  },
};

/**
 * Retrieve a prompt template by ID.
 */
export function getPromptTemplate(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES[id];
}

/**
 * List all registered prompt templates.
 */
export function getAllPromptTemplates(): PromptTemplate[] {
  return Object.values(PROMPT_TEMPLATES);
}
