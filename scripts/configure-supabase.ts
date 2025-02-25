import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function configureDatabaseRateLimiting() {
  const rateLimitSQL = `
    -- Create rate limiting tables
    CREATE TABLE IF NOT EXISTS public.rate_limits (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ip_address TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      requests INTEGER DEFAULT 1,
      window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(ip_address, endpoint)
    );

    -- Create rate limiting function
    CREATE OR REPLACE FUNCTION public.check_rate_limit(
      p_ip_address TEXT,
      p_endpoint TEXT,
      p_max_requests INTEGER,
      p_window_minutes INTEGER
    ) RETURNS BOOLEAN AS $$
    DECLARE
      v_current_requests INTEGER;
      v_window_start TIMESTAMP WITH TIME ZONE;
    BEGIN
      -- Clean up old records
      DELETE FROM public.rate_limits 
      WHERE window_start < CURRENT_TIMESTAMP - (p_window_minutes || ' minutes')::INTERVAL;

      -- Get or create rate limit record
      INSERT INTO public.rate_limits (ip_address, endpoint)
      VALUES (p_ip_address, p_endpoint)
      ON CONFLICT (ip_address, endpoint) DO UPDATE
      SET requests = CASE
        WHEN rate_limits.window_start < CURRENT_TIMESTAMP - (p_window_minutes || ' minutes')::INTERVAL
        THEN 1
        ELSE rate_limits.requests + 1
        END,
        window_start = CASE
        WHEN rate_limits.window_start < CURRENT_TIMESTAMP - (p_window_minutes || ' minutes')::INTERVAL
        THEN CURRENT_TIMESTAMP
        ELSE rate_limits.window_start
        END
      RETURNING requests INTO v_current_requests;

      -- Check if limit exceeded
      RETURN v_current_requests <= p_max_requests;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create RLS policies for rate limiting
    ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Allow public read of own rate limits"
    ON public.rate_limits FOR SELECT
    USING (ip_address = current_setting('request.headers')::json->>'x-real-ip');

    CREATE POLICY "Allow public insert/update of own rate limits"
    ON public.rate_limits FOR ALL
    USING (ip_address = current_setting('request.headers')::json->>'x-real-ip');
  `

  try {
    const { error } = await supabase.rpc('exec', { sql: rateLimitSQL })
    if (error) throw error
    console.log('✅ Rate limiting configured successfully')
  } catch (error) {
    console.error('Error configuring rate limiting:', error)
  }
}

async function main() {
  console.log('🚀 Starting Supabase database configuration...')

  // Configure rate limiting
  await configureDatabaseRateLimiting()

  console.log('✨ Supabase database configuration completed!')
  console.log('\nPlease complete the following manual configuration steps in the Supabase Dashboard:')
  console.log('\n1. Auth Settings (https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/auth/url-configuration):')
  console.log('   - Set Site URL to: http://localhost:3000')
  console.log('   - Enable "Confirm Email"')
  console.log('   - Configure password policy:')
  console.log('     • Minimum 8 characters')
  console.log('     • Require uppercase')
  console.log('     • Require lowercase')
  console.log('     • Require number')
  console.log('     • Require special character')
  console.log('\n2. Rate Limits (https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/auth/rate-limits):')
  console.log('   - Sign in: 5 attempts per 15 minutes')
  console.log('   - Password reset: 3 attempts per hour')
  console.log('   - Email verification: 3 attempts per hour')
  console.log('   - API requests: 100 per minute')
  console.log('\n3. Email Templates (https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/auth/templates):')
  console.log('   Configure the following templates:')
  console.log('   - Confirmation Email')
  console.log('   - Reset Password Email')
  console.log('   - Magic Link Email')
  console.log('\nReplace [YOUR_PROJECT_ID] with: tssuqlvubfiljuxgfwtk')
}

main().catch(console.error)
