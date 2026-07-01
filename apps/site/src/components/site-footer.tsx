import Link from 'next/link';

import { footerGroups } from '@/config/footer.config';
import { siteConfig } from '@/config/site.config';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link className="brand-link" href="/">
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
                  key={link.href}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} InboxCtrl. AGPL-3.0 License.</span>
        <span>Built for developers who read the docs first.</span>
      </div>
    </footer>
  );
}
