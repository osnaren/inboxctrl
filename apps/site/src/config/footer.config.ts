import { siteConfig } from '@/config/site.config';

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

type FooterGroup = {
  title: string;
  links: FooterLink[];
};

export const footerGroups = [
  {
    title: 'Product',
    links: [
      { label: 'Docs', href: siteConfig.docsUrl },
      { label: 'Self-host', href: siteConfig.selfHostUrl },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Changelog', href: siteConfig.changelogUrl },
    ],
  },
  {
    title: 'Trust',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Security', href: '/security' },
      { label: 'License', href: siteConfig.licenseUrl, external: true },
      { label: 'GitHub', href: siteConfig.githubUrl, external: true },
    ],
  },
] satisfies FooterGroup[];
