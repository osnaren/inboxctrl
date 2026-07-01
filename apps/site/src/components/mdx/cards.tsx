import type { ReactNode } from 'react';

import Link from 'next/link';

import { ArrowUpRight } from 'lucide-react';

export function Cards({ children }: { children: ReactNode }) {
  return <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

type CardProps = {
  title: string;
  href: string;
  children: ReactNode;
  icon?: ReactNode;
};

export function Card({ title, href, children, icon }: CardProps) {
  const isExternal = href.startsWith('http');

  const content = (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-[var(--primary-light)]">{icon}</span>}
          <h3 className="m-0 text-[15px] font-semibold text-[var(--prose-heading)]">{title}</h3>
        </div>
        {isExternal && <ArrowUpRight size={16} className="text-[var(--fd-muted-foreground)]" />}
      </div>
      <p className="m-0 line-clamp-3 text-[14px] text-[var(--prose-body)]">{children}</p>
    </>
  );

  const className =
    'group relative flex h-full flex-col rounded-xl border border-[var(--fd-border)] bg-[var(--fd-card)] p-5 transition-all hover:border-[var(--card-hover-border)] hover:shadow-[var(--card-hover-shadow)] hover:-translate-y-0.5 no-underline';

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
