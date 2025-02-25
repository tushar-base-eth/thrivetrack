import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// Mock environment variables
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co")
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key")
