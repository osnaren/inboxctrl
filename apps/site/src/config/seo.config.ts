import { siteConfig } from '@/config/site.config';

import type { Metadata } from 'next';

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.canonicalUrl),
  title: {
    default: `${siteConfig.name} - ${siteConfig.tagline}`,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} - ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: siteConfig.canonicalUrl,
    siteName: siteConfig.name,
    type: 'website',
  },
};
