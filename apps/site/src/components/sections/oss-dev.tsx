import Link from 'next/link';

import { Terminal } from 'lucide-react';

import { CodeBlock } from '@/components/code-block';
import { GithubIcon } from '@/components/github-icon';
import { ScrollReveal } from '@/components/scroll-reveal';
import { siteConfig } from '@/config/site.config';

const codeExample = `# 1. Clone the repository
git clone https://github.com/osnaren/inboxctrl.git
cd inboxctrl

# 2. Set up environment
cp apps/web/.env.example apps/web/.env
# Edit .env with your Google Client ID/Secret

# 3. Install & run
pnpm install
pnpm db:generate
pnpm db:push
pnpm dev`;

export function OssDevSection() {
  return (
    <section className="section oss-section" id="developer">
      <ScrollReveal className="section-inner">
        <div className="section-label">
          <Terminal /> Open Source
        </div>

        <div className="oss-grid">
          <div className="oss-text">
            <h2>Self-host in minutes.</h2>
            <p>
              Built on a modern Next.js 15 App Router stack with React 19, Better Auth, and Prisma. We provide clear
              documentation for self-hosting on your own hardware or cloud provider.
            </p>
            <p>The entire core engine is AGPL-3.0 licensed and open source. Extend it, inspect it, own it.</p>
            <div className="oss-text-links">
              <Link href="/docs/getting-started" className="oss-text-link">
                Read the docs →
              </Link>
              <Link href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer" className="oss-text-link">
                <GithubIcon size={16} /> GitHub Repo
              </Link>
            </div>
          </div>

          <div className="oss-code">
            <CodeBlock code={codeExample} language="bash" filename="Terminal" />
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
