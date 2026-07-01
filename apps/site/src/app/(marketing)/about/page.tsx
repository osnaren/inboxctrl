import { ScrollReveal } from '@/components/scroll-reveal';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About InboxCtrl',
  description: 'The story behind InboxCtrl and our mission to build a privacy-first Gmail client.',
};

export default function AboutPage() {
  return (
    <main className="page-content">
      <ScrollReveal className="page-intro">
        <h1>Built for developers who value privacy.</h1>
        <p>
          InboxCtrl started from a simple frustration: every powerful email client or AI automation tool required
          handing over full read/write access to my inbox to a third-party server.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div style={{ maxWidth: '680px', color: 'var(--ink-body)', fontSize: '16px', lineHeight: 1.7 }}>
          <p style={{ marginBottom: '24px' }}>
            When you grant an app the <code>https://mail.google.com/</code> scope, you are trusting them with your
            entire digital life. Bank statements, password resets, personal conversations — everything.
          </p>
          <p style={{ marginBottom: '24px' }}>
            We believe you shouldn&apos;t have to choose between modern AI capabilities and data sovereignty. By
            utilizing a local-first architecture and bringing-your-own-keys (BYOK) for AI, InboxCtrl provides the
            automation power of enterprise tools without the privacy compromises.
          </p>
          <h2 style={{ fontSize: '24px', fontWeight: 650, color: 'var(--ink-heading)', margin: '48px 0 24px' }}>
            Open Core Philosophy
          </h2>
          <p style={{ marginBottom: '24px' }}>
            The core engine of InboxCtrl will always remain AGPL-3.0 licensed and open source. If you have the technical
            skills, you can run it entirely for free. Our business model relies on offering managed cloud hosting and
            team features for those who prefer convenience.
          </p>
        </div>
      </ScrollReveal>
    </main>
  );
}
