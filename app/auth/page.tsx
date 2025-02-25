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
import { createBrowserClient } from "@supabase/auth-helpers-nextjs"
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
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), "Please enter a valid date"),
  weight: z.number().positive("Weight must be positive"),
  height: z.number().positive("Height must be positive"),
  bodyFat: z.number().min(0, "Body fat must be positive").max(100, "Body fat must be less than 100").optional(),
  unitPreference: z.enum(["metric", "imperial"]),
})

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [unitPreference, setUnitPreference] = useState<"metric" | "imperial">("metric")
  const [isLoading, setIsLoading] = useState(false)
  const { login, signup } = useAuth()
  const haptic = useHaptic()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    defaultValues: {
      email: "",
      password: "",
      unitPreference: "metric",
    },
  })

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true)
    haptic.trigger()

    try {
      if (isLogin) {
        await login(values.email, values.password)
        haptic.success()
      } else {
        const userProfile: UserProfile = {
          email: values.email,
          name: values.name,
          gender: values.gender,
          dateOfBirth: values.dateOfBirth,
          weight: values.weight,
          height: values.height,
          bodyFat: values.bodyFat,
          unitPreference: values.unitPreference,
        }
        await signup(userProfile, values.password)
        haptic.success()
      }
    } catch (error) {
      haptic.error()
      form.setError("root", {
        message: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error) {
      haptic.error()
      form.setError("root", {
        message: error instanceof Error ? error.message : "An error occurred with Google login",
      })
    }
  }

  return (
    <div className="container max-w-lg p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={isLogin ? "login" : "signup"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>{isLogin ? "Login" : "Sign Up"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {error && (
                    <div className="rounded-md bg-destructive/15 p-3">
                      <div className="text-sm text-destructive">{error}</div>
                    </div>
                  )}
                  
                  {form.formState.errors.root && (
                    <div className="rounded-md bg-destructive/15 p-3">
                      <div className="text-sm text-destructive">{form.formState.errors.root.message}</div>
                    </div>
                  )}

                  {/* Email and Password fields */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="email@example.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            {...field}
                          />
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
                          <Input
                            type="password"
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Signup-only fields */}
                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6"
                      >
                        {/* Additional signup fields */}
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
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Weight ({unitPreference === "metric" ? "kg" : "lb"})</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  inputMode="decimal"
                                  {...field}
                                  onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="height"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Height ({unitPreference === "metric" ? "cm" : "ft/in"})</FormLabel>
                              <FormControl>
                                {unitPreference === "metric" ? (
                                  <Input
                                    type="number"
                                    inputMode="decimal"
                                    {...field}
                                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                  />
                                ) : (
                                  <div className="flex gap-2">
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      placeholder="ft"
                                      className="w-20"
                                      onChange={(e) => {
                                        const feet = Number.parseFloat(e.target.value)
                                        const inches = Number.parseFloat(
                                          (document.querySelector('input[placeholder="in"]') as HTMLInputElement)
                                            ?.value || "0",
                                        )
                                        field.onChange((feet * 12 + inches) * 2.54)
                                      }}
                                    />
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      placeholder="in"
                                      className="w-20"
                                      onChange={(e) => {
                                        const inches = Number.parseFloat(e.target.value)
                                        const feet = Number.parseFloat(
                                          (document.querySelector('input[placeholder="ft"]') as HTMLInputElement)
                                            ?.value || "0",
                                        )
                                        field.onChange((feet * 12 + inches) * 2.54)
                                      }}
                                    />
                                  </div>
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bodyFat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Body Fat %</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  inputMode="decimal"
                                  {...field}
                                  onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="unitPreference"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Preference</FormLabel>
                              <Select
                                onValueChange={(value: "metric" | "imperial") => {
                                  field.onChange(value)
                                  setUnitPreference(value)
                                }}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select units" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="metric">Metric (kg/cm)</SelectItem>
                                  <SelectItem value="imperial">Imperial (lb/ft-in)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form actions */}
                  <div className="space-y-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                        </div>
                      ) : isLogin ? (
                        "Sign In"
                      ) : (
                        "Create Account"
                      )}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </Button>
                  </div>

                  <div className="text-center text-sm">
                    {isLogin ? (
                      <>
                        Don&apos;t have an account?{" "}
                        <button
                          type="button"
                          className="font-medium text-primary underline-offset-4 hover:underline"
                          onClick={() => setIsLogin(false)}
                        >
                          Sign up
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          className="font-medium text-primary underline-offset-4 hover:underline"
                          onClick={() => setIsLogin(true)}
                        >
                          Sign in
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
