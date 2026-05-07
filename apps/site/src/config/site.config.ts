export const siteConfig = {
  name: 'InboxCtrl',
  tagline: 'Open-source Gmail control plane',
  description:
    'Self-host a local-first Gmail control plane for metadata sync, review-first bulk actions, filters, and privacy-aware AI helpers.',
  canonicalUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://inboxctrl.com',
  githubUrl: 'https://github.com/osnaren/inboxctrl',
  docsUrl: '/docs',
  selfHostUrl: '/self-host',
  changelogUrl: '/changelog',
  licenseUrl: 'https://github.com/osnaren/inboxctrl/blob/main/LICENSE',
} as const;
