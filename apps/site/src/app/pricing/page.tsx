import Link from 'next/link';

import { CheckCircle2 } from 'lucide-react';

import { ScrollReveal } from '@/components/scroll-reveal';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'InboxCtrl is free and open-source. Cloud hosting is coming soon.',
};

export default function PricingPage() {
  return (
    <main className="page-content">
      <ScrollReveal className="page-intro">
        <h1>Simple, transparent pricing.</h1>
        <p>
          The core InboxCtrl engine will always be free and open-source. For teams and individuals who want zero setup,
          our managed cloud platform is in development.
        </p>
      </ScrollReveal>

      <ScrollReveal as="div" className="pricing-grid" stagger={0.15} staggerSelector=".pricing-card" delay={0.2}>
        {/* OSS */}
        <div className="pricing-card">
          <span className="pricing-card-badge free">Free Forever</span>
          <h2>Self-Hosted</h2>
          <span className="price">$0</span>
          <p>Run InboxCtrl on your own hardware. Full data sovereignty and control.</p>
          <ul>
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
              <CheckCircle2 /> Bring your own LLM key
            </li>
            <li>
              <CheckCircle2 /> Community support
            </li>
          </ul>
          <div className="section-actions">
            <Link
              href="/docs/getting-started"
              className="btn-outline"
              style={{ width: '100%', marginTop: '16px', display: 'inline-block', textAlign: 'center' }}
            >
              View Docs
            </Link>
          </div>
        </div>

        {/* Cloud (Future) */}
        <div className="pricing-card featured">
          <span className="pricing-card-badge planned">Coming Soon</span>
          <h2>Cloud Pro</h2>
          <span className="price">
            $12<span style={{ fontSize: '16px', color: 'var(--ink-muted)' }}>/mo</span>
          </span>
          <p>Fully managed hosting. Zero setup, always-on background sync.</p>
          <ul>
            <li>
              <CheckCircle2 /> Everything in Self-Hosted
            </li>
            <li>
              <CheckCircle2 /> 1-click Google OAuth
            </li>
            <li>
              <CheckCircle2 /> Always-on background sync
            </li>
            <li>
              <CheckCircle2 /> Included AI credits ($5/mo limit)
            </li>
            <li>
              <CheckCircle2 /> Priority email support
            </li>
          </ul>
          <div className="section-actions">
            <button className="btn-glow" style={{ width: '100%', marginTop: '16px' }}>
              Join Waitlist
            </button>
          </div>
        </div>

        {/* Teams (Future) */}
        <div className="pricing-card">
          <span className="pricing-card-badge future">Future</span>
          <h2>Teams</h2>
          <span className="price">
            $29<span style={{ fontSize: '16px', color: 'var(--ink-muted)' }}>/user</span>
          </span>
          <p>Shared inboxes, team rules, and organization-wide label management.</p>
          <ul>
            <li>
              <CheckCircle2 /> Everything in Cloud Pro
            </li>
            <li>
              <CheckCircle2 /> Shared AI rules
            </li>
            <li>
              <CheckCircle2 /> Audit logs & retention
            </li>
            <li>
              <CheckCircle2 /> SAML / SSO
            </li>
            <li>
              <CheckCircle2 /> Dedicated success manager
            </li>
          </ul>
          <div className="section-actions">
            <button className="btn-outline" style={{ width: '100%', marginTop: '16px' }}>
              Contact Sales
            </button>
          </div>
        </div>
      </ScrollReveal>
    </main>
  );
}
