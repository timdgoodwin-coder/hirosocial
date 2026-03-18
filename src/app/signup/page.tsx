'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Sign-up now happens via the landing page free-trial form (which grants 1 free credit).
// Redirect anyone who lands on /signup back to the homepage sign-up form.
export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/#free-trial');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner spinner-lg" />
    </div>
  );
}
