import Link from 'next/link';

import { footerGroups } from '@/config/footer.config';
import { siteConfig } from '@/config/site.config';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="brand-link" href="/" aria-label="InboxCtrl home">
          <span className="brand-mark" aria-hidden="true">
            Ic
          </span>
          <span>{siteConfig.name}</span>
        </Link>
        <p>{siteConfig.description}</p>
      </div>
      <div className="footer-link-grid">
        {footerGroups.map((group) => (
          <div className="footer-link-group" key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map((link) => (
              <Link
                href={link.href}
                key={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noreferrer' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
