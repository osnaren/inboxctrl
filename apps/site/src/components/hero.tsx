import Link from 'next/link';

import { Terminal, Shield, Key, Eye, GitBranch, Server } from 'lucide-react';

import { GithubIcon } from '@/components/github-icon';
import { HeroWebGL } from '@/components/hero-webgl';
import { ProductPreview } from '@/components/product-preview';
import { siteConfig } from '@/config/site.config';

const trustBadges = [
  { label: 'Self-hosted', icon: Server },
  { label: 'BYOK AI', icon: Key },
  { label: 'No body storage', icon: Shield },
  { label: 'Filter dry-run', icon: Eye },
  { label: 'Open-source', icon: GitBranch },
] as const;

export function Hero() {
  return (
    <section className="hero-dark">
      <HeroWebGL />
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-dark-content">
        {/* Left: Text */}
        <div className="hero-text">
          <div className="hero-badge">
            <span className="hero-badge-dot" aria-hidden="true" />
            Open-source Gmail control center
          </div>
          <h1 className="hero-dark-heading">
            <span className="hero-heading-gradient">Take control of your Gmail inbox.</span>
          </h1>
          <p className="hero-dark-body">
            Self-hosted, privacy-first inbox automation. AI-powered labels, safe bulk actions, and filter dry-runs —
            your data never leaves your infrastructure.
          </p>
          <div className="hero-dark-actions">
            <Link href="/docs/getting-started" className="btn-glow">
              <Terminal size={16} /> Get Started
            </Link>
            <Link href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer" className="btn-outline">
              <GithubIcon size={16} /> View on GitHub
            </Link>
          </div>
          <div className="hero-trust" role="list" aria-label="Key features">
            {trustBadges.map((badge, i) => (
              <span key={i} className="hero-trust-badge" role="listitem">
                <badge.icon size={12} /> {badge.label}
              </span>
            ))}
          </div>
        </div>
        {/* Right: Product Preview */}
        <div className="hero-preview-col">
          <ProductPreview />
        </div>
      </div>
      <div className="hero-gradient-line" aria-hidden="true" />
    </section>
  );
}
