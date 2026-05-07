import { DetailGrid, PageIntro } from '@/components/content-blocks';

export const metadata = {
  title: 'Security',
};

const items = [
  {
    title: 'Scoped Gmail access',
    body: 'Read-only, organizer, and settings/filter modes keep Gmail access tied to the workflow that needs it.',
  },
  {
    title: 'Public site boundary',
    body: 'The public site must not import app-only Gmail, auth, database, sync, AI secret, or product route code.',
  },
  {
    title: 'Demo hard guard',
    body: 'Demo mode is planned to throw `DEMO_MODE_REAL_GMAIL_BLOCKED` below route handlers if real Gmail code is constructed.',
  },
];

export default function SecurityPage() {
  return (
    <main className="page-content">
      <PageIntro
        title="Security"
        body="Launch safety depends on clear app boundaries, explicit permission modes, and runtime guards that live below the UI."
      />
      <DetailGrid items={items} />
    </main>
  );
}
