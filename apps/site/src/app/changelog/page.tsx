import { DetailGrid, PageIntro } from '@/components/content-blocks';

export const metadata = {
  title: 'Changelog',
};

const entries = [
  {
    title: 'OSS app boundary',
    body: 'The self-host product app lives in `apps/web`; public site work now moves into `apps/site`.',
  },
  {
    title: 'AI and privacy hardening',
    body: 'BYOK settings, privacy controls, full-body AI gates, provider-aware routing, and safer rollback behavior were validated before this launch slice.',
  },
  {
    title: 'Launch foundation underway',
    body: 'Current work focuses on public site, docs, static search, shared UI primitives, demo mode, and public boundary checks.',
  },
];

export default function ChangelogPage() {
  return (
    <main className="page-content">
      <PageIntro title="Changelog" body="A concise launch-focused record of what changed and what is still deferred." />
      <DetailGrid items={entries} />
    </main>
  );
}
