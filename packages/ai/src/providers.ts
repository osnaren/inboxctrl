import type { AiProviderDescriptor } from './types';

/**
 * Registry of known AI provider descriptors.
 *
 * The registry is intentionally a plain map so Pro plugins or future community
 * providers can register themselves without modifying this file.
 */
const providerRegistry = new Map<string, AiProviderDescriptor>();

// ---------------------------------------------------------------------------
// Built-in providers
// ---------------------------------------------------------------------------

const OPENAI_DESCRIPTOR: AiProviderDescriptor = {
  id: 'openai',
  name: 'OpenAI',
  bringYourOwnKey: true,
  defaultModel: 'gpt-4o-mini',
  models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
};

const ANTHROPIC_DESCRIPTOR: AiProviderDescriptor = {
  id: 'anthropic',
  name: 'Anthropic',
  bringYourOwnKey: true,
  defaultModel: 'claude-sonnet-4-20250514',
  models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
};

const GEMINI_DESCRIPTOR: AiProviderDescriptor = {
  id: 'gemini',
  name: 'Google Gemini',
  bringYourOwnKey: true,
  defaultModel: 'gemini-2.5-flash',
  models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
};

const GROQ_DESCRIPTOR: AiProviderDescriptor = {
  id: 'groq',
  name: 'Groq',
  bringYourOwnKey: true,
  defaultModel: 'llama-3.1-70b-versatile',
  models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
};

// Seed built-in providers
for (const descriptor of [OPENAI_DESCRIPTOR, ANTHROPIC_DESCRIPTOR, GEMINI_DESCRIPTOR, GROQ_DESCRIPTOR]) {
  providerRegistry.set(descriptor.id, descriptor);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getProviderDescriptor(providerId: string): AiProviderDescriptor | undefined {
  return providerRegistry.get(providerId);
}

export function getAllProviderDescriptors(): AiProviderDescriptor[] {
  return [...providerRegistry.values()];
}

export function registerProvider(descriptor: AiProviderDescriptor): void {
  providerRegistry.set(descriptor.id, descriptor);
}
