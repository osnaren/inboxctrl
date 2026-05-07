import { siteConfig } from '@/config/site.config';

type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export const navItems = [
  { label: 'Docs', href: siteConfig.docsUrl },
  { label: 'Self-host', href: siteConfig.selfHostUrl },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Security', href: '/security' },
  { label: 'Changelog', href: siteConfig.changelogUrl },
  { label: 'GitHub', href: siteConfig.githubUrl, external: true },
] satisfies NavItem[];
