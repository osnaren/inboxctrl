import Link from 'next/link';

import { Button } from '@inboxctrl/ui/components/button';
import { ArrowRight, Code2 } from 'lucide-react';

import { ProductPreview } from '@/components/product-preview';
import { siteConfig } from '@/config/site.config';

const features = [
  {
    index: '01',
    title: 'Self-hosted by default',
    body: 'Run the product app locally or on your own infrastructure. The public site stays separate from Gmail auth and app APIs.',
  },
  {
    index: '02',
    title: 'Review-first control',
    body: 'Sync metadata, preview matches, stage label and archive actions, and keep rollback context before changes touch Gmail.',
  },
  {
    index: '03',
    title: 'Demo-safe launch path',
    body: 'Demo mode is planned as a real runtime adapter with deterministic data and hard guards against real Gmail calls.',
  },
] as const;

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-product-layer" aria-hidden="true">
          <ProductPreview />
        </div>
        <div className="hero-copy">
          <h1>{siteConfig.name}</h1>
          <p>{siteConfig.description}</p>
          <div className="hero-actions">
            <Button asChild size="lg" className="h-[46px] px-[18px] font-bold">
              <Link href={siteConfig.githubUrl} target="_blank" rel="noreferrer">
                <Code2 aria-hidden="true" />
                View on GitHub
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-[46px] px-[18px] font-bold">
              <Link href={siteConfig.selfHostUrl}>
                Self-host guide
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-heading">
            <h2>Launch foundation for local Gmail control.</h2>
            <p>
              InboxCtrl keeps the public site, self-host product app, docs, demo mode, and future Pro work in separate
              lanes so launch users see only what is ready.
            </p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <strong>{feature.index}</strong>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
