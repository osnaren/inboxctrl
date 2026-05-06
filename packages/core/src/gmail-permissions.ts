export const GOOGLE_SIGN_IN_SCOPES = ['profile', 'email'] as const;

export const GMAIL_SCOPES = {
  labels: 'https://www.googleapis.com/auth/gmail.labels',
  metadata: 'https://www.googleapis.com/auth/gmail.metadata',
  readonly: 'https://www.googleapis.com/auth/gmail.readonly',
  modify: 'https://www.googleapis.com/auth/gmail.modify',
  settingsBasic: 'https://www.googleapis.com/auth/gmail.settings.basic',
  fullMail: 'https://mail.google.com/',
} as const;

export type GoogleSignInScope = (typeof GOOGLE_SIGN_IN_SCOPES)[number];
export type GmailScopeId = keyof typeof GMAIL_SCOPES;
export type GmailScope = (typeof GMAIL_SCOPES)[GmailScopeId];
export type GmailScopeUsage = 'non-sensitive' | 'restricted';
export type GmailPermissionModeId = 'read-only-audit' | 'organizer' | 'settings-filter';
export type GmailWorkflowId =
  | 'google-sign-in'
  | 'account-status'
  | 'label-sync'
  | 'label-crud'
  | 'mailbox-metadata-sync'
  | 'cached-mailbox-view'
  | 'manual-label-actions'
  | 'manual-archive-read-star-trash'
  | 'filter-draft-preview'
  | 'filter-create-delete'
  | 'ai-label-suggestions'
  | 'ai-summary-or-reply'
  | 'disconnect-account';

interface GmailScopeInfo {
  id: GmailScopeId;
  scope: GmailScope;
  usage: GmailScopeUsage;
  purpose: string;
  verificationNote: string;
}

interface GmailPermissionMode {
  id: GmailPermissionModeId;
  label: string;
  purpose: string;
  minimumScopes: readonly GmailScope[];
  enablesWorkflowIds: readonly GmailWorkflowId[];
  verificationNotes: readonly string[];
}

interface GmailWorkflowScopeRequirement {
  id: GmailWorkflowId;
  label: string;
  minimumGoogleScopes?: readonly GoogleSignInScope[];
  minimumGmailScopes: readonly GmailScope[];
  permissionMode: GmailPermissionModeId | 'local-only';
  notes: string;
}

export const GMAIL_SCOPE_CATALOG: Record<GmailScopeId, GmailScopeInfo> = {
  labels: {
    id: 'labels',
    scope: GMAIL_SCOPES.labels,
    usage: 'non-sensitive',
    purpose: 'Create, read, update, and delete Gmail labels without mailbox message access.',
    verificationNote: 'Non-sensitive Gmail scope; still declare it on the OAuth consent screen.',
  },
  metadata: {
    id: 'metadata',
    scope: GMAIL_SCOPES.metadata,
    usage: 'restricted',
    purpose: 'Read message IDs, labels, history, and headers without bodies or attachments.',
    verificationNote: 'Restricted Gmail scope; production apps require restricted-scope verification.',
  },
  readonly: {
    id: 'readonly',
    scope: GMAIL_SCOPES.readonly,
    usage: 'restricted',
    purpose: 'Read Gmail resources without mailbox write operations.',
    verificationNote: 'Restricted Gmail scope; use only when snippets or full message reads are required.',
  },
  modify: {
    id: 'modify',
    scope: GMAIL_SCOPES.modify,
    usage: 'restricted',
    purpose: 'Apply labels, archive, star, trash, and mark messages read/unread without permanent deletion.',
    verificationNote: 'Restricted Gmail scope; use for organizer mode and avoid the broader mail.google.com scope.',
  },
  settingsBasic: {
    id: 'settingsBasic',
    scope: GMAIL_SCOPES.settingsBasic,
    usage: 'restricted',
    purpose: 'Create, list, and delete Gmail filters and basic settings.',
    verificationNote: 'Restricted Gmail scope; only request when filter/settings workflows are enabled.',
  },
  fullMail: {
    id: 'fullMail',
    scope: GMAIL_SCOPES.fullMail,
    usage: 'restricted',
    purpose: 'Full mailbox access, including permanent deletion.',
    verificationNote: 'Do not request for InboxCtrl OSS; narrower scopes cover current workflows.',
  },
};

