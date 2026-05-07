import Link from 'next/link';

import { Code2 } from 'lucide-react';

import { navItems } from '@/config/nav.config';
import { siteConfig } from '@/config/site.config';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand-link" href="/" aria-label="InboxCtrl home">
        <span className="brand-mark" aria-hidden="true">
          Ic
        </span>
        <span>{siteConfig.name}</span>
      </Link>
      <nav className="site-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            className="nav-link"
            href={item.href}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noreferrer' : undefined}
          >
            {item.label === 'GitHub' ? <Code2 aria-hidden="true" /> : null}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
