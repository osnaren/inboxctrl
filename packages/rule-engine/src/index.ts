import type { MailFilterCriteria } from '@inboxctrl/core';

export interface BasicRuleOverlap {
  field: keyof MailFilterCriteria;
  value: string;
}
