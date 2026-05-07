export const pricingPlans = [
  {
    name: 'OSS',
    price: 'Free',
    summary: 'Self-hosted and local-first.',
    items: ['Gmail metadata sync', 'Review-first bulk actions', 'Filter dry-runs', 'BYOK AI settings'],
  },
  {
    name: 'Pro',
    price: 'Planned',
    summary: 'Future private extensions.',
    items: ['Advanced recipes', 'Sender intelligence', 'XML import/export', 'License-gated plugins'],
  },
  {
    name: 'Cloud',
    price: 'Future',
    summary: 'Not available for launch.',
    items: ['Hosted operations are not implied', 'Self-host remains the launch path', 'Roadmap depends on demand'],
  },
] as const;
