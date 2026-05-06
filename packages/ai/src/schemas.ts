import { z } from 'zod';

// ---------------------------------------------------------------------------
// Label suggestion / triage schema
// ---------------------------------------------------------------------------

export const labelSuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      messageId: z.string().describe('The ID of the email'),
      suggestedLabel: z.string().describe("The suggested label name, or 'None'"),
      confidence: z.number().min(0).max(1).describe('Confidence score from 0 to 1'),
      action: z.enum(['Archive', 'Delete', 'Keep in Inbox']).describe('Suggested action'),
      reasoning: z.string().describe('Brief 1-sentence reason for this suggestion'),
    })
  ),
});

export type LabelSuggestionOutput = z.infer<typeof labelSuggestionSchema>;

// ---------------------------------------------------------------------------
// Task extraction schema
// ---------------------------------------------------------------------------

export const taskExtractionSchema = z.object({
  tasks: z.array(z.string()).describe('List of actionable tasks extracted from the email.'),
});

export type TaskExtractionOutput = z.infer<typeof taskExtractionSchema>;

// ---------------------------------------------------------------------------
// Filter draft schema
// ---------------------------------------------------------------------------

export const filterDraftSchema = z.object({
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

export type FilterDraftOutput = z.infer<typeof filterDraftSchema>;
