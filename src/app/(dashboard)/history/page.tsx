import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { HistoryItem } from './HistoryItem';

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all generations with their posts
  const { data: generations } = await supabase
    .from('generations')
    .select(`
      *,
      generated_posts (*)
    `)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          History 📋
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          View all your past generations and their posts.
        </p>
      </div>

      {generations && generations.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {generations.map((gen) => (
            <HistoryItem key={gen.id} generation={gen} />
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No generations yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Your post history will appear here after you generate content.
          </p>
          <Link href="/generate" className="btn btn-primary">
            Generate Your First Posts
          </Link>
        </div>
      )}
    </div>
  );
}
