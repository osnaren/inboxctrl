export const OSS_FEATURE_IDS = [
  'gmail.oauth',
  'mail.label-crud',
  'mail.metadata-sync',
  'mail.manual-bulk-actions',
  'ai.byok',
  'ai.basic-label-suggestions',
  'filters.natural-language-draft',
  'filters.basic-dry-run',
  'activity.log',
] as const;

export const EXTENSION_FEATURE_IDS = [
  'extension.advanced-label-planner',
  'extension.advanced-rule-conflicts',
  'extension.filter-xml',
  'extension.sender-intelligence',
  'extension.automation-recipes',
] as const;

export type OssFeatureId = (typeof OSS_FEATURE_IDS)[number];
export type ExtensionFeatureId = (typeof EXTENSION_FEATURE_IDS)[number];
export type InboxCtrlFeatureId = OssFeatureId | ExtensionFeatureId | (string & {});

const ossFeatureSet = new Set<string>(OSS_FEATURE_IDS);
const extensionFeatureSet = new Set<string>(EXTENSION_FEATURE_IDS);

export const isOssFeatureId = (featureId: string): featureId is OssFeatureId => ossFeatureSet.has(featureId);

export const isExtensionFeatureId = (featureId: string): featureId is ExtensionFeatureId =>
  extensionFeatureSet.has(featureId);
