import { Building2, CheckCircle2 } from 'lucide-react';

import { ScrollReveal } from '@/components/scroll-reveal';

export function ProFutureSection() {
  return (
    <section className="section" id="pricing">
      <ScrollReveal className="section-inner">
        <div className="section-label">
          <Building2 /> Roadmap & Licensing
        </div>
        <div className="section-heading">
          <h2>Open core, sustainable future.</h2>
          <p>
            The InboxCtrl engine is free and open-source. For teams and power users wanting zero-setup, we will offer a
            managed cloud option.
          </p>
        </div>

        <ScrollReveal as="div" className="pro-grid" stagger={0.15} staggerSelector=".pro-card" delay={0.2}>
          {/* OSS */}
          <div className="pro-card">
            <span className="pro-card-badge free">Free Forever</span>
            <h3>Self-Hosted</h3>
            <p>Run InboxCtrl on your own hardware or cloud provider. Full data sovereignty.</p>
            <ul className="pro-card-features">
              <li>
                <CheckCircle2 /> AGPL-3.0 License
              </li>
              <li>
                <CheckCircle2 /> Unlimited rules & filters
              </li>
              <li>
                <CheckCircle2 /> Local SQLite / Postgres
              </li>
              <li>
                <CheckCircle2 /> Community support
              </li>
            </ul>
          </div>

          {/* Cloud (Future) */}
          <div className="pro-card featured">
            <span className="pro-card-badge planned">Coming Soon</span>
            <h3>Cloud Pro</h3>
            <p>Fully managed hosting for individuals who want zero setup and immediate access.</p>
            <ul className="pro-card-features">
              <li>
                <CheckCircle2 /> 1-click Google OAuth
              </li>
              <li>
                <CheckCircle2 /> Always-on background sync
              </li>
              <li>
                <CheckCircle2 /> Included AI credits
              </li>
              <li>
                <CheckCircle2 /> Priority email support
              </li>
            </ul>
          </div>

          {/* Teams (Future) */}
          <div className="pro-card">
            <span className="pro-card-badge future">Future</span>
            <h3>Teams & Workspaces</h3>
            <p>Shared inboxes, team rules, and organization-wide label management.</p>
            <ul className="pro-card-features">
              <li>
                <CheckCircle2 /> Shared AI rules
              </li>
              <li>
                <CheckCircle2 /> Audit logs
              </li>
              <li>
                <CheckCircle2 /> SAML / SSO
              </li>
              <li>
                <CheckCircle2 /> Custom integrations
              </li>
            </ul>
          </div>
        </ScrollReveal>
      </ScrollReveal>
    </section>
  );
}
