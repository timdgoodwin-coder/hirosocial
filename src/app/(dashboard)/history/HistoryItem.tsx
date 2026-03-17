'use client';

import { useState } from 'react';
import { GenerationWithPosts, PLATFORM_CONFIG, Platform, PLATFORMS } from '@/lib/types';
import { PlatformLogo } from '@/components/PlatformLogos';

export function HistoryItem({ generation }: { generation: GenerationWithPosts }) {
  const [expanded, setExpanded] = useState(false);
  const [activePlatform, setActivePlatform] = useState<Platform>('twitter');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const platformPosts = generation.generated_posts?.filter(
    (p) => p.platform === activePlatform
  ) || [];

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '0.25rem 0',
          textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {generation.source_title || generation.source_url}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date(generation.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              🎨 {generation.tone}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {generation.language === 'UK' ? '🇬🇧' : '🇺🇸'} {generation.language}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{
            padding: '0.25rem 0.625rem',
            borderRadius: '2rem',
            fontSize: '0.7rem',
            fontWeight: 600,
            background: generation.status === 'completed' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
            color: generation.status === 'completed' ? 'var(--success)' : 'var(--error)',
            border: `1px solid ${generation.status === 'completed' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`,
            textTransform: 'capitalize',
          }}>
            {generation.status}
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
            ▼
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && generation.status === 'completed' && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          {/* Source URL */}
          <div style={{ marginBottom: '1rem' }}>
            <a
              href={generation.source_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.8rem', color: 'var(--accent-primary-hover)', textDecoration: 'none' }}
            >
              🔗 {generation.source_url}
            </a>
          </div>

          {/* Platform tabs */}
          <div className="tabs" style={{ marginBottom: '1rem' }}>
            {PLATFORMS.map((platform) => {
              const config = PLATFORM_CONFIG[platform];
              return (
                <button
                  key={platform}
                  className={`tab ${activePlatform === platform ? 'active' : ''}`}
                  onClick={() => setActivePlatform(platform)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <PlatformLogo platform={platform} size={14} color={activePlatform === platform ? config.color : undefined} />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Posts for selected platform */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {platformPosts.sort((a, b) => a.variant - b.variant).map((post) => (
              <div
                key={post.id}
                style={{
                  padding: '1rem',
                  background: 'var(--bg-input)',
                  borderRadius: '0.625rem',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Variant {post.variant}
                  </span>
                  <button
                    onClick={() => handleCopy(post.content, post.id)}
                    className={`copy-btn ${copiedId === post.id ? 'copied' : ''}`}
                  >
                    {copiedId === post.id ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {post.content}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {post.character_count} characters
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed message */}
      {expanded && generation.status === 'failed' && (
        <div style={{ marginTop: '1rem', padding: '0.875rem', borderRadius: '0.5rem', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.15)', fontSize: '0.85rem', color: 'var(--error)' }}>
          {generation.error_message || 'Generation failed'}
        </div>
      )}
    </div>
  );
}
