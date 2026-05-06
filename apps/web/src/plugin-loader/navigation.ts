import { getPluginNavItems } from './registry';

import type { InboxCtrlNavItem } from '@inboxctrl/plugin-sdk';

export const getMailAutomationNavItems = async (): Promise<InboxCtrlNavItem[]> => {
  const baseItems: InboxCtrlNavItem[] = [
    {
      id: 'filter-builder',
      label: 'Filter Builder',
      href: '/mail/filters',
      icon: 'filter',
      featureId: 'filters.natural-language-draft',
      order: 10,
    },
  ];

  return [...baseItems, ...(await getPluginNavItems())].sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
};
