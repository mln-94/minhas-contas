import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useTheme(user: User | null) {
  const [darkMode, setDarkMode] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem('darkMode');
      setDarkMode(saved !== 'false');
      setLoaded(true);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select('dark_mode')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setDarkMode(data.dark_mode);
      } else {
        setDarkMode(true);
      }
      setLoaded(true);
    })();
  }, [user]);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
    if (user) {
      supabase.from('user_preferences').upsert(
        { user_id: user.id, dark_mode: darkMode, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    }
  }, [darkMode, loaded, user]);

  function toggle() {
    setDarkMode((v) => !v);
  }

  return { darkMode, toggle };
}
