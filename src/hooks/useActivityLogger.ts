import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type Page = 'dashboard' | 'bills';

export function useActivityLogger(user: User | null, page: Page) {
  const lastLoggedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Only log once per unique (user, page) within the session to avoid flooding
    const key = `${user.id}:${page}`;
    if (lastLoggedRef.current === key) return;
    lastLoggedRef.current = key;

    supabase
      .from('user_activity_logs')
      .insert({ user_id: user.id, page })
      .then(() => {});
  }, [user, page]);
}
