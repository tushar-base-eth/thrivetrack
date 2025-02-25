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

async function testPasswordPolicy() {
  console.log('\n🔒 Testing Password Policy...')
  
  const weakPasswords = [
    'short', // too short
    'nocapital123!', // no uppercase
    'NOLOWER123!', // no lowercase
    'NoSpecial123', // no special char
    'NoNumber!Ab', // no number
  ]

  for (const password of weakPasswords) {
    const { error } = await supabase.auth.signUp({
      email: 'test@gmail.com',
      password,
    })
    
    if (error) {
      console.log(`✅ Correctly rejected weak password: "${password}"`)
      console.log(`   Error: ${error.message}`)
    } else {
      console.log(`❌ Failed to reject weak password: "${password}"`)
    }
  }

  // Test strong password
  const { error } = await supabase.auth.signUp({
    email: 'test@gmail.com',
    password: 'StrongP@ss123',
  })

  if (!error || error.message.includes('User already registered')) {
    console.log('✅ Accepted strong password: "StrongP@ss123"')
  } else {
    console.log('❌ Rejected strong password:', error.message)
  }
}

async function testRateLimiting() {
  console.log('\n🚦 Testing Rate Limiting...')
  
  // Test sign-in rate limiting (5 attempts per 15 minutes)
  console.log('\nTesting sign-in rate limiting...')
  for (let i = 1; i <= 10; i++) {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'nonexistent@gmail.com',
      password: 'WrongP@ss123',
    })

    if (error) {
      if (error.message.includes('rate limit')) {
        console.log(`✅ Rate limit kicked in at attempt ${i}`)
        break
      }
      console.log(`Attempt ${i}: ${error.message}`)
    }
    
    // Add a small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

async function testEmailVerification() {
  console.log('\n✉️ Testing Email Verification...')
  
  const testEmail = `test${Date.now()}@gmail.com`
  const testPassword = 'TestP@ss123'

  // Try to sign up
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  })

  if (error) {
    console.log('❌ Sign up failed:', error.message)
    return
  }

  if (data.user?.identities?.length === 0) {
    console.log('✅ User already exists')
  } else if (data.user?.confirmed_at) {
    console.log('❌ Email verification was not required')
  } else {
    console.log('✅ Email verification required')
    console.log(`   Verification email sent to: ${testEmail}`)
  }

  // Try to sign in before verification
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  })

  if (signInError?.message.includes('Email not confirmed')) {
    console.log('✅ Sign in blocked until email is verified')
  } else {
    console.log('❌ Allowed sign in before email verification')
  }
}

async function main() {
  console.log('🚀 Starting Auth Configuration Tests...')

  // Test password policy
  await testPasswordPolicy()

  // Test rate limiting
  await testRateLimiting()

  // Test email verification
  await testEmailVerification()

  console.log('\n✨ Auth Configuration Tests Completed!')
}

main().catch(console.error)
