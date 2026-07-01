# Product

## Register

brand

## Users

Self-host developers evaluating Gmail automation tools. Privacy-conscious Gmail power users who want control over their inbox without handing email data to SaaS. Indie hackers comparing against Inbox Zero, Clean Email, and similar. They care about OAuth scopes, Docker setup, BYOK AI, and where their data lives. They read docs before they click "Get Started." They judge a project by its README, its Docker command, and whether the landing page loads fast.

## Product Purpose

InboxCtrl is an open-source, self-hosted Gmail control plane. It exists because Gmail's native filters are primitive, SaaS inbox tools require trusting a third party with full email access, and power users want metadata-first cleanup with rollback safety. Success looks like: a developer visits the site, reads the Docker command, runs it, connects Gmail with minimal scopes, and has their inbox triaged with AI-suggested labels within 5 minutes — without their email body ever being stored.

## Brand Personality

**Confident, Clean, Powerful.**

The voice is precise and direct. It doesn't oversell, hedge, or use marketing superlatives. It speaks to someone who already knows what a Gmail OAuth scope is and just wants to know if this tool respects their data. Technical credibility is earned through specificity — showing real Docker commands, real scope names, real architecture decisions — not through vague claims about "AI-powered inbox zero."

Anti-personality: not cute, not hacker-edgy, not startup-hype, not corporate-safe.

## Anti-references

- **Generic SaaS landing page** — Stripe/Notion/Vercel-style minimal with gradient blobs, feature card grids, and "Trusted by 10,000+ teams" social proof strips. The AI default.
- **Terminal-green hacker cliché** — monospace everything, matrix rain, `>_` cursor blinking, pretending a GUI tool is a CLI. Costume, not identity.
- **AI vaporware** — giant 3D abstract shapes, "Powered by GPT-5" badges, no actual product screenshots or commands. Developers smell nonsense fast.
- **Cream/sand/beige warm SaaS** — the 2025-2026 AI-generated default background. Not appropriate for a control tool.

## Design Principles

1. **Privacy is the architecture, not a feature.** Metadata-first storage, incremental OAuth scopes, BYOK AI, self-hosted by default. The design should make this visible and concrete — not buried in a privacy page.

2. **Earn trust with specificity.** Show the Docker command. Name the OAuth scopes. Explain what's stored and what isn't. Developers trust what they can verify, not what's marketed.

3. **The product is a power tool.** Design serves the workflow. Dense where density helps (data tables, filter rules, label trees). Spacious where clarity matters (settings, onboarding, empty states). Linear and Raycast are the bar for tool-native polish.

4. **WebGL is atmosphere, not spectacle.** The cinematic layer supports the message — emails flowing through rules, labels organizing, AI suggesting. It never blocks the Docker command or loads slower than the page content.

5. **Motion is intentional, not decorative.** Every animation serves a purpose: state change, feedback, spatial orientation. Reduced motion is always supported. No bounce, no elastic, no "look at me" entrance choreography on the landing page.

## Accessibility & Inclusion

- WCAG AA compliance target for both site and product app
- All body text ≥ 4.5:1 contrast against background (critical on dark themes)
- All interactive elements keyboard-navigable
- `prefers-reduced-motion` respected — crossfade or instant alternatives for all animations
- Dark theme contrast verified against deep navy backgrounds (not pure black)
