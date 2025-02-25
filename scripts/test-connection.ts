import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testConnection() {
  try {
    const { data, error } = await supabase.from('_test').select('*')
    if (error) throw error
    console.log('Successfully connected to Supabase!')
  } catch (error) {
    if (error.message?.includes('relation "_test" does not exist')) {
      console.log('Successfully connected to Supabase! (Expected error about _test table not existing)')
    } else {
      console.error('Error connecting to Supabase:', error)
    }
  }
}

testConnection()
