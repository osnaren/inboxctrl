import { pricingPlans } from '@/config/pricing.config';

export const metadata = {
  title: 'Pricing',
};

export default function PricingPage() {
  return (
    <main className="page-content">
      <section className="page-intro">
        <h1>Pricing</h1>
        <p>InboxCtrl launches as free OSS. Pro and Cloud are roadmap items, not currently available hosted products.</p>
      </section>
      <section className="pricing-grid" aria-label="Pricing options">
        {pricingPlans.map((plan) => (
          <article className="pricing-card" key={plan.name}>
            <strong>{plan.price}</strong>
            <h2>{plan.name}</h2>
            <p>{plan.summary}</p>
            <ul>
              {plan.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
