export const DEMO_USER_ID = 'demo-user';
export const DEMO_ACCOUNT_ID = 'demo-google-account';
export const DEMO_EMAIL = 'demo@inboxctrl.local';
export const DEMO_ACCESS_TOKEN = 'demo-access-token';

export const DEMO_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.settings.basic',
] as const;

export const demoLabels = [
  { gmailId: 'INBOX', name: 'Inbox', type: 'system', color: '#e5e7eb' },
  { gmailId: 'UNREAD', name: 'Unread', type: 'system', color: '#dbeafe' },
  { gmailId: 'STARRED', name: 'Starred', type: 'system', color: '#fef3c7' },
  { gmailId: 'Label_receipts', name: 'Receipts', type: 'user', color: '#dff4ef' },
  { gmailId: 'Label_github', name: 'GitHub', type: 'user', color: '#e0e7ff' },
  { gmailId: 'Label_travel', name: 'Travel', type: 'user', color: '#ffedd5' },
] as const;

export const demoEmails = [
  {
    messageId: 'demo-msg-001',
    threadId: 'demo-thread-001',
    from: 'GitHub <notifications@github.com>',
    to: DEMO_EMAIL,
    subject: 'Review requested on inboxctrl#84',
    snippet: 'A review was requested for the public site scaffold and launch boundary checks.',
    sender: 'notifications@github.com',
    date: '2026-05-07T08:30:00.000Z',
    isUnread: true,
    isStarred: true,
    hasAttach: false,
    labelIds: ['INBOX', 'UNREAD', 'STARRED', 'Label_github'],
    body: 'Demo body: review the public site scaffold, route boundary check, and launch-safe CTAs.',
  },
  {
    messageId: 'demo-msg-002',
    threadId: 'demo-thread-002',
    from: 'Stripe <receipts@stripe.com>',
    to: DEMO_EMAIL,
    subject: 'Receipt for InboxCtrl test workspace',
    snippet: 'Your receipt is ready. This deterministic demo email is safe to label locally.',
    sender: 'receipts@stripe.com',
    date: '2026-05-06T15:45:00.000Z',
    isUnread: false,
    isStarred: false,
    hasAttach: true,
    labelIds: ['INBOX', 'Label_receipts'],
    body: 'Demo body: a receipt-like message for filter dry-runs and label suggestions.',
  },
  {
    messageId: 'demo-msg-003',
    threadId: 'demo-thread-003',
    from: 'Airline Updates <alerts@example-air.test>',
    to: DEMO_EMAIL,
    subject: 'Flight schedule changed',
    snippet: 'Your demo flight time changed. No real trip is attached to this mailbox.',
    sender: 'alerts@example-air.test',
    date: '2026-05-05T11:10:00.000Z',
    isUnread: true,
    isStarred: false,
    hasAttach: false,
    labelIds: ['INBOX', 'UNREAD', 'Label_travel'],
    body: 'Demo body: travel update content for deterministic task extraction examples.',
  },
  {
    messageId: 'demo-msg-004',
    threadId: 'demo-thread-004',
    from: 'Security Bot <security@example.dev>',
    to: DEMO_EMAIL,
    subject: 'New sign-in to local demo',
    snippet: 'A new sign-in event was recorded for the deterministic demo account.',
    sender: 'security@example.dev',
    date: '2026-05-04T09:20:00.000Z',
    isUnread: false,
    isStarred: false,
    hasAttach: false,
    labelIds: ['INBOX'],
    body: 'Demo body: security notification for local-only account status examples.',
  },
] as const;

export const demoActivityLogs = [
  {
    action: 'DEMO_SEED',
    description: 'Seeded deterministic InboxCtrl demo mailbox.',
    metadata: JSON.stringify({ source: 'packages/demo-data', rollbackAvailable: false }),
  },
] as const;

export const demoAi = {
  labelSuggestions: [
    {
      messageId: 'demo-msg-001',
      suggestedLabel: 'GitHub',
      confidence: 0.94,
      explanation: 'Repository notification with review language.',
    },
    {
      messageId: 'demo-msg-002',
      suggestedLabel: 'Receipts',
      confidence: 0.91,
      explanation: 'Payment receipt sender and subject.',
    },
  ],
  summaries: {
    'demo-msg-001': ['Review requested for the public site scaffold.', 'Boundary checks should stay launch-safe.'],
    'demo-msg-003': ['Demo flight schedule changed.', 'No real travel account is connected.'],
  },
  tasks: {
    'demo-msg-001': [{ title: 'Review InboxCtrl launch scaffold', due: '2026-05-09', requester: 'GitHub' }],
  },
  smartReplies: {
    'demo-msg-001': 'Thanks, I will review the scaffold and boundary checks today.',
  },
} as const;
