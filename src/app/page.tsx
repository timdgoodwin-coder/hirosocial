'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FacebookLogo, TwitterLogo, LinkedInLogo, InstagramLogo, ThreadsLogo } from '@/components/PlatformLogos';

export default function HomePage() {
  const [trialEmail, setTrialEmail] = useState('');
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState('');
  const [trialSuccess, setTrialSuccess] = useState(false);
  const [trialEmailFailed, setTrialEmailFailed] = useState(false);

  const handleTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrialLoading(true);
    setTrialError('');

    try {
      const res = await fetch('/api/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trialEmail }),
      });

      const data = await res.json();

      if (!data.success) {
        setTrialError(data.error);
        setTrialLoading(false);
        return;
      }

      setTrialSuccess(true);
      setTrialEmailFailed(!!data.emailFailed);
      setTrialLoading(false);
    } catch {
      setTrialError('Something went wrong. Please try again.');
      setTrialLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 10, 26, 0.8)',
      }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span className="text-gradient">Hiro</span>
          <span style={{ color: 'var(--text-primary)' }}>Social</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/login" className="btn btn-ghost">Log In</Link>
          <a href="#free-trial" className="btn btn-primary">Get Started</a>
        </div>
      </nav>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '2rem',
          background: 'var(--accent-glow)',
          border: '1px solid var(--border-accent)',
          fontSize: '0.8rem',
          fontWeight: 500,
          color: 'var(--accent-primary-hover)',
          marginBottom: '2rem',
        }}>
          ✨ Powered by AI
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          maxWidth: '800px',
          marginBottom: '1.5rem',
        }}>
          One Article.{' '}
          <span className="text-gradient">Fifteen Posts.</span>{' '}
          Five Platforms.
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-secondary)',
          maxWidth: '560px',
          lineHeight: 1.7,
          marginBottom: '2.5rem',
        }}>
          Drop in a blog URL and get polished, ready-to-publish social media content for Facebook, Twitter, LinkedIn, Instagram, and Threads — in seconds.
        </p>

        {/* Try for Free CTA */}
        <div id="free-trial" className="card" style={{
          maxWidth: '520px',
          width: '100%',
          padding: '2rem',
          border: '1px solid var(--border-accent)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.06) 100%)',
          boxShadow: '0 0 60px rgba(99, 102, 241, 0.1)',
          marginBottom: '1.5rem',
          scrollMarginTop: '5rem',
        }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '2rem',
              background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(52, 211, 153, 0.05))',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--success)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem',
            }}>
              🎁 1 Free Credit — No Card Required
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.35rem' }}>
              Try it <span className="text-gradient">free</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Enter your email — we&apos;ll create your account and send you a magic link to get started instantly.
            </p>
          </div>

          {trialSuccess ? (
            <div style={{
              padding: '1.25rem',
              borderRadius: '0.75rem',
              background: trialEmailFailed ? 'rgba(251, 191, 36, 0.1)' : 'rgba(52, 211, 153, 0.1)',
              border: trialEmailFailed ? '1px solid rgba(251, 191, 36, 0.25)' : '1px solid rgba(52, 211, 153, 0.25)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{trialEmailFailed ? '✅' : '✉️'}</div>
              {trialEmailFailed ? (
                <>
                  <p style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                    Account created with 1 free credit!
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    We couldn&apos;t send the sign-in email right now.
                    Head to the login page to request a magic link.
                  </p>
                  <Link
                    href="/login"
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Go to Login →
                  </Link>
                </>
              ) : (
                <>
                  <p style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>
                    Account created — check your inbox!
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>
                    We sent a magic link to <strong style={{ color: 'var(--text-primary)' }}>{trialEmail}</strong>.
                    Click it to sign in and use your free credit.
                  </p>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleTrial}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  id="trial-email"
                  type="email"
                  className="input"
                  placeholder="Your email address"
                  value={trialEmail}
                  onChange={(e) => setTrialEmail(e.target.value)}
                  required
                  style={{ fontSize: '0.9rem' }}
                />
                {trialError && (
                  <div style={{
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(248, 113, 113, 0.1)',
                    border: '1px solid rgba(248, 113, 113, 0.2)',
                    color: 'var(--error)',
                    fontSize: '0.8rem',
                  }}>
                    {trialError}
                  </div>
                )}
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={trialLoading}
                  style={{ width: '100%', fontSize: '0.95rem' }}
                >
                  {trialLoading ? (
                    <div className="spinner" />
                  ) : (
                    '✉️ Get My Free Credit →'
                  )}
                </button>
              </div>
            </form>
          )}

          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.85rem', lineHeight: 1.5 }}>
            No password. No credit card. Just your email — we&apos;ll send you a magic sign-in link.
          </p>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent-primary-hover)', textDecoration: 'none', fontWeight: 500 }}>
            Log in
          </Link>
        </p>

        {/* Platform logos */}
        <div style={{
          display: 'flex',
          gap: '2.5rem',
          marginTop: '3rem',
          padding: '1.5rem 2.5rem',
          borderRadius: '1rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
        }}>
          {[
            { name: 'Facebook', Logo: FacebookLogo, color: '#1877F2' },
            { name: 'Twitter / X', Logo: TwitterLogo, color: '#ffffff' },
            { name: 'LinkedIn', Logo: LinkedInLogo, color: '#0A66C2' },
            { name: 'Instagram', Logo: InstagramLogo, color: '#E4405F' },
            { name: 'Threads', Logo: ThreadsLogo, color: '#ffffff' },
          ].map((platform) => (
            <div key={platform.name} className="platform-logo-item" style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${platform.color}12`,
                border: `1px solid ${platform.color}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.5rem',
                transition: 'all 0.3s ease',
                margin: '0 auto 0.5rem',
              }}>
                <platform.Logo size={22} color={platform.color} />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{platform.name}</div>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '5rem',
          maxWidth: '900px',
          width: '100%',
        }}>
          {[
            { icon: '🎯', title: 'Source-Faithful', desc: 'Every post is based directly on your article content. No fabrication, no clickbait.' },
            { icon: '🎨', title: 'Tone Control', desc: 'Choose from professional, casual, witty, authoritative, or inspirational tone.' },
            { icon: '🌐', title: 'US & UK English', desc: 'Toggle between American and British spelling with one click.' },
          ].map((feature) => (
            <div key={feature.title} className="card card-hover" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{feature.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.05rem' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing section */}
        <div style={{ marginTop: '6rem', width: '100%', maxWidth: '900px' }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            marginBottom: '0.75rem',
          }}>
            Simple, <span className="text-gradient">Transparent</span> Pricing
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            marginBottom: '2.5rem',
            maxWidth: '500px',
            margin: '0 auto 2.5rem',
          }}>
            No subscriptions required. Buy credits and use them whenever you need.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {[
              { name: 'Starter', credits: 5, price: 9, perCredit: '1.80', popular: false, timeSaved: '~5 hours', emoji: '⚡' },
              { name: 'Growth', credits: 10, price: 15, perCredit: '1.50', popular: true, timeSaved: '~10 hours', emoji: '🚀' },
              { name: 'Pro', credits: 25, price: 29, perCredit: '1.16', popular: false, timeSaved: '~25 hours', emoji: '💎' },
            ].map((pack) => (
              <div
                key={pack.name}
                className="card"
                style={{
                  padding: '2rem',
                  border: pack.popular ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  position: 'relative',
                  background: pack.popular ? 'var(--accent-glow)' : 'var(--bg-card)',
                  textAlign: 'left',
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
                <a
                  href="#free-trial"
                  className={pack.popular ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ width: '100%', textAlign: 'center', display: 'block' }}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>

          {/* Unlimited subscription teaser */}
          <div
            className="card"
            style={{
              marginTop: '1.5rem',
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
            <div style={{ textAlign: 'left' }}>
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
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
      }}>
        © 2026 HiroSocial.com. All rights reserved.
      </footer>
    </div>
  );
}
