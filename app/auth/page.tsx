/**
 * Authentication Page Component
 *
 * Handles both login and signup flows with a unified form interface.
 * Provides a seamless experience for user authentication with form validation
 * and smooth transitions between login and signup modes.
 *
 * Features:
 * - Toggle between login and signup forms
 * - Form validation using Zod
 * - Unit preference handling for weight/height
 * - Error handling and feedback
 * - Loading states
 *
 * UX Considerations:
 * - Smooth animations between form states
 * - Clear error messages
 * - Proper input types for mobile
 * - Haptic feedback
 * - iOS-native feel
 */

"use client"

import { Suspense } from "react"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useHaptic } from "@/hooks/use-haptic"
import type { UserProfile } from "@/contexts/auth-context"
import { createClient } from "@supabase/supabase-js"
import { useSearchParams } from "next/navigation"

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["male", "female", "other"]),
  weight_unit: z.enum(["kg", "lbs"]),
  height_unit: z.enum(["cm", "ft"]),
})

// Auth form component
function AuthForm() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") === "signup" ? "signup" : "login"
  const { signIn, signUp } = useAuth()
  const haptic = useHaptic()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(mode === "signup" ? signupSchema : loginSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      gender: "male" as const,
      weight_unit: "kg" as const,
      height_unit: "cm" as const,
    },
  })

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    try {
      setIsLoading(true)
      haptic.impact()

      if (mode === "signup") {
        const { email, password, ...profile } = values
        await signUp(email, password, profile)
      } else {
        await signIn(values.email, values.password)
      }
    } catch (error) {
      haptic.notification("error")
      console.error("Auth error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error) {
      console.error("Google login error:", error)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{mode === "signup" ? "Create Account" : "Welcome Back"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AnimatePresence>
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="weight_unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kg">Kilograms (kg)</SelectItem>
                              <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="height_unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cm">Centimeters (cm)</SelectItem>
                              <SelectItem value="ft">Feet (ft)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                "Loading..."
              ) : mode === "signup" ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              Continue with Google
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// Main auth page component
export default function AuthPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  )
}
