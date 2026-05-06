import type { MailFilterCriteria, MailFilterAction } from '@inboxctrl/core';

// ---------------------------------------------------------------------------
// Validation types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// Dry-run types
// ---------------------------------------------------------------------------

/** A simplified email record for local dry-run matching. */
export interface DryRunEmail {
  messageId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: Date;
  hasAttachment?: boolean;
  labelIds?: string[];
}

export interface DryRunMatchExplanation {
  messageId: string;
  matchedFields: string[];
  explanation: string;
}

export interface DryRunResult {
  totalMatched: number;
  sampleMatches: DryRunMatchExplanation[];
  falsePositiveWarnings: string[];
  broadFilterWarning: boolean;
}

// ---------------------------------------------------------------------------
// Conflict types
// ---------------------------------------------------------------------------

export interface FilterConflict {
  type: 'overlap' | 'contradictory' | 'broad';
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedFields: string[];
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  conflicts: FilterConflict[];
}

// ---------------------------------------------------------------------------
// Safety check types
// ---------------------------------------------------------------------------

export interface SafetyCheckInput {
  criteria: MailFilterCriteria;
  action: MailFilterAction;
  totalEmailCount?: number;
}

export interface SafetyCheckOutput {
  safe: boolean;
  warnings: string[];
  blockers: string[];
}

// ---------------------------------------------------------------------------
// Extended criteria (beyond MailFilterCriteria for validation)
// ---------------------------------------------------------------------------

export interface ExtendedFilterCriteria extends MailFilterCriteria {
  hasAttachment?: boolean;
  includeWords?: string[];
  excludeWords?: string[];
  ageInDays?: number;
  dateAfter?: string;
  dateBefore?: string;
}
