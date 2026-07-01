import { Shield, Key, Database, Lock } from 'lucide-react';

import { ScrollReveal } from '@/components/scroll-reveal';

const features = [
  {
    title: 'No message bodies',
    desc: 'The database only stores thread metadata (subjects, senders, timestamps). Full message bodies are never written to disk.',
    icon: Database,
    accent: false,
  },
  {
    title: 'Bring your own keys',
    desc: 'Configure your own OpenAI or Anthropic API keys. Your data is sent directly to the provider, never proxied through us.',
    icon: Key,
    accent: true,
  },
  {
    title: 'Restricted scopes',
    desc: 'InboxCtrl requests the minimum required Gmail permissions. We actively avoid requesting full mail scope.',
    icon: Lock,
    accent: false,
  },
  {
    title: 'Dry-run by default',
    desc: 'All destructive actions (archive, trash, label) are staged in a queue. Nothing happens until you click approve.',
    icon: Shield,
    accent: false,
  },
];

export function PrivacySection() {
  return (
    <section className="section" id="privacy">
      <ScrollReveal className="section-inner">
        <div className="section-label">
          <Shield /> Privacy Architecture
        </div>
        <div className="section-heading">
          <h2>Privacy is the architecture.</h2>
          <p>
            Most email tools require full access to your inbox and store your data on their servers. InboxCtrl runs on
            your infrastructure.
          </p>
        </div>

        <ScrollReveal as="div" className="privacy-grid" stagger={0.1} staggerSelector=".privacy-item" delay={0.2}>
          {features.map((feature, i) => (
            <div key={i} className="privacy-item">
              <div className={`privacy-item-icon ${feature.accent ? 'accent' : ''}`}>
                <feature.icon />
              </div>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            </div>
          ))}
        </ScrollReveal>
      </ScrollReveal>
    </section>
  );
}
