import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single();

  // Fetch recent generations
  const { data: recentGenerations } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          Ready to repurpose some content?
        </p>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {/* Generate card */}
        <Link href="/generate" style={{ textDecoration: 'none' }}>
          <div className="card card-hover" style={{
            background: 'var(--accent-glow)',
            border: '1px solid var(--border-accent)',
            cursor: 'pointer',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>✨</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.375rem' }}>Generate Posts</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
              Paste a URL and create social content
            </p>
          </div>
        </Link>

        {/* Credits card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '0.75rem',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            flexShrink: 0,
          }}>
            💳
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Credit Balance
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }} className="text-gradient">
              {profile?.credits ?? 0}
            </div>
          </div>
        </div>

        {/* Language card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '0.75rem',
            background: 'var(--bg-input)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            flexShrink: 0,
          }}>
            🌐
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Language
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {profile?.language_preference === 'UK' ? '🇬🇧 British English' : '🇺🇸 American English'}
            </div>
          </div>
        </div>
      </div>

      {/* Recent generations */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Generations</h2>
          <Link href="/history" style={{ fontSize: '0.825rem', color: 'var(--accent-primary-hover)', textDecoration: 'none', fontWeight: 500 }}>
            View all →
          </Link>
        </div>

        {recentGenerations && recentGenerations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentGenerations.map((gen) => (
              <div key={gen.id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {gen.source_title || gen.source_url}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.375rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(gen.created_at).toLocaleDateString()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {gen.tone}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {gen.language}
                    </span>
                  </div>
                </div>
                <div style={{
                  padding: '0.25rem 0.625rem',
                  borderRadius: '2rem',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: gen.status === 'completed' ? 'rgba(52, 211, 153, 0.1)' : gen.status === 'failed' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                  color: gen.status === 'completed' ? 'var(--success)' : gen.status === 'failed' ? 'var(--error)' : 'var(--warning)',
                  border: `1px solid ${gen.status === 'completed' ? 'rgba(52, 211, 153, 0.2)' : gen.status === 'failed' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(251, 191, 36, 0.2)'}`,
                  textTransform: 'capitalize',
                }}>
                  {gen.status}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📝</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No generations yet. <Link href="/generate" style={{ color: 'var(--accent-primary-hover)', textDecoration: 'none', fontWeight: 500 }}>Create your first one!</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
