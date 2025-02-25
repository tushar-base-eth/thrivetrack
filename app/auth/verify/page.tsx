"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"

export default function VerifyPage() {
  return (
    <div className="container max-w-lg p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We&apos;ve sent you a verification email. Please check your inbox and click the verification link to activate your account.
            </p>
            <p className="text-sm text-muted-foreground">
              The verification link will expire in 24 hours. If you don&apos;t see the email, please check your spam folder.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
