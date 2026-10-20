import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
// Schema do app no projeto Supabase compartilhado (padrão: public)
const supabaseSchema = ((import.meta.env.VITE_SUPABASE_SCHEMA as string | undefined)?.trim() || 'public') as 'public';

export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

export const supabase = isDemoMode
  ? null!
  : createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: supabaseSchema },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
