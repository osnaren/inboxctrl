import type { SafetyCheckInput, SafetyCheckOutput } from './types';
import type { MailFilterAction, MailFilterCriteria } from '@inboxctrl/core';

/**
 * Run safety checks on a filter before creation.
 *
 * Returns blockers (must not proceed) and warnings (user should review).
 * This is the OSS-level check; advanced cross-filter conflict detection
 * is a Pro feature.
 */
export function checkFilterSafety(input: SafetyCheckInput): SafetyCheckOutput {
  const warnings: string[] = [];
  const blockers: string[] = [];

  // Check for overly broad criteria
  if (isBroadFilter(input.criteria)) {
    warnings.push(
      'This filter has very broad criteria and may affect a large number of emails. Review the dry-run results carefully before applying.'
    );
  }

  // Check for dangerous action combinations
  if (hasDestructiveActions(input.action)) {
    warnings.push(
      'This filter includes potentially destructive actions (e.g. removing from Inbox). Affected emails will be harder to find.'
    );
  }

  // Check for empty/no-op filters
  if (isNoOpAction(input.action)) {
    blockers.push('This filter has no meaningful actions. Add at least one label change, removal, or forwarding rule.');
  }

  // Check match count if provided
  if (input.totalEmailCount !== undefined && input.totalEmailCount > 100) {
    warnings.push(
      `This filter would affect approximately ${input.totalEmailCount} emails. Consider testing with a smaller scope first.`
    );
  }

  return {
    safe: blockers.length === 0,
    warnings,
    blockers,
  };
}

/**
 * Check whether criteria are too broad.
 */
export function isBroadFilter(criteria: MailFilterCriteria): boolean {
  const fields = [criteria.from, criteria.to, criteria.subject, criteria.query];
  const specified = fields.filter(Boolean);

  // No criteria at all = dangerously broad
  if (specified.length === 0) return true;

  // Single very short criterion
  if (specified.length === 1 && specified[0]!.length <= 3) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function hasDestructiveActions(action: MailFilterAction): boolean {
  // Removing from INBOX = archiving
  if (action.removeLabelIds?.includes('INBOX')) return true;

  // Forwarding to external address
  if (action.forward) return true;

  return false;
}

function isNoOpAction(action: MailFilterAction): boolean {
  const hasAdd = action.addLabelIds && action.addLabelIds.length > 0;
  const hasRemove = action.removeLabelIds && action.removeLabelIds.length > 0;
  const hasForward = Boolean(action.forward);

  return !hasAdd && !hasRemove && !hasForward;
}
