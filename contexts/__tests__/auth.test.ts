import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test user data
const testUser = {
  email: `test${Date.now()}@example.com`, // Unique email
  password: 'Test123!@#',
  name: 'Test User',
  gender: 'Other' as const,
  date_of_birth: '2000-01-01',
  weight_kg: 70,
  height_cm: 170,
  body_fat_percentage: 20,
  unit_preference: 'metric' as const,
  theme_preference: 'light' as const,
}

describe('Auth Flow', () => {
  // Clean up test user after all tests
  afterAll(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.auth.admin.deleteUser(user.id)
    }
  })

  it('should sign up a new user', async () => {
    // 1. Sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
    })

    expect(signUpError).toBeNull()
    expect(signUpData.user).not.toBeNull()
    
    if (!signUpData.user) throw new Error('User not created')

    // 2. Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        email: testUser.email,
        name: testUser.name,
        gender: testUser.gender,
        date_of_birth: testUser.date_of_birth,
        weight_kg: testUser.weight_kg,
        height_cm: testUser.height_cm,
        body_fat_percentage: testUser.body_fat_percentage,
        unit_preference: testUser.unit_preference,
        theme_preference: testUser.theme_preference,
        total_volume: 0,
        total_workouts: 0,
      }])

    expect(profileError).toBeNull()
  })

  it('should sign in the user', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    })

    expect(error).toBeNull()
    expect(data.user).not.toBeNull()
  })

  it('should fetch user profile', async () => {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', testUser.email)
      .single()

    expect(error).toBeNull()
    expect(profile).not.toBeNull()
    expect(profile?.email).toBe(testUser.email)
    expect(profile?.name).toBe(testUser.name)
    expect(profile?.gender).toBe(testUser.gender)
    expect(profile?.unit_preference).toBe(testUser.unit_preference)
    expect(profile?.theme_preference).toBe(testUser.theme_preference)
  })

  it('should sign out the user', async () => {
    const { error } = await supabase.auth.signOut()
    expect(error).toBeNull()

    // Verify user is signed out
    const { data: { user } } = await supabase.auth.getUser()
    expect(user).toBeNull()
  })
})
