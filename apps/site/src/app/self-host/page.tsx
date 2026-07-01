import Link from 'next/link';

import { Terminal, Server, ArrowRight } from 'lucide-react';

import { CodeBlock } from '@/components/code-block';
import { ScrollReveal } from '@/components/scroll-reveal';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Self-Host InboxCtrl',
  description: 'Deploy the InboxCtrl engine on your own infrastructure in under 5 minutes.',
};

const dockerCode = `# docker-compose.yml
version: '3.8'
services:
  inboxctrl:
    image: ghcr.io/osnaren/inboxctrl:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./dev.db
      - GOOGLE_CLIENT_ID=\${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=\${GOOGLE_CLIENT_SECRET}
      - BETTER_AUTH_SECRET=\${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=http://localhost:3000
    volumes:
      - ./data:/app/apps/web/prisma/data`;

export default function SelfHostPage() {
  return (
    <main className="page-content">
      <ScrollReveal className="page-intro">
        <h1>Run it on your hardware.</h1>
        <p>
          InboxCtrl is designed to be self-hosted. By running the engine locally or on your own server, you guarantee
          that your email metadata and AI processing never pass through our servers.
        </p>
      </ScrollReveal>

      <ScrollReveal className="detail-grid" stagger={0.1} staggerSelector=".detail-card" delay={0.1}>
        <div className="detail-card">
          <Server className="text-primary mb-4" style={{ color: 'var(--primary-light)', marginBottom: '16px' }} />
          <h2>Docker Support</h2>
          <p>
            Official multi-arch Docker images are published to GHCR. Deploy via Docker Compose, Portainer, or directly
            on a VPS.
          </p>
        </div>
        <div className="detail-card">
          <Terminal className="text-primary mb-4" style={{ color: 'var(--primary-light)', marginBottom: '16px' }} />
          <h2 className="mt-4">Node.js / pnpm</h2>
          <p>Run directly from source using Node 20+ and pnpm. Ideal for local desktop usage or development.</p>
        </div>
      </ScrollReveal>

      <ScrollReveal className="mt-16" delay={0.2} style={{ marginTop: '64px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 650, color: 'var(--ink-heading)', marginBottom: '24px' }}>
          Quick Start (Docker)
        </h2>
        <CodeBlock code={dockerCode} language="yaml" filename="docker-compose.yml" />
        <Link href="/docs/getting-started" className="text-link">
          Read the full self-hosting guide <ArrowRight size={14} />
        </Link>
      </ScrollReveal>
    </main>
  );
}
