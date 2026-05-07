import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

type DetailItem = {
  title: string;
  body: string;
};

type PageIntroProps = {
  title: string;
  body: string;
  cta?: {
    label: string;
    href: string;
  };
};

export function PageIntro({ body, cta, title }: PageIntroProps) {
  return (
    <section className="page-intro">
      <h1>{title}</h1>
      <p>{body}</p>
      {cta ? (
        <Link className="text-link" href={cta.href}>
          {cta.label}
          <ArrowRight aria-hidden="true" />
        </Link>
      ) : null}
    </section>
  );
}

export function DetailGrid({ items }: { items: DetailItem[] }) {
  return (
    <section className="detail-grid">
      {items.map((item) => (
        <article className="detail-card" key={item.title}>
          <h2>{item.title}</h2>
          <p>{item.body}</p>
        </article>
      ))}
    </section>
  );
}
