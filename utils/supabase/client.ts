import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Create a singleton instance for use in components
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      storageKey: 'thrivetrack-auth-token',
      debug: process.env.NODE_ENV === 'development'
    }
  }
)
