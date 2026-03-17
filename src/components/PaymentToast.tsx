'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export function PaymentToast() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [credits, setCredits] = useState<string | null>(null);

  useEffect(() => {
    const payment = searchParams.get('payment');
    const cr = searchParams.get('credits');
    if (payment === 'success' && cr) {
      setCredits(cr);
      setVisible(true);
      // Auto-dismiss after 5s
      const t = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 9999,
      padding: '1rem 1.5rem',
      borderRadius: '0.875rem',
      background: 'rgba(52, 211, 153, 0.15)',
      border: '1px solid rgba(52, 211, 153, 0.35)',
      color: 'var(--success)',
      fontSize: '0.9rem',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '0.65rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      animation: 'slideIn 0.3s ease',
    }}>
      <span style={{ fontSize: '1.25rem' }}>🎉</span>
      Payment successful! <strong>+{credits} credits</strong> added to your account.
      <button
        onClick={() => setVisible(false)}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          marginLeft: '0.5rem',
          opacity: 0.7,
          fontSize: '1rem',
          lineHeight: 1,
        }}
        aria-label="Dismiss"
      >
        ✕
      </button>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
