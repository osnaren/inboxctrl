import { isOssFeatureId, type InboxCtrlFeatureId } from '@inboxctrl/core';

import type { LicenseSnapshot } from './types';

export const canUseFeature = (
  featureId: InboxCtrlFeatureId,
  license: LicenseSnapshot,
  pluginRegistered = false
): boolean => {
  if (isOssFeatureId(featureId)) return true;
  if (!pluginRegistered) return false;

  return license.plan === 'extension' && license.features.includes(featureId);
};
