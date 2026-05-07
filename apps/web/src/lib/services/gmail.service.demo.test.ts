import assert from 'node:assert/strict';

import { DEMO_MODE_REAL_GMAIL_BLOCKED, isDemoMode } from '@/lib/demo-mode';
import { createRealGmailClient, GmailService } from '@/lib/services/gmail.service';

assert.equal(isDemoMode(), true, 'demo Gmail guard must run with INBOXCTRL_DEMO_MODE=true');

assert.throws(
  () => createRealGmailClient('real-token'),
  (error) => error instanceof Error && error.message === DEMO_MODE_REAL_GMAIL_BLOCKED
);

const gmailService = new GmailService('demo-access-token');

async function main() {
  const labels = await gmailService.listLabels();
  assert.ok(
    labels.some((label) => label.id === 'INBOX'),
    'demo service should expose seeded labels'
  );

  const messages = await gmailService.listRecentMessages(10, ['INBOX']);
  assert.ok(
    messages.some((message) => message.id === 'demo-msg-001'),
    'demo service should expose seeded messages'
  );

  process.stdout.write('demo Gmail guard ok\n');
}

void main();
