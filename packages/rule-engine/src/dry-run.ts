import type { DryRunEmail, DryRunMatchExplanation, DryRunResult } from './types';
import type { MailFilterCriteria } from '@inboxctrl/core';


/**
 * Run a local dry-run of filter criteria against a set of cached emails.
 *
 * This evaluates criteria client-side against already-synced metadata.  It does
 * NOT hit the Gmail API.  The result includes sample matches with explanations
 * and false-positive warnings.
 */
export function dryRunFilter(
  criteria: MailFilterCriteria,
  emails: DryRunEmail[],
  options: { maxSamples?: number } = {}
): DryRunResult {
  const maxSamples = options.maxSamples ?? 20;
  const matches: DryRunMatchExplanation[] = [];
  const falsePositiveWarnings: string[] = [];

  for (const email of emails) {
    const matchedFields: string[] = [];

    if (criteria.from && containsInsensitive(email.from, criteria.from)) {
      matchedFields.push('from');
    }

    if (criteria.to && containsInsensitive(email.to, criteria.to)) {
      matchedFields.push('to');
    }

    if (criteria.subject && containsInsensitive(email.subject, criteria.subject)) {
      matchedFields.push('subject');
    }

    if (criteria.query) {
      // Basic query matching: check from, to, subject, snippet
      const queryLower = criteria.query.toLowerCase();
      const searchable = `${email.from} ${email.to} ${email.subject} ${email.snippet}`.toLowerCase();
      if (searchable.includes(queryLower)) {
        matchedFields.push('query');
      }
    }

    // All specified criteria must match (AND logic)
    const specifiedCount = countSpecifiedCriteria(criteria);
    if (matchedFields.length >= specifiedCount && specifiedCount > 0) {
      if (matches.length < maxSamples) {
        matches.push({
          messageId: email.messageId,
          matchedFields,
          explanation: buildExplanation(email, matchedFields, criteria),
        });
      }
    }
  }

  // Detect broad filters
  const totalMatched = countAllMatches(criteria, emails);
  const matchRatio = emails.length > 0 ? totalMatched / emails.length : 0;
  const broadFilterWarning = matchRatio > 0.5 && totalMatched > 10;

  if (broadFilterWarning) {
    falsePositiveWarnings.push(
      `This filter matches ${Math.round(matchRatio * 100)}% of your cached emails (${totalMatched}/${emails.length}). Consider narrowing the criteria.`
    );
  }

  // Warn on very short criteria
  if (criteria.from && criteria.from.length <= 3) {
    falsePositiveWarnings.push(
      `The "from" criterion "${criteria.from}" is very short and may produce false positives.`
    );
  }
  if (criteria.subject && criteria.subject.length <= 3) {
    falsePositiveWarnings.push(
      `The "subject" criterion "${criteria.subject}" is very short and may produce false positives.`
    );
  }

  return {
    totalMatched,
    sampleMatches: matches,
    falsePositiveWarnings,
    broadFilterWarning,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function containsInsensitive(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function countSpecifiedCriteria(criteria: MailFilterCriteria): number {
  let count = 0;
  if (criteria.from) count++;
  if (criteria.to) count++;
  if (criteria.subject) count++;
  if (criteria.query) count++;
  return count;
}

function countAllMatches(criteria: MailFilterCriteria, emails: DryRunEmail[]): number {
  const specifiedCount = countSpecifiedCriteria(criteria);
  if (specifiedCount === 0) return 0;

  let count = 0;
  for (const email of emails) {
    let matched = 0;
    if (criteria.from && containsInsensitive(email.from, criteria.from)) matched++;
    if (criteria.to && containsInsensitive(email.to, criteria.to)) matched++;
    if (criteria.subject && containsInsensitive(email.subject, criteria.subject)) matched++;
    if (criteria.query) {
      const searchable = `${email.from} ${email.to} ${email.subject} ${email.snippet}`.toLowerCase();
      if (searchable.includes(criteria.query.toLowerCase())) matched++;
    }
    if (matched >= specifiedCount) count++;
  }
  return count;
}

function buildExplanation(email: DryRunEmail, matchedFields: string[], criteria: MailFilterCriteria): string {
  const parts: string[] = [];

  if (matchedFields.includes('from')) {
    parts.push(`from "${email.from}" contains "${criteria.from}"`);
  }
  if (matchedFields.includes('to')) {
    parts.push(`to "${email.to}" contains "${criteria.to}"`);
  }
  if (matchedFields.includes('subject')) {
    parts.push(`subject "${email.subject}" contains "${criteria.subject}"`);
  }
  if (matchedFields.includes('query')) {
    parts.push(`content matches query "${criteria.query}"`);
  }

  return `Matched because ${parts.join(' AND ')}`;
}
