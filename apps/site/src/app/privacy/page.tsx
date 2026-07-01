import { Shield, Database, Trash2 } from 'lucide-react';

import { ScrollReveal } from '@/components/scroll-reveal';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How InboxCtrl handles your data.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="page-content">
      <ScrollReveal className="page-intro">
        <h1>Privacy Policy</h1>
        <p>Last updated: June 2026</p>
      </ScrollReveal>

      <ScrollReveal delay={0.1} className="detail-grid" stagger={0.1} staggerSelector=".detail-card">
        <div className="detail-card">
          <Database className="text-primary mb-4" style={{ color: 'var(--primary-light)', marginBottom: '16px' }} />
          <h2>Local Metadata Only</h2>
          <p>We only store thread IDs, subjects, and timestamps in your local database. We actively strip bodies.</p>
        </div>
        <div className="detail-card">
          <Shield className="text-primary mb-4" style={{ color: 'var(--primary-light)', marginBottom: '16px' }} />
          <h2>No Telemetry</h2>
          <p>The open-source engine contains zero telemetry. We do not track your rules, usage, or email volume.</p>
        </div>
        <div className="detail-card">
          <Trash2 className="text-primary mb-4" style={{ color: 'var(--primary-light)', marginBottom: '16px' }} />
          <h2>Ephemeral AI</h2>
          <p>
            Text sent to OpenAI/Anthropic is not retained by us, and we configure the SDKs to opt-out of model training.
          </p>
        </div>
      </ScrollReveal>
    </main>
  );
}
