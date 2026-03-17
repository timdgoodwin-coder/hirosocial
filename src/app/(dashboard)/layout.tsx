import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DashboardNav } from './DashboardNav';
import { PaymentToast } from '@/components/PaymentToast';
import { Suspense } from 'react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        borderRight: '1px solid var(--border-subtle)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(17, 17, 40, 0.5)',
        backdropFilter: 'blur(12px)',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ textDecoration: 'none', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span className="text-gradient">Hiro</span>
            <span style={{ color: 'var(--text-primary)' }}>Social</span>
          </div>
        </Link>

        {/* Credits badge */}
        <div style={{
          padding: '0.875rem 1rem',
          borderRadius: '0.75rem',
          background: 'var(--accent-glow)',
          border: '1px solid var(--border-accent)',
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Credits Available
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }} className="text-gradient">
            {profile?.credits ?? 0}
          </div>
        </div>

        {/* Nav */}
        <DashboardNav />

        {/* User info at bottom */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            {profile?.full_name || 'User'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {user.email}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: '260px', padding: '2rem' }}>
        {children}
      </main>

      {/* Payment success toast */}
      <Suspense fallback={null}>
        <PaymentToast />
      </Suspense>
    </div>
  );
}
