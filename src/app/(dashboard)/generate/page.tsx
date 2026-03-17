'use client';

import { useState } from 'react';
import { Tone, Language, TONES, GenerateResponse, GenerateErrorResponse } from '@/lib/types';
import { ResultsView } from './ResultsView';

export default function GeneratePage() {
  const [url, setUrl] = useState('');
  const [tone, setTone] = useState<Tone>('professional');
  const [language, setLanguage] = useState<Language>('US');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<GenerateResponse | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, tone, language }),
      });

      const data: GenerateResponse | GenerateErrorResponse = await response.json();

      if (!data.success) {
        setError((data as GenerateErrorResponse).error);
      } else {
        setResults(data as GenerateResponse);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (results) {
    return (
      <div>
        <button
          onClick={() => { setResults(null); setUrl(''); }}
          className="btn btn-ghost"
          style={{ marginBottom: '1.5rem' }}
        >
          ← Generate Another
        </button>
        <ResultsView data={results} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Generate Posts ✨
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          Paste an article URL and we&apos;ll create 15 unique social media posts across 5 platforms.
        </p>
      </div>

      <form onSubmit={handleGenerate}>
        {/* URL Input */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="label" htmlFor="url">Article URL</label>
          <input
            id="url"
            type="url"
            className="input input-lg"
            placeholder="https://example.com/blog/your-article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {/* Tone Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="label">Tone</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                disabled={loading}
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: '0.75rem',
                  border: tone === t.value ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  background: tone === t.value ? 'var(--accent-glow)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: tone === t.value ? 'var(--accent-primary-hover)' : 'var(--text-primary)',
                  marginBottom: '0.25rem',
                }}>
                  {t.label}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {t.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Language Toggle */}
        <div style={{ marginBottom: '2rem' }}>
          <label className="label">Spelling</label>
          <div className="toggle-group" style={{ maxWidth: '300px' }}>
            <button
              type="button"
              className={`toggle-option ${language === 'US' ? 'active' : ''}`}
              onClick={() => setLanguage('US')}
              disabled={loading}
            >
              🇺🇸 US English
            </button>
            <button
              type="button"
              className={`toggle-option ${language === 'UK' ? 'active' : ''}`}
              onClick={() => setLanguage('UK')}
              disabled={loading}
            >
              🇬🇧 UK English
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '0.875rem 1rem',
            borderRadius: '0.75rem',
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.2)',
            color: 'var(--error)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          disabled={loading || !url}
        >
          {loading ? (
            <>
              <div className="spinner" />
              Generating 15 posts...
            </>
          ) : (
            'Generate Posts (1 credit)'
          )}
        </button>

        {loading && (
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }} className="pulse">
            Scraping article and generating posts... this may take 15-30 seconds.
          </p>
        )}
      </form>
    </div>
  );
}