export const GMAIL_PERMISSION_MODES: Record<GmailPermissionModeId, GmailPermissionMode> = {
  'read-only-audit': {
    id: 'read-only-audit',
    label: 'Read-only audit',
    purpose: 'Inspect mailbox structure and cached metadata without Gmail mutations.',
    minimumScopes: [GMAIL_SCOPES.metadata, GMAIL_SCOPES.labels],
    enablesWorkflowIds: [
      'account-status',
      'label-sync',
      'mailbox-metadata-sync',
      'cached-mailbox-view',
      'filter-draft-preview',
      'ai-label-suggestions',
    ],
    verificationNotes: [GMAIL_SCOPE_CATALOG.metadata.verificationNote, GMAIL_SCOPE_CATALOG.labels.verificationNote],
  },
  organizer: {
    id: 'organizer',
    label: 'Organizer',
    purpose: 'Run review-first mailbox organization actions without Gmail settings access.',
    minimumScopes: [GMAIL_SCOPES.modify, GMAIL_SCOPES.labels],
    enablesWorkflowIds: [
      'account-status',
      'label-sync',
      'label-crud',
      'mailbox-metadata-sync',
      'cached-mailbox-view',
      'manual-label-actions',
      'manual-archive-read-star-trash',
      'filter-draft-preview',
      'ai-label-suggestions',
    ],
    verificationNotes: [GMAIL_SCOPE_CATALOG.modify.verificationNote, GMAIL_SCOPE_CATALOG.labels.verificationNote],
  },
  'settings-filter': {
    id: 'settings-filter',
    label: 'Settings and filters',
    purpose: 'Create and manage Gmail filters after review.',
    minimumScopes: [GMAIL_SCOPES.settingsBasic, GMAIL_SCOPES.labels],
    enablesWorkflowIds: ['account-status', 'label-sync', 'label-crud', 'filter-create-delete'],
    verificationNotes: [
      GMAIL_SCOPE_CATALOG.settingsBasic.verificationNote,
      GMAIL_SCOPE_CATALOG.labels.verificationNote,
    ],
  },
};

