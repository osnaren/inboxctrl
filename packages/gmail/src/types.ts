import type { gmail_v1 } from 'googleapis';

// ---------------------------------------------------------------------------
// Client configuration
// ---------------------------------------------------------------------------

/**
 * Options for creating a {@link GmailClient}.
 *
 * `accessToken` is always required. An optional `onTokenRefresh` callback lets
 * callers inject automatic token renewal without the Gmail package depending on
 * any auth framework.
 */
export interface GmailClientOptions {
  accessToken: string;
  /**
   * Called when the current access token is rejected (401).
   * Return a fresh token or `null` to give up.
   */
  onTokenRefresh?: () => Promise<string | null>;
}

// ---------------------------------------------------------------------------
// Parsed header helpers
// ---------------------------------------------------------------------------

export interface GmailHeaders {
  from: string;
  to: string;
  subject: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Label types
// ---------------------------------------------------------------------------

export interface GmailLabelInfo {
  id: string;
  name: string;
  type: string;
  color: string | null;
  messagesTotal?: number;
  messagesUnread?: number;
}

export interface CreateLabelOptions {
  name: string;
  backgroundColor?: string;
  textColor?: string;
}

export interface UpdateLabelOptions {
  labelId: string;
  name: string;
  backgroundColor?: string;
  textColor?: string;
}

// ---------------------------------------------------------------------------
// Message types
// ---------------------------------------------------------------------------

export interface GmailMessageMeta {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  headers: GmailHeaders;
  internalDate: string | null;
}

export interface GmailMessageFull extends GmailMessageMeta {
  payload: gmail_v1.Schema$MessagePart | null;
  sizeEstimate: number;
  raw?: string | null;
}

export interface ListMessagesOptions {
  maxResults?: number;
  labelIds?: string[];
  query?: string;
  pageToken?: string;
}

export interface ListMessagesResult {
  messages: Array<{ id: string; threadId: string }>;
  nextPageToken: string | null;
  resultSizeEstimate: number;
}

// ---------------------------------------------------------------------------
// Message modification
// ---------------------------------------------------------------------------

export interface ModifyLabelsOptions {
  messageId: string;
  addLabelIds?: string[];
  removeLabelIds?: string[];
}

export interface BatchModifyLabelsOptions {
  messageIds: string[];
  addLabelIds?: string[];
  removeLabelIds?: string[];
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export interface GmailFilterInfo {
  id: string;
  criteria: gmail_v1.Schema$FilterCriteria;
  action: gmail_v1.Schema$FilterAction;
}

export interface CreateFilterOptions {
  criteria: gmail_v1.Schema$FilterCriteria;
  action: gmail_v1.Schema$FilterAction;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export interface GmailErrorDetails {
  code: number;
  message: string;
  status?: string;
  isRateLimit: boolean;
  isAuthError: boolean;
  retryAfterMs: number | null;
  originalError: unknown;
}
