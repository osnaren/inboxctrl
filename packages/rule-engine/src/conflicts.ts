import type { ConflictCheckResult, FilterConflict } from './types';
import type { MailFilterAction, MailFilterCriteria } from '@inboxctrl/core';


/**
 * Basic OSS conflict detection between a new filter and existing filters.
 *
 * Detects:
 * - Overlapping criteria (same field values across filters)
 * - Contradictory actions on overlapping criteria
 *
 * Advanced cross-filter conflict detection is a Pro feature (not in this package).
 */
export function detectBasicConflicts(
  newCriteria: MailFilterCriteria,
  existingFilters: Array<{ criteria: MailFilterCriteria; action?: Partial<MailFilterAction> }>,
  newAction?: Partial<MailFilterAction>
): ConflictCheckResult {
  const conflicts: FilterConflict[] = [];

  for (const existing of existingFilters) {
    const overlappingFields: string[] = [];

    if (newCriteria.from && existing.criteria.from) {
      if (
        newCriteria.from.toLowerCase() === existing.criteria.from.toLowerCase() ||
        newCriteria.from.toLowerCase().includes(existing.criteria.from.toLowerCase()) ||
        existing.criteria.from.toLowerCase().includes(newCriteria.from.toLowerCase())
      ) {
        overlappingFields.push('from');
      }
    }

    if (newCriteria.to && existing.criteria.to) {
      if (
        newCriteria.to.toLowerCase() === existing.criteria.to.toLowerCase() ||
        newCriteria.to.toLowerCase().includes(existing.criteria.to.toLowerCase()) ||
        existing.criteria.to.toLowerCase().includes(newCriteria.to.toLowerCase())
      ) {
        overlappingFields.push('to');
      }
    }

    if (newCriteria.subject && existing.criteria.subject) {
      if (
        newCriteria.subject.toLowerCase() === existing.criteria.subject.toLowerCase() ||
        newCriteria.subject.toLowerCase().includes(existing.criteria.subject.toLowerCase()) ||
        existing.criteria.subject.toLowerCase().includes(newCriteria.subject.toLowerCase())
      ) {
        overlappingFields.push('subject');
      }
    }

    if (overlappingFields.length > 0) {
      conflicts.push({
        type: 'overlap',
        description: `An existing filter has overlapping criteria on: ${overlappingFields.join(', ')}. Both filters may apply to the same emails.`,
        severity: 'medium',
        affectedFields: overlappingFields,
      });

      const contradictoryLabels = findContradictoryLabels(newAction, existing.action);
      if (contradictoryLabels.length > 0) {
        conflicts.push({
          type: 'contradictory',
          description: `An overlapping filter adds and removes the same label ids: ${contradictoryLabels.join(', ')}.`,
          severity: 'high',
          affectedFields: ['addLabelIds', 'removeLabelIds'],
        });
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}

function findContradictoryLabels(
  newAction?: Partial<MailFilterAction>,
  existingAction?: Partial<MailFilterAction>
): string[] {
  if (!newAction || !existingAction) {
    return [];
  }

  const newAdds = new Set(newAction.addLabelIds ?? []);
  const newRemoves = new Set(newAction.removeLabelIds ?? []);
  const existingAdds = new Set(existingAction.addLabelIds ?? []);
  const existingRemoves = new Set(existingAction.removeLabelIds ?? []);

  return [...intersection(newAdds, existingRemoves), ...intersection(newRemoves, existingAdds)].filter(
    (value, index, values) => values.indexOf(value) === index
  );
}

function intersection(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((value) => right.has(value));
}
