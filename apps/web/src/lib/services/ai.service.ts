/**
 * App-layer AI service - re-exports the package service with app defaults.
 *
 * This file exists so existing app imports of `@/lib/services/ai.service`
 * continue to work while the domain logic now lives in @inboxctrl/ai.
 */
export { AiService as AIService } from '@inboxctrl/ai';
