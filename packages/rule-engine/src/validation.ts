import type { ValidationError, ValidationResult, ValidationWarning } from './types';
import type { MailFilterAction, MailFilterCriteria } from '@inboxctrl/core';

/**
 * Validate filter criteria before creating or dry-running a filter.
 *
 * Returns errors (must fix) and warnings (review recommended).
 */
export function validateCriteria(criteria: MailFilterCriteria): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Must have at least one criterion
  const hasAnyCriteria =
    Boolean(criteria.from) || Boolean(criteria.to) || Boolean(criteria.subject) || Boolean(criteria.query);

  if (!hasAnyCriteria) {
    errors.push({
      field: '*',
      message: 'At least one filter criterion (from, to, subject, or query) is required.',
    });
  }

  // Warn on overly broad single-character criteria
  for (const [field, value] of Object.entries(criteria)) {
    if (typeof value === 'string' && value.length === 1) {
      warnings.push({
        field,
        message: `Single-character "${field}" criterion is likely too broad and may match most emails.`,
        severity: 'high',
      });
    }
  }

  // Warn on wildcard-like patterns
  if (criteria.from === '*' || criteria.to === '*') {
    warnings.push({
      field: criteria.from === '*' ? 'from' : 'to',
      message: 'Wildcard patterns may match all emails.',
      severity: 'high',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate filter actions.
 */
export function validateAction(action: MailFilterAction): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const hasAnyAction =
    (action.addLabelIds && action.addLabelIds.length > 0) ||
    (action.removeLabelIds && action.removeLabelIds.length > 0) ||
    Boolean(action.forward);

  if (!hasAnyAction) {
    errors.push({
      field: '*',
      message: 'At least one action (add labels, remove labels, or forward) is required.',
    });
  }

  // Warn on forwarding
  if (action.forward) {
    warnings.push({
      field: 'forward',
      message: 'Forwarding rules send email content to another address. Verify the destination.',
      severity: 'medium',
    });
  }

  // Check for contradictory add/remove
  if (action.addLabelIds && action.removeLabelIds) {
    const overlap = action.addLabelIds.filter((id) => action.removeLabelIds?.includes(id));
    if (overlap.length > 0) {
      errors.push({
        field: 'addLabelIds/removeLabelIds',
        message: `Labels [${overlap.join(', ')}] appear in both add and remove; this is contradictory.`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate both criteria and action together.
 */
export function validateFilter(criteria: MailFilterCriteria, action: MailFilterAction): ValidationResult {
  const criteriaResult = validateCriteria(criteria);
  const actionResult = validateAction(action);

  return {
    valid: criteriaResult.valid && actionResult.valid,
    errors: [...criteriaResult.errors, ...actionResult.errors],
    warnings: [...criteriaResult.warnings, ...actionResult.warnings],
  };
}
