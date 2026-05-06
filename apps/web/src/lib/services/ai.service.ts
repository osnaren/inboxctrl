import { openai } from '@ai-sdk/openai';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

export class AIService {
  private model;

  constructor(_provider: 'openai' | 'anthropic' = 'openai') {
    this.model = openai('gpt-4o-mini');
  }

  async summarizeEmail(textBody: string): Promise<string> {
    const { text } = await generateText({
      model: this.model,
      system:
        'You are a highly efficient assistant. Your job is to read the provided email text and summarize it into 1-3 bullet points. Focus on the actionable items and the core message. Keep it very concise.',
      prompt: `Email Content:\n\n${textBody}`,
    });
    return text;
  }

  async suggestReply(textBody: string, contextContext?: string): Promise<string> {
    const { text } = await generateText({
      model: this.model,
      system:
        'You are a highly efficient assistant writing email replies. Write a professional, concise reply based on the email provided. Keep the tone polite.',
      prompt: `Original Email:\n\n${textBody}\n\nAdditional Context from User: ${contextContext || 'None'}`,
    });
    return text;
  }

  async extractTasks(textBody: string): Promise<string[]> {
    const schema = z.object({
      tasks: z.array(z.string()).describe('List of actionable tasks extracted from the email.'),
    });

    const { object } = await generateObject({
      model: this.model,
      system: 'You are an assistant. Extract a list of clear, actionable tasks from the provided email.',
      prompt: `Email Content:\n\n${textBody}`,
      schema,
    });

    return object.tasks;
  }

  async triageEmails(
    emails: { id: string; from: string; subject: string; snippet: string | null }[],
    validLabelNames: string[]
  ) {
    const schema = z.object({
      suggestions: z.array(
        z.object({
          messageId: z.string().describe('The ID of the email'),
          suggestedLabel: z.string().describe("The suggested label name, or 'None'"),
          action: z.enum(['Archive', 'Delete', 'Keep in Inbox']).describe('Suggested action'),
          reasoning: z.string().describe('Brief 1-sentence reason for this suggestion'),
        })
      ),
    });

    const { object } = await generateObject({
      model: this.model,
      system: `You are an intelligent email triage assistant. Your goal is to read snippets of emails and suggest how to organize them.
      
      Available Labels to apply: ${validLabelNames.length > 0 ? validLabelNames.join(', ') : 'No custom labels available.'}.
      If no label fits perfectly, use "None".
      
      Suggest an action:
      - Archive: If it's a notification, receipt, or something to keep but doesn't need a reply.
      - Delete: If it's pure spam or cold outreach.
      - Keep in Inbox: If it looks like a real conversation requiring the user's attention.`,
      prompt: `Please triage these emails:\n\n${JSON.stringify(emails, null, 2)}`,
      schema,
    });

    return object.suggestions;
  }

  async naturalLanguageToFilter(nlPrompt: string, validLabelNames: string[]) {
    const schema = z.object({
      criteria: z
        .object({
          from: z.string().optional(),
          to: z.string().optional(),
          subject: z.string().optional(),
          query: z.string().optional().describe("Advanced query string, e.g., 'has:attachment OR from:boss'"),
        })
        .describe('The criteria for matching the email'),
      action: z
        .object({
          addLabelIds: z
            .array(z.string())
            .optional()
            .describe('List of label names to apply. MUST be from the available labels.'),
          removeLabelIds: z.array(z.string()).optional().describe("E.g., ['INBOX'] to archive."),
          forward: z.string().optional(),
        })
        .describe('Actions to apply to the matched emails'),
    });

    const { object } = await generateObject({
      model: this.model,
      system: `You are an expert at translating natural language into Gmail filter rules.
      
      Available Labels: ${validLabelNames.length > 0 ? validLabelNames.join(', ') : 'No custom labels available.'}.
      Map the user's intent to the closest available label name, or leave it empty if nothing fits.
      To "archive", add "INBOX" to removeLabelIds.`,
      prompt: `User request: "${nlPrompt}"`,
      schema,
    });

    return object;
  }
}
