import { ScrollReveal } from '@/components/scroll-reveal';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Security architecture and OAuth scopes for InboxCtrl.',
};

export default function SecurityPage() {
  return (
    <main className="page-content">
      <ScrollReveal className="page-intro">
        <h1>Security Architecture</h1>
        <p>
          Security is not an afterthought. InboxCtrl is designed to minimize risk by limiting scopes and explicitly
          staging all actions.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div style={{ maxWidth: '680px', color: 'var(--ink-body)', fontSize: '16px', lineHeight: 1.7 }}>
          <h2 style={{ fontSize: '24px', fontWeight: 650, color: 'var(--ink-heading)', margin: '40px 0 24px' }}>
            OAuth Scopes
          </h2>
          <p style={{ marginBottom: '24px' }}>
            InboxCtrl uses the <code>https://www.googleapis.com/auth/gmail.modify</code> scope by default. We do NOT
            request the full <code>https://mail.google.com/</code> scope because we do not need to permanently delete
            messages (we only send to trash) or manage settings.
          </p>

          <h2 style={{ fontSize: '24px', fontWeight: 650, color: 'var(--ink-heading)', margin: '40px 0 24px' }}>
            Action Staging
          </h2>
          <p style={{ marginBottom: '24px' }}>
            A rogue AI filter could potentially archive or trash your entire inbox. To prevent this, InboxCtrl utilizes
            a dry-run queue.
          </p>
          <ul
            style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <li>
              <strong>Evaluation Phase:</strong> Rules are run against metadata, and intended actions are written to a
              local database queue.
            </li>
            <li>
              <strong>Review Phase:</strong> You review the queue in the dashboard.
            </li>
            <li>
              <strong>Execution Phase:</strong> Only after manual approval are the Gmail API mutation calls actually
              dispatched.
            </li>
          </ul>

          <h2 style={{ fontSize: '24px', fontWeight: 650, color: 'var(--ink-heading)', margin: '40px 0 24px' }}>
            Reporting Vulnerabilities
          </h2>
          <p style={{ marginBottom: '24px' }}>
            If you find a security issue, please email security@inboxctrl.com. We will respond within 48 hours.
          </p>
        </div>
      </ScrollReveal>
    </main>
  );
}
