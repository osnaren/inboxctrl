import { DetailGrid, PageIntro } from '@/components/content-blocks';

export const metadata = {
  title: 'About',
};

const items = [
  {
    title: 'Local-first control',
    body: 'InboxCtrl is shaped for users who want Gmail organization tools without sending their mailbox workflow through a hosted SaaS by default.',
  },
  {
    title: 'Open boundaries',
    body: 'The public repo owns the OSS app and safe extension points. Private Pro work stays out of the public source tree.',
  },
  {
    title: 'Safety before automation',
    body: 'The product direction favors dry-runs, explicit review, scoped Gmail permissions, rollback metadata, and visible privacy controls.',
  },
];

export default function AboutPage() {
  return (
    <main className="page-content">
      <PageIntro
        title="About InboxCtrl"
        body="InboxCtrl is an open-source control plane for Gmail cleanup, built around self-hosting, review-first actions, and privacy-aware AI."
      />
      <DetailGrid items={items} />
    </main>
  );
}
