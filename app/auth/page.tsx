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

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { loginSchema, signupSchema, type LoginFormData, type SignUpFormData } from "@/lib/validations/auth"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AuthPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  )
}

function AuthForm() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") === "signup" ? "signup" : "login"
  const { signIn, signUp } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormData | SignUpFormData>({
    resolver: zodResolver(mode === "signup" ? signupSchema : loginSchema),
    defaultValues: mode === "signup" ? {
      email: "",
      password: "",
      name: "",
      gender: "Other" as const,
      date_of_birth: "2000-01-01",  // Fixed date that ensures user is over 13
      weight_kg: 70,  // Valid: between 20-300
      height_cm: 170,  // Valid: between 100-250
      body_fat_percentage: 20,  // Valid: between 1-100
      unit_preference: "metric" as const,
      theme_preference: "light" as const,
    } : {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormData | SignUpFormData) => {
    try {
      setIsLoading(true)

      if (mode === "signup") {
        await signUp(values as SignUpFormData)
        router.push("/dashboard")
      } else {
        await signIn(values.email, values.password)
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Auth error:", error)
      form.setError("root", {
        message: error instanceof Error ? error.message : "Authentication failed",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "signup" ? "Create Account" : "Welcome Back"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {form.formState.errors.root && (
              <div className="rounded-md bg-destructive/15 p-3">
                <div className="text-sm text-destructive">{form.formState.errors.root.message}</div>
              </div>
            )}

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

            {mode === "signup" && (
              <>
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
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_of_birth"
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
                  name="weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="body_fat_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Fat % (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Units</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select units" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                          <SelectItem value="imperial">Imperial (lbs, ft)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="theme_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {mode === "signup" ? "Creating Account..." : "Signing In..."}
                </div>
              ) : mode === "signup" ? "Create Account" : "Sign In"}
            </Button>
          </form>
        </Form>

        <div className="mt-4 text-center text-sm">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <Link href="/auth" className="font-medium text-primary hover:underline">
                Sign In
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/auth?mode=signup" className="font-medium text-primary hover:underline">
                Create Account
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
