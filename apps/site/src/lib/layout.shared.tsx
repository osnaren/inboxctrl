import { siteConfig } from '@/config/site.config';

import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: siteConfig.name,
      url: '/',
    },
    links: [
      {
        text: 'Self-host',
        url: '/self-host',
      },
      {
        text: 'GitHub',
        url: siteConfig.githubUrl,
        external: true,
      },
    ],
  };
}
