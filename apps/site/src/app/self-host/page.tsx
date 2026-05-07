import Link from 'next/link';

import { Button } from '@inboxctrl/ui/components/button';
import { ArrowRight, Code2 } from 'lucide-react';

import { DetailGrid, PageIntro } from '@/components/content-blocks';
import { siteConfig } from '@/config/site.config';

export const metadata = {
  title: 'Self-host',
};

const items = [
  {
    title: 'Run locally',
    body: 'Use the product app in `apps/web` with SQLite for local-first evaluation and development.',
  },
  {
    title: 'Bring OAuth credentials',
    body: 'Create a Google OAuth web client and match the callback origin to the app URL you run.',
  },
  {
    title: 'Docker comes next',
    body: 'Docker app, demo, and public site templates are the next launch-readiness slice after the site/demo foundation.',
  },
];

export default function SelfHostPage() {
  return (
    <main className="page-content">
      <PageIntro
        title="Self-host InboxCtrl"
        body="The launch path is self-hosted. Public pages send users to source, setup docs, Docker guidance, and demo mode instead of linking into a live mailbox route."
      />
      <div className="section-actions">
        <Button asChild size="lg" className="h-[46px] px-[18px] font-bold">
          <Link href={siteConfig.githubUrl} target="_blank" rel="noreferrer">
            <Code2 aria-hidden="true" />
            View source
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-[46px] px-[18px] font-bold">
          <Link href="/docs">
            Read docs
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <DetailGrid items={items} />
    </main>
  );
}
