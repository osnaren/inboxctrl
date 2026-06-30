import assert from 'node:assert/strict';
import test from 'node:test';

import { extensionFeatureUnavailable } from '@/lib/extension-feature';

import { apiFailure, apiSuccess } from './contracts';
import {
  DEFAULT_PRIVACY_SETTINGS,
  VALID_BULK_ACTIONS,
  buildMailListOrderBy,
  buildMailListWhere,
  formatAiSettings,
  formatMailListEmail,
  formatPrivacySettings,
  parseAiSettingsUpdate,
  parseBulkActionRequest,
  parseFilterRequest,
  parseMailListQuery,
  parsePermissionUpgradeRequest,
  parsePrivacySettingsUpdate,
  parseStoredLabelIds,
} from './launch-contracts';

test('account status envelope uses stable success shape', () => {
  const response = apiSuccess({
    connected: true,
    syncReady: true,
    tokenReady: true,
  });

  assert.deepEqual(response, {
    ok: true,
    data: {
      connected: true,
      syncReady: true,
      tokenReady: true,
    },
  });
});

test('mail list query parsing clamps pagination and preserves filters', () => {
  const query = parseMailListQuery(
    new URLSearchParams({
      sender: 'github.com',
      q: 'invoice',
      unread: 'true',
      page: '0',
      pageSize: '250',
      sortBy: 'subject',
      sortDir: 'asc',
    })
  );

  assert.equal(query.sender, 'github.com');
  assert.equal(query.query, 'invoice');
  assert.equal(query.unread, true);
  assert.equal(query.page, 1);
  assert.equal(query.pageSize, 200);
  assert.equal(query.sortBy, 'subject');
  assert.equal(query.sortDir, 'asc');
});

test('mail list where builder combines sender and full-text search', () => {
  const where = buildMailListWhere('user-1', parseMailListQuery(new URLSearchParams({ sender: 'github', q: 'issue' })));

  assert.equal(where.userId, 'user-1');
  assert.ok(Array.isArray(where.AND));
});

test('mail list formatter expands stored labels and formatted date', () => {
  const formatted = formatMailListEmail({
    id: 'email-1',
    date: new Date('2026-05-10T10:00:00.000Z'),
    labelIds: '["INBOX","STARRED"]',
  });

  assert.deepEqual(formatted.labelIds, ['INBOX', 'STARRED']);
  assert.equal(typeof formatted.formattedDate, 'string');
});

test('bulk action parser validates action and label requirements', () => {
  assert.deepEqual(VALID_BULK_ACTIONS.includes('archive'), true);

  const parsed = parseBulkActionRequest({
    messageIds: ['msg-1', 'msg-2'],
    action: 'apply-label',
    labelId: 'Label_1',
  });

  assert.deepEqual(parsed, {
    messageIds: ['msg-1', 'msg-2'],
    action: 'apply-label',
    labelId: 'Label_1',
  });

  assert.throws(() => parseBulkActionRequest({ messageIds: ['msg-1'], action: 'apply-label' }), /Missing labelId/);
});

test('filter request parser requires a prompt', () => {
  assert.deepEqual(parseFilterRequest({ prompt: 'label receipts', dryRun: true }), {
    prompt: 'label receipts',
    dryRun: true,
  });

  assert.throws(() => parseFilterRequest({ dryRun: true }), /Missing prompt/);
});

test('privacy settings helpers keep defaults and validate ranges', () => {
  assert.deepEqual(formatPrivacySettings(null), DEFAULT_PRIVACY_SETTINGS);

  assert.deepEqual(parsePrivacySettingsUpdate({ allowExternalAi: true, metadataCacheRetentionDays: 120 }), {
    allowExternalAi: true,
    metadataCacheRetentionDays: 120,
  });

  assert.throws(
    () => parsePrivacySettingsUpdate({ metadataCacheRetentionDays: 0 }),
    /metadataCacheRetentionDays must be between 1 and 3650/
  );
});

test('ai settings helpers format current provider and validate provider updates', () => {
  const formatted = formatAiSettings(
    {
      aiEnabled: true,
      aiProviderId: 'openai',
      aiModel: 'gpt-4o-mini',
      aiApiKeySet: false,
    },
    true
  );

  assert.equal(formatted.providerId, 'openai');
  assert.equal(formatted.usesEnvKey, true);

  const parsed = parseAiSettingsUpdate({ providerId: 'openai', aiEnabled: true, apiKey: 'test-key' });
  assert.equal(parsed.updateData.aiEnabled, true);
  assert.equal(parsed.updateData.aiProviderId, 'openai');
  assert.equal(typeof parsed.apiKey, 'string');

  assert.throws(() => parseAiSettingsUpdate({ providerId: 'not-a-provider' }), /Invalid AI provider/);
});

test('permission upgrade parser accepts only supported modes', () => {
  assert.deepEqual(parsePermissionUpgradeRequest({ mode: 'organizer' }), { mode: 'organizer' });
  assert.throws(() => parsePermissionUpgradeRequest({ mode: 'not-real' }), /Invalid permission mode/);
});

test('stored label parsing is resilient to bad JSON', () => {
  assert.deepEqual(parseStoredLabelIds('["A","B"]'), ['A', 'B']);
  assert.deepEqual(parseStoredLabelIds('{bad json'), []);
});

test('pro-unavailable route returns a stable 402 failure envelope', async () => {
  const response = extensionFeatureUnavailable('extension.filter-xml', 'Filter XML');
  const body = await response.json();

  assert.equal(response.status, 402);
  assert.equal(body.ok, false);
  assert.equal(body.error.code, 'EXTENSION_FEATURE_UNAVAILABLE');
  assert.equal(body.error.message, 'Extension feature unavailable');
});

test('api failure helper uses stable error shape', () => {
  const response = apiFailure('INVALID_REQUEST', 'Missing prompt', { field: 'prompt' });

  assert.deepEqual(response, {
    ok: false,
    error: {
      code: 'INVALID_REQUEST',
      message: 'Missing prompt',
      details: { field: 'prompt' },
    },
  });
});

test('mail list order builder falls back to date sorting', () => {
  assert.deepEqual(buildMailListOrderBy(parseMailListQuery(new URLSearchParams({ sortBy: 'not-real' }))), {
    date: 'desc',
  });
});
