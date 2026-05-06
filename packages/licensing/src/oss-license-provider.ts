import { OSS_FEATURE_IDS } from '@inboxctrl/core';

import type { LicenseProvider, LicenseSnapshot } from './types';

export class OssLicenseProvider implements LicenseProvider {
  async getLicenseSnapshot(): Promise<LicenseSnapshot> {
    return {
      plan: 'oss',
      features: [...OSS_FEATURE_IDS],
    };
  }
}