export const GMAIL_WORKFLOW_SCOPE_REQUIREMENTS: Record<GmailWorkflowId, GmailWorkflowScopeRequirement> = {
  'google-sign-in': {
    id: 'google-sign-in',
    label: 'Google sign-in',
    minimumGoogleScopes: GOOGLE_SIGN_IN_SCOPES,
    minimumGmailScopes: [],
    permissionMode: 'local-only',
    notes: 'Required for authentication; does not grant Gmail API access by itself.',
  },
  'account-status': {
    id: 'account-status',
    label: 'Account status and token health',
    minimumGmailScopes: [],
    permissionMode: 'local-only',
    notes: 'Uses local Better Auth account/session state; Gmail scopes are reported, not consumed.',
  },
  'label-sync': {
    id: 'label-sync',
    label: 'Label sync',
    minimumGmailScopes: [GMAIL_SCOPES.labels],
    permissionMode: 'read-only-audit',
    notes: 'Lists labels for local navigation and filter drafting.',
  },
  'label-crud': {
    id: 'label-crud',
    label: 'Label create, update, and delete',
    minimumGmailScopes: [GMAIL_SCOPES.labels],
    permissionMode: 'settings-filter',
    notes: 'Manages labels only; applying labels to messages is a separate organizer workflow.',
  },
  'mailbox-metadata-sync': {
    id: 'mailbox-metadata-sync',
    label: 'Mailbox metadata sync',
    minimumGmailScopes: [GMAIL_SCOPES.metadata],
    permissionMode: 'read-only-audit',
    notes: 'Target minimum for message IDs, labels, headers, and history without bodies or attachments.',
  },
  'cached-mailbox-view': {
    id: 'cached-mailbox-view',
    label: 'Cached mailbox views and local search',
    minimumGmailScopes: [GMAIL_SCOPES.metadata],
    permissionMode: 'read-only-audit',
    notes: 'Should render from local cache after sync; full body reads are opt-in later.',
  },
  'manual-label-actions': {
    id: 'manual-label-actions',
    label: 'Apply or remove labels on messages',
    minimumGmailScopes: [GMAIL_SCOPES.modify],
    permissionMode: 'organizer',
    notes: 'Requires message mutation access even when labels already exist.',
  },
  'manual-archive-read-star-trash': {
    id: 'manual-archive-read-star-trash',
    label: 'Archive, mark read/unread, star/unstar, and trash',
    minimumGmailScopes: [GMAIL_SCOPES.modify],
    permissionMode: 'organizer',
    notes: 'Allowed in organizer mode; permanent deletion remains out of scope.',
  },
  'filter-draft-preview': {
    id: 'filter-draft-preview',
    label: 'Filter draft and dry-run preview',
    minimumGmailScopes: [GMAIL_SCOPES.metadata],
    permissionMode: 'read-only-audit',
    notes: 'Drafting can use local cache; creating the filter requires settings/filter mode.',
  },
  'filter-create-delete': {
    id: 'filter-create-delete',
    label: 'Create or delete Gmail filters',
    minimumGmailScopes: [GMAIL_SCOPES.settingsBasic],
    permissionMode: 'settings-filter',
    notes: 'Requires Gmail settings access and explicit review before execution.',
  },
  'ai-label-suggestions': {
    id: 'ai-label-suggestions',
    label: 'AI label suggestions',
    minimumGmailScopes: [GMAIL_SCOPES.metadata],
    permissionMode: 'read-only-audit',
    notes: 'Uses selected local metadata/snippets; applying accepted labels requires organizer mode.',
  },
  'ai-summary-or-reply': {
    id: 'ai-summary-or-reply',
    label: 'On-demand summary or reply draft',
    minimumGmailScopes: [GMAIL_SCOPES.readonly],
    permissionMode: 'read-only-audit',
    notes: 'Full-body fetch is not part of default list views and should be explicitly enabled.',
  },
  'disconnect-account': {
    id: 'disconnect-account',
    label: 'Disconnect account',
    minimumGmailScopes: [],
    permissionMode: 'local-only',
    notes: 'Revokes/removes local OAuth state; does not require a Gmail API scope.',
  },
};

export const CURRENT_BETTER_AUTH_GOOGLE_SCOPES = [
  ...GOOGLE_SIGN_IN_SCOPES,
  GMAIL_SCOPES.modify,
  GMAIL_SCOPES.settingsBasic,
  GMAIL_SCOPES.labels,
] as const;

export const CURRENT_BETTER_AUTH_SCOPE_COMPARISON = {
  requestedPermissionModes: ['organizer', 'settings-filter'] satisfies GmailPermissionModeId[],
  requestedGmailScopes: [GMAIL_SCOPES.modify, GMAIL_SCOPES.settingsBasic, GMAIL_SCOPES.labels] as const,
  notYetSeparatedModes: ['read-only-audit'] satisfies GmailPermissionModeId[],
  intentionallyNotRequested: [GMAIL_SCOPES.fullMail, GMAIL_SCOPES.readonly, GMAIL_SCOPES.metadata] as const,
  notes:
    'The current app asks for organizer and settings/filter scopes together. OSN-63 should enforce explicit mode boundaries before mutating routes rely on this map.',
} as const;
