'use client';

import { useState } from 'react';
import { GenerateResponse, Platform, PLATFORMS, PLATFORM_CONFIG, PostVariant } from '@/lib/types';
import { PlatformLogo } from '@/components/PlatformLogos';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button onClick={handleCopy} className={`copy-btn ${copied ? 'copied' : ''}`}>
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  );
}

function CharacterBar({ count, max }: { count: number; max: number }) {
  const percentage = Math.min((count / max) * 100, 100);
  const color = percentage > 90 ? 'var(--error)' : percentage > 70 ? 'var(--warning)' : 'var(--success)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
      <div className="char-bar" style={{ flex: 1 }}>
        <div className="char-bar-fill" style={{ width: `${percentage}%`, background: color }} />
      </div>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {count} / {max}
      </span>
    </div>
  );
}

function PostCard({ post, platform }: { post: PostVariant; platform: Platform }) {
  const config = PLATFORM_CONFIG[platform];

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div className="platform-badge" style={{
          background: `${config.color}15`,
          color: config.color === '#000000' ? 'var(--text-primary)' : config.color,
          border: `1px solid ${config.color}30`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <PlatformLogo platform={platform} size={14} color={config.color === '#000000' ? 'var(--text-primary)' : config.color} />
          Variant {post.variant}
        </div>
        <CopyButton text={post.content} />
      </div>

      <div style={{
        fontSize: '0.875rem',
        lineHeight: 1.7,
        color: 'var(--text-primary)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {post.content}
      </div>

      <CharacterBar count={post.character_count} max={config.maxLength} />
    </div>
  );
}

export function ResultsView({ data }: { data: GenerateResponse }) {
  const [activePlatform, setActivePlatform] = useState<Platform>('twitter');

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--success)',
            boxShadow: '0 0 8px var(--success)',
          }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
            15 posts generated successfully
          </span>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3 }}>
          {data.source_title}
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
          Credits remaining: {data.credits_remaining}
        </p>
      </div>

      {/* Platform tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
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

      {/* Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.posts[activePlatform]?.map((post) => (
          <PostCard key={post.variant} post={post} platform={activePlatform} />
        ))}
      </div>
    </div>
  );
}
