import type { InboxCtrlFeatureId } from '@inboxctrl/core';

export type LicensePlan = 'oss' | 'extension';

export interface LicenseSnapshot {
  plan: LicensePlan;
  features: InboxCtrlFeatureId[];
  expiresAt?: string;
  activationId?: string;
  signature?: string;
}

export interface LicenseProvider {
  getLicenseSnapshot(): Promise<LicenseSnapshot>;
}
