"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["Male", "Female", "Other"]),
  date_of_birth: z.string().refine((date) => {
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    return age >= 13 && age <= 120
  }, "You must be at least 13 years old"),
  weight_kg: z.number().min(20).max(500),
  height_cm: z.number().min(100).max(300),
  body_fat_percentage: z.number().min(1).max(100).optional(),
  unit_preference: z.enum(["metric", "imperial"]),
  theme_preference: z.enum(["light", "dark"]),
})

export default function SetupProfilePage() {
  const { user, profile, createProfile } = useAuth()
  const router = useRouter()

  // If user is not logged in, redirect to auth page
  useEffect(() => {
    if (!user) {
      router.push("/auth")
    }
    // If user already has a profile, redirect to home
    if (profile) {
      router.push("/")
    }
  }, [user, profile, router])

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.user_metadata?.full_name || "",
      gender: "Male",
      date_of_birth: "",
      weight_kg: 70,
      height_cm: 170,
      unit_preference: "metric",
      theme_preference: "light",
    },
  })

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    try {
      await createProfile(values)
    } catch (error) {
      console.error("Error creating profile:", error)
      form.setError("root", {
        message: error instanceof Error ? error.message : "Failed to create profile",
      })
    }
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {form.formState.errors.root && (
                <div className="rounded-md bg-destructive/15 p-3">
                  <div className="text-sm text-destructive">
                    {form.formState.errors.root.message}
                  </div>
                </div>
              )}

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
                name="weight_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Weight ({form.watch("unit_preference") === "metric" ? "kg" : "lbs"})
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value)
                          if (form.watch("unit_preference") === "imperial") {
                            // Convert lbs to kg
                            field.onChange(value * 0.453592)
                          } else {
                            field.onChange(value)
                          }
                        }}
                        value={
                          form.watch("unit_preference") === "imperial"
                            ? (field.value / 0.453592).toFixed(1)
                            : field.value
                        }
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
                    <FormLabel>
                      Height ({form.watch("unit_preference") === "metric" ? "cm" : "ft"})
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value)
                          if (form.watch("unit_preference") === "imperial") {
                            // Convert ft to cm
                            field.onChange(value * 30.48)
                          } else {
                            field.onChange(value)
                          }
                        }}
                        value={
                          form.watch("unit_preference") === "imperial"
                            ? (field.value / 30.48).toFixed(1)
                            : field.value
                        }
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
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
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

              <Button type="submit" className="w-full">
                Complete Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
