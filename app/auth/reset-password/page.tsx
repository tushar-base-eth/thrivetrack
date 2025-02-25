"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email"),
})

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof resetSchema>) => {
    try {
      await resetPassword(values.email)
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error resetting password:", error)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <p>Check your email for a password reset link.</p>
              <p className="text-sm text-muted-foreground">
                If you don&apos;t see it, check your spam folder.
              </p>
            </div>
          ) : (
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

                <Button type="submit" className="w-full">
                  Send Reset Link
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
