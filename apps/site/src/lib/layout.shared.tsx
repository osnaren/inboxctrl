import { siteConfig } from '@/config/site.config';

import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="brand-link flex items-center gap-2 hover:no-underline">
          <span className="brand-mark" aria-hidden="true" style={{ fontSize: '13px', width: '28px', height: '28px' }}>
            Ic
          </span>
          <span className="text-lg font-semibold">{siteConfig.name} Docs</span>
        </div>
      ),
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
