'use client';

import { useState } from 'react';

const PACKAGES = [
  { id: 'starter', name: 'Starter', credits: 5, price: 9, perCredit: '1.80', popular: false, timeSaved: '~5 hours', emoji: '⚡' },
  { id: 'growth',  name: 'Growth',  credits: 10, price: 15, perCredit: '1.50', popular: true,  timeSaved: '~10 hours', emoji: '🚀' },
  { id: 'pro',     name: 'Pro',     credits: 25, price: 29, perCredit: '1.16', popular: false, timeSaved: '~25 hours', emoji: '💎' },
] as const;

export default function CreditsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(packageId: 'starter' | 'growth' | 'pro') {
    setLoading(packageId);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'Failed to start checkout');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Buy Credits 💳
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          Each credit generates 15 posts (3 per platform × 5 platforms) from one URL.
        </p>
      </div>

      {error && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '0.875rem 1.25rem',
          borderRadius: '0.75rem',
          background: 'rgba(248, 113, 113, 0.1)',
          border: '1px solid rgba(248, 113, 113, 0.2)',
          color: 'var(--error)',
          fontSize: '0.875rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Pricing cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', maxWidth: '900px' }}>
        {PACKAGES.map((pack) => (
          <div
            key={pack.name}
            className="card"
            style={{
              padding: '2rem',
              border: pack.popular ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              position: 'relative',
              background: pack.popular ? 'var(--accent-glow)' : 'var(--bg-card)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            {pack.popular && (
              <div style={{
                position: 'absolute',
                top: '-0.625rem',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '0.25rem 0.75rem',
                borderRadius: '2rem',
                background: 'var(--accent-gradient)',
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'white',
                whiteSpace: 'nowrap',
              }}>
                Most Popular
              </div>
            )}

            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{pack.emoji} {pack.name}</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '2.25rem', fontWeight: 800 }} className="text-gradient">£{pack.price}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {pack.credits} credits · £{pack.perCredit} per credit
            </p>
            <ul style={{ listStyle: 'none', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>✓ {pack.credits * 15} total posts</li>
              <li style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>✓ All 5 platforms</li>
              <li style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>✓ 3 variations per platform</li>
              <li style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>✓ No credit on failed scrapes</li>
              <li style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>⏱ Saves you {pack.timeSaved}</li>
            </ul>
            <button
              id={`buy-${pack.id}`}
              className={pack.popular ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ width: '100%', opacity: loading && loading !== pack.id ? 0.6 : 1 }}
              onClick={() => handleCheckout(pack.id)}
              disabled={loading !== null}
            >
              {loading === pack.id ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: '14px', height: '14px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.6s linear infinite',
                  }} />
                  Redirecting…
                </span>
              ) : (
                `Buy ${pack.name} — £${pack.price}`
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Unlimited subscription coming soon */}
      <div
        className="card"
        style={{
          marginTop: '1.5rem',
          maxWidth: '900px',
          padding: '1.5rem 2rem',
          border: '1px dashed var(--accent-primary)',
          background: 'var(--accent-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
            ♾️ Unlimited Subscription
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Unlimited credits, priority generation, and more. We&apos;re building it now.
          </p>
        </div>
        <span style={{
          padding: '0.375rem 1rem',
          borderRadius: '2rem',
          background: 'var(--accent-gradient)',
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'white',
          whiteSpace: 'nowrap',
        }}>
          Coming Soon
        </span>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1.5rem' }}>
        🔒 Payments are processed securely by Stripe. We never store your card details.
      </p>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
