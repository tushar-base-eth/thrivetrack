import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function verifySetup() {
  try {
    console.log('🔍 Verifying database setup...\n')

    // 1. Check if tables exist
    const tables = ['users', 'workouts', 'available_exercises', 'workout_exercises', 'sets', 'daily_volume']
    console.log('📊 Checking tables...')
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error && !error.message.includes('Results contain 0 rows')) {
        throw new Error(`Table ${table} error: ${error.message}`)
      }
      console.log(`✅ Table ${table} exists`)
    }

    // 2. Check if initial exercises were seeded
    console.log('\n🏋️ Checking seeded exercises...')
    const { data: exercises, error: exercisesError } = await supabase
      .from('available_exercises')
      .select('name, primary_muscle_group, secondary_muscle_group')
    
    if (exercisesError) throw exercisesError
    console.log(`✅ Found ${exercises.length} exercises:`)
    exercises.forEach(ex => {
      console.log(`  - ${ex.name} (${ex.primary_muscle_group}${ex.secondary_muscle_group ? `, ${ex.secondary_muscle_group}` : ''})`)
    })

    // 3. Test stored procedures
    console.log('\n⚙️ Testing stored procedures...')
    
    // Create a test user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: 'test@example.com',
        name: 'Test User',
        gender: 'Other',
        date_of_birth: '1990-01-01',
        weight_kg: 70,
        height_cm: 170
      })
      .select()
      .single()
    
    if (userError && !userError.message.includes('duplicate key')) {
      throw userError
    }

    // Get the user (in case it already existed)
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select()
      .eq('email', 'test@example.com')
      .single()
    
    if (existingUserError) throw existingUserError
    
    const testUser = user || existingUser
    
    // Test update_user_stats
    console.log('Testing update_user_stats...')
    const { error: updateError } = await supabase
      .rpc('update_user_stats', {
        p_user_id: testUser.id,
        p_volume: 1000
      })
    if (updateError) throw updateError
    console.log('✅ update_user_stats works')

    // Test get_total_volume
    console.log('Testing get_total_volume...')
    const { data: volume, error: volumeError } = await supabase
      .rpc('get_total_volume', {
        p_user_id: testUser.id
      })
    if (volumeError) throw volumeError
    console.log(`✅ get_total_volume works (current volume: ${volume})`)

    // Test get_volume_by_day
    console.log('Testing get_volume_by_day...')
    const { data: dailyVolume, error: dailyVolumeError } = await supabase
      .rpc('get_volume_by_day', {
        p_user_id: testUser.id,
        p_days: 7
      })
    if (dailyVolumeError) throw dailyVolumeError
    console.log('✅ get_volume_by_day works')

    console.log('\n🎉 Database setup verification completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Error during verification:', error)
    process.exit(1)
  }
}

verifySetup()
