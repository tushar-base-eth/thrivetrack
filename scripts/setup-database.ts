import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function setupDatabase() {
  try {
    // Read the schema file
    const schemaPath = path.resolve(process.cwd(), 'lib/supabase/schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0)

    // Execute each statement
    for (const statement of statements) {
      console.log('\nExecuting statement:', statement)
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      if (error) {
        console.error('Error executing statement:', error)
        if (!error.message.includes('already exists')) {
          throw error
        }
      }
    }

    console.log('\nDatabase setup completed successfully!')
  } catch (error) {
    console.error('Error setting up database:', error)
    process.exit(1)
  }
}

setupDatabase()
