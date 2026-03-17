'use client';

import { useEffect, useState } from 'react';

export default function PageTransition() {
  const [phase, setPhase] = useState<'loading' | 'revealing' | 'done'>('loading');

  useEffect(() => {
    // Brief hold, then reveal
    const t1 = setTimeout(() => setPhase('revealing'), 300);
    const t2 = setTimeout(() => setPhase('done'), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'done') return null;

  return (
    <div className={`page-curtain ${phase}`}>
      <div className="page-curtain-logo">
        <img src="/img/seventhwear_logo_loader.svg" alt="" width={220} height={55} />
      </div>
    </div>
  );
}
