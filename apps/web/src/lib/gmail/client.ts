/**
 * @deprecated Import from '@inboxctrl/gmail' instead.
 *
 * This file exists for backwards compatibility during migration.
 */
export { GmailClient as getGmailClient } from '@inboxctrl/gmail';

// Re-export the static helper as a standalone function for existing callers
import { GmailClient } from '@inboxctrl/gmail';

export const extractHeaders = GmailClient.extractHeaders;
