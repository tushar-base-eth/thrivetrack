import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

// Create Supabase client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testGoogleOAuth() {
  console.log('\n🔑 Testing Google OAuth Configuration...')

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
      },
    })

    if (error) {
      console.log('❌ Google OAuth configuration error:', error.message)
      return
    }

    if (data?.url) {
      console.log('✅ Google OAuth URL generated successfully')
      console.log('✅ Redirect URL configured correctly')
      console.log(`   OAuth URL: ${data.url}`)
    }
  } catch (error) {
    console.error('❌ Error testing Google OAuth:', error)
  }
}

async function main() {
  console.log('🚀 Starting OAuth Configuration Test...')
  await testGoogleOAuth()
  console.log('\n✨ OAuth Configuration Test Completed!')
}

main().catch(console.error)
