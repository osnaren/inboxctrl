export type BulkMailAction = 'archive' | 'trash' | 'mark-read' | 'mark-unread' | 'label';

export interface MailFilterCriteria {
  from?: string;
  to?: string;
  subject?: string;
  query?: string;
}

export interface MailFilterAction {
  addLabelIds?: string[];
  removeLabelIds?: string[];
  forward?: string;
}

export interface MailFilterDraft {
  criteria: MailFilterCriteria;
  action: MailFilterAction;
}

export interface LabelSuggestion {
  messageId: string;
  suggestedLabel: string;
  action: 'Archive' | 'Delete' | 'Keep in Inbox';
  reasoning: string;
}

export interface SafetyCheckResult {
  ok: boolean;
  warnings: string[];
  blockers: string[];
}
