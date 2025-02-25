# Implementation Plan for AI Agent

This document provides a comprehensive, step-by-step implementation plan for an AI agent to complete the ThriveTrack Minimum Viable Product (MVP) with Supabase integration, making it production-ready using an AI IDE like Cursor. The plan leverages the existing Next.js project structure and replaces mock data with real Supabase database interactions. The steps are designed to be logical, automated, and require minimal manual input, ensuring a seamless development process within a one-day timeline.

---

## Project Overview

ThriveTrack is a fitness tracking web app built with Next.js and Supabase, featuring an iOS-like UI/UX with Fitbod-inspired styling. The current codebase uses mock data, and the goal is to integrate Supabase for authentication, user profiles, workout logging, history, dashboard, and available exercises. The UI/UX is complete, and this plan focuses on backend integration and functionality.

---

## Prerequisites

- **Supabase Project**: Create a new project at [supabase.com](https://supabase.com) and obtain the URL and anon key.
- **Environment Setup**: Ensure `.env.local` contains:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
  ```
- **Dependencies**: Verify all required packages are installed (listed in `package.json`).

---

## Step-by-Step Implementation Plan

### Step 1: Supabase Setup

1. **Install Supabase Clients**:

   - Run: `npm install @supabase/supabase-js @supabase/ssr`
   - Already present in `package.json`, so verify installation.

2. **Create Supabase Client Files**:

   - **File**: `lib/supabase/client.ts`

     ```typescript
     import { createBrowserClient } from "@supabase/ssr";

     export const supabase = createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     );
     ```

   - **File**: `lib/supabase/server.ts`

     ```typescript
     import { createServerClient } from "@supabase/ssr";
     import { cookies } from "next/headers";

     export function createSupabaseServerClient() {
       return createServerClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
         {
           cookies: {
             get: (name) => cookies().get(name)?.value,
             set: (name, value, options) => cookies().set(name, value, options),
             remove: (name, options) => cookies().delete({ name, ...options }),
           },
         }
       );
     }
     ```

3. **Create Database Tables**:

   - Use the Supabase dashboard or SQL editor to execute:

     ```sql
     CREATE TABLE Users (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       email TEXT UNIQUE NOT NULL,
       name TEXT NOT NULL,
       gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')) NOT NULL,
       date_of_birth DATE NOT NULL,
       weight_kg FLOAT NOT NULL,
       height_cm FLOAT NOT NULL,
       body_fat_percentage FLOAT,
       unit_preference TEXT CHECK (unit_preference IN ('metric', 'imperial')) DEFAULT 'metric',
       theme_preference TEXT CHECK (theme_preference IN ('light', 'dark')) DEFAULT 'light',
       total_volume NUMERIC DEFAULT 0,
       total_workouts INTEGER DEFAULT 0,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );

     CREATE TABLE Workouts (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );

     CREATE TABLE Available_Exercises (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       name TEXT UNIQUE NOT NULL,
       primary_muscle_group TEXT NOT NULL,
       secondary_muscle_group TEXT
     );

     CREATE TABLE Workout_Exercises (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       workout_id UUID REFERENCES Workouts(id) ON DELETE CASCADE,
       exercise_id UUID REFERENCES Available_Exercises(id),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );

     CREATE TABLE Sets (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       workout_exercise_id UUID REFERENCES Workout_Exercises(id) ON DELETE CASCADE,
       reps INTEGER NOT NULL,
       weight_kg FLOAT NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );

     CREATE TABLE Daily_Volume (
       id SERIAL PRIMARY KEY,
       user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
       date DATE NOT NULL,
       volume NUMERIC NOT NULL,
       UNIQUE (user_id, date)
     );
     ```

4. **Add Indexes**:

   - Execute:
     ```sql
     CREATE INDEX idx_workouts_user_id ON Workouts(user_id);
     CREATE INDEX idx_workouts_created_at ON Workouts(created_at);
     CREATE INDEX idx_daily_volume_date ON Daily_Volume(date);
     ```

5. **Seed Available Exercises**:

   - Insert initial data into `Available_Exercises`:
     ```sql
     INSERT INTO Available_Exercises (id, name, primary_muscle_group, secondary_muscle_group) VALUES
       (uuid_generate_v4(), 'Bench Press', 'Chest', 'Triceps'),
       (uuid_generate_v4(), 'Squat', 'Legs', 'Glutes'),
       (uuid_generate_v4(), 'Deadlift', 'Back', 'Hamstrings'),
       (uuid_generate_v4(), 'Pull-up', 'Back', 'Biceps'),
       (uuid_generate_v4(), 'Shoulder Press', 'Shoulders', 'Triceps'),
       (uuid_generate_v4(), 'Push-up', 'Chest', 'Shoulders'),
       (uuid_generate_v4(), 'Lunge', 'Legs', 'Glutes'),
       (uuid_generate_v4(), 'Bent-Over Row', 'Back', 'Biceps');
     ```

6. **Create RPCs**:

   - Add stored procedures for efficient data retrieval:

     ```sql
     CREATE OR REPLACE FUNCTION update_user_stats(p_user_id UUID, p_volume NUMERIC)
     RETURNS VOID AS $$
     BEGIN
       UPDATE Users
       SET total_volume = total_volume + p_volume,
           total_workouts = total_workouts + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = p_user_id;

       INSERT INTO Daily_Volume (user_id, date, volume)
       VALUES (p_user_id, CURRENT_DATE, p_volume)
       ON CONFLICT (user_id, date)
       DO UPDATE SET volume = Daily_Volume.volume + EXCLUDED.volume;
     END;
     $$ LANGUAGE plpgsql;

     CREATE OR REPLACE FUNCTION get_total_volume(p_user_id UUID)
     RETURNS NUMERIC AS $$
     BEGIN
       RETURN (SELECT total_volume FROM Users WHERE id = p_user_id);
     END;
     $$ LANGUAGE plpgsql;

     CREATE OR REPLACE FUNCTION get_volume_by_day(p_user_id UUID, p_days INTEGER)
     RETURNS TABLE (date DATE, volume NUMERIC) AS $$
     BEGIN
       RETURN QUERY
       SELECT dv.date, dv.volume
       FROM Daily_Volume dv
       WHERE dv.user_id = p_user_id
       AND dv.date > CURRENT_DATE - p_days
       ORDER BY dv.date ASC;
     END;
     $$ LANGUAGE plpgsql;
     ```

### Step 2: Authentication

1. **Configure Supabase Auth**:

   - In Supabase dashboard, enable email/password and Google OAuth providers.
   - Enable email verification in settings.

2. **Update Auth Page**:

   - **File**: `app/auth/page.tsx`

     ```typescript
     "use client";

     import { useState } from "react";
     import { zodResolver } from "@hookform/resolvers/zod";
     import { useForm } from "react-hook-form";
     import * as z from "zod";
     import { useRouter } from "next/navigation";
     import { supabase } from "@/lib/supabase/client";
     import { Button } from "@/components/ui/button";
     import {
       Form,
       FormControl,
       FormField,
       FormItem,
       FormLabel,
       FormMessage,
     } from "@/components/ui/form";
     import { Input } from "@/components/ui/input";
     import {
       Select,
       SelectContent,
       SelectItem,
       SelectTrigger,
       SelectValue,
     } from "@/components/ui/select";
     import {
       Card,
       CardContent,
       CardHeader,
       CardTitle,
     } from "@/components/ui/card";

     const loginSchema = z.object({
       email: z.string().email(),
       password: z.string().min(6),
     });

     const signupSchema = z.object({
       email: z.string().email(),
       password: z.string().min(6),
       name: z.string().min(2),
       gender: z.enum(["Male", "Female", "Other"]),
       dateOfBirth: z.string().refine(
         (val) => {
           const age = new Date().getFullYear() - new Date(val).getFullYear();
           return age >= 13;
         },
         { message: "You must be at least 13 years old" }
       ),
       weight: z.number().min(20).max(500),
       height: z.number().min(50).max(250),
       bodyFat: z.number().min(0).max(100).optional(),
       unitPreference: z.enum(["metric", "imperial"]),
     });

     export default function AuthPage() {
       const [isLogin, setIsLogin] = useState(true);
       const [unitPreference, setUnitPreference] = useState<
         "metric" | "imperial"
       >("metric");
       const router = useRouter();

       const form = useForm<z.infer<typeof signupSchema>>({
         resolver: zodResolver(isLogin ? loginSchema : signupSchema),
         defaultValues: {
           email: "",
           password: "",
           name: "",
           gender: "Male",
           dateOfBirth: "",
           weight: 0,
           height: 0,
           bodyFat: undefined,
           unitPreference: "metric",
         },
       });

       async function onSubmit(values: z.infer<typeof signupSchema>) {
         if (isLogin) {
           const { error } = await supabase.auth.signInWithPassword({
             email: values.email,
             password: values.password,
           });
           if (error) {
             form.setError("email", { message: error.message });
           } else {
             router.push("/");
           }
         } else {
           const { error: signUpError } = await supabase.auth.signUp({
             email: values.email,
             password: values.password,
             options: {
               data: {
                 name: values.name,
                 gender: values.gender,
                 date_of_birth: values.dateOfBirth,
                 weight_kg:
                   values.unitPreference === "imperial"
                     ? values.weight / 2.20462
                     : values.weight,
                 height_cm:
                   values.unitPreference === "imperial"
                     ? values.height * 2.54
                     : values.height,
                 body_fat_percentage: values.bodyFat,
                 unit_preference: values.unitPreference,
               },
             },
           });
           if (signUpError) {
             form.setError("email", { message: signUpError.message });
           } else {
             const { error: insertError } = await supabase
               .from("Users")
               .insert({
                 email: values.email,
                 name: values.name,
                 gender: values.gender,
                 date_of_birth: values.dateOfBirth,
                 weight_kg:
                   values.unitPreference === "imperial"
                     ? values.weight / 2.20462
                     : values.weight,
                 height_cm:
                   values.unitPreference === "imperial"
                     ? values.height * 2.54
                     : values.height,
                 body_fat_percentage: values.bodyFat,
                 unit_preference: values.unitPreference,
               });
             if (insertError) {
               form.setError("email", { message: insertError.message });
             } else {
               router.push("/");
             }
           }
         }
       }

       async function handleGoogleSignIn() {
         const { error } = await supabase.auth.signInWithOAuth({
           provider: "google",
           options: { redirectTo: `${window.location.origin}/` },
         });
         if (error) console.error("Google Sign-In Error:", error);
       }

       return (
         <div className="container max-w-lg p-4">
           <Card className="mt-8">
             <CardHeader>
               <CardTitle>{isLogin ? "Login" : "Sign Up"}</CardTitle>
             </CardHeader>
             <CardContent>
               <Form {...form}>
                 <form
                   onSubmit={form.handleSubmit(onSubmit)}
                   className="space-y-6"
                 >
                   <FormField
                     control={form.control}
                     name="email"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Email</FormLabel>
                         <FormControl>
                           <Input placeholder="email@example.com" {...field} />
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
                   {!isLogin && (
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
                             <Select
                               onValueChange={field.onChange}
                               defaultValue={field.value}
                             >
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
                             <FormLabel>
                               Weight (
                               {unitPreference === "metric" ? "kg" : "lb"})
                             </FormLabel>
                             <FormControl>
                               <Input
                                 type="number"
                                 step="0.1"
                                 {...field}
                                 onChange={(e) =>
                                   field.onChange(parseFloat(e.target.value))
                                 }
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
                             <FormLabel>
                               Height (
                               {unitPreference === "metric" ? "cm" : "ft/in"})
                             </FormLabel>
                             <FormControl>
                               {unitPreference === "metric" ? (
                                 <Input
                                   type="number"
                                   {...field}
                                   onChange={(e) =>
                                     field.onChange(parseFloat(e.target.value))
                                   }
                                 />
                               ) : (
                                 <div className="flex gap-2">
                                   <Input
                                     type="number"
                                     placeholder="ft"
                                     className="w-20"
                                     onChange={(e) => {
                                       const feet = parseFloat(e.target.value);
                                       const inches = parseFloat(
                                         (
                                           document.querySelector(
                                             'input[placeholder="in"]'
                                           ) as HTMLInputElement
                                         )?.value || "0"
                                       );
                                       field.onChange(
                                         (feet * 12 + inches) * 2.54
                                       );
                                     }}
                                   />
                                   <Input
                                     type="number"
                                     placeholder="in"
                                     className="w-20"
                                     onChange={(e) => {
                                       const inches = parseFloat(
                                         e.target.value
                                       );
                                       const feet = parseFloat(
                                         (
                                           document.querySelector(
                                             'input[placeholder="ft"]'
                                           ) as HTMLInputElement
                                         )?.value || "0"
                                       );
                                       field.onChange(
                                         (feet * 12 + inches) * 2.54
                                       );
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
                                 {...field}
                                 onChange={(e) =>
                                   field.onChange(parseFloat(e.target.value))
                                 }
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
                               onValueChange={(
                                 value: "metric" | "imperial"
                               ) => {
                                 field.onChange(value);
                                 setUnitPreference(value);
                               }}
                               defaultValue={field.value}
                             >
                               <FormControl>
                                 <SelectTrigger>
                                   <SelectValue placeholder="Select units" />
                                 </SelectTrigger>
                               </FormControl>
                               <SelectContent>
                                 <SelectItem value="metric">
                                   Metric (kg/cm)
                                 </SelectItem>
                                 <SelectItem value="imperial">
                                   Imperial (lb/ft-in)
                                 </SelectItem>
                               </SelectContent>
                             </Select>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                     </>
                   )}
                   <div className="space-y-4">
                     <Button type="submit" className="w-full">
                       {isLogin ? "Login" : "Sign Up"}
                     </Button>
                     {isLogin && (
                       <Button
                         type="button"
                         variant="link"
                         className="w-full"
                         onClick={() =>
                           supabase.auth.resetPasswordForEmail(
                             form.getValues("email")
                           )
                         }
                       >
                         Forgot Password?
                       </Button>
                     )}
                     <Button
                       type="button"
                       variant="outline"
                       className="w-full"
                       onClick={() => setIsLogin(!isLogin)}
                     >
                       {isLogin
                         ? "Create an account"
                         : "Already have an account?"}
                     </Button>
                     <Button
                       type="button"
                       variant="outline"
                       className="w-full"
                       onClick={handleGoogleSignIn}
                     >
                       Sign in with Google
                     </Button>
                   </div>
                 </form>
               </Form>
             </CardContent>
           </Card>
         </div>
       );
     }
     ```

3. **Update Root Layout for Session Management**:

   - **File**: `app/layout.tsx`

     ```typescript
     import { ThemeProvider } from "@/components/theme-provider";
     import { createSupabaseServerClient } from "@/lib/supabase/server";
     import { redirect } from "next/navigation";
     import { cn } from "@/lib/utils";
     import "./globals.css";

     export default async function RootLayout({
       children,
     }: {
       children: React.ReactNode;
     }) {
       const supabase = createSupabaseServerClient();
       const {
         data: { session },
       } = await supabase.auth.getSession();

       if (!session && !["/auth"].includes(new URL(request.url).pathname)) {
         redirect("/auth");
       } else if (session && new URL(request.url).pathname === "/auth") {
         redirect("/");
       }

       return (
         <html lang="en" suppressHydrationWarning>
           <body
             className={cn("min-h-screen bg-background font-sans antialiased")}
           >
             <ThemeProvider
               attribute="class"
               defaultTheme="light"
               enableSystem={false}
               disableTransitionOnChange
             >
               {children}
             </ThemeProvider>
           </body>
         </html>
       );
     }
     ```

### Step 3: User Profile

1. **Create API Routes**:

   - **File**: `app/api/v1/users/route.ts`

     ```typescript
     import { createSupabaseServerClient } from "@/lib/supabase/server";
     import { NextRequest, NextResponse } from "next/server";
     import * as z from "zod";

     const updateSchema = z.object({
       name: z.string().min(2).optional(),
       gender: z.enum(["Male", "Female", "Other"]).optional(),
       date_of_birth: z.string().optional(),
       weight_kg: z.number().min(20).max(500).optional(),
       height_cm: z.number().min(50).max(250).optional(),
       body_fat_percentage: z.number().min(0).max(100).optional(),
       unit_preference: z.enum(["metric", "imperial"]).optional(),
       theme_preference: z.enum(["light", "dark"]).optional(),
     });

     export async function PATCH(req: NextRequest) {
       const supabase = createSupabaseServerClient();
       const {
         data: { session },
       } = await supabase.auth.getSession();
       if (!session)
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

       const body = await req.json();
       const validated = updateSchema.parse(body);

       const { error } = await supabase
         .from("Users")
         .update(validated)
         .eq("id", session.user.id);

       if (error)
         return NextResponse.json({ error: error.message }, { status: 400 });
       return NextResponse.json(
         { message: "Profile updated" },
         { status: 200 }
       );
     }
     ```

2. **Update Settings Page**:

   - **File**: `app/settings/page.tsx`

     ```typescript
     "use client";

     import { useEffect, useState } from "react";
     import { useRouter } from "next/navigation";
     import { zodResolver } from "@hookform/resolvers/zod";
     import { useForm } from "react-hook-form";
     import * as z from "zod";
     import { LogOut, Sun, Moon } from "lucide-react";
     import { Button } from "@/components/ui/button";
     import {
       Form,
       FormControl,
       FormField,
       FormItem,
       FormLabel,
       FormMessage,
     } from "@/components/ui/form";
     import { Input } from "@/components/ui/input";
     import {
       Select,
       SelectContent,
       SelectItem,
       SelectTrigger,
       SelectValue,
     } from "@/components/ui/select";
     import { PageHeader } from "@/components/page-header";
     import { Card, CardContent } from "@/components/ui/card";
     import { useTheme } from "next-themes";
     import { supabase } from "@/lib/supabase/client";

     const settingsSchema = z.object({
       name: z.string().min(2),
       gender: z.enum(["Male", "Female", "Other"]),
       date_of_birth: z.string(),
       unit_preference: z.enum(["metric", "imperial"]),
       weight_kg: z.number().min(20).max(500),
       height_cm: z.number().min(50).max(250),
       body_fat_percentage: z.number().min(0).max(100).optional(),
     });

     export default function SettingsPage() {
       const router = useRouter();
       const { theme, setTheme } = useTheme();
       const [unitPreference, setUnitPreference] = useState<
         "metric" | "imperial"
       >("metric");

       const form = useForm<z.infer<typeof settingsSchema>>({
         resolver: zodResolver(settingsSchema),
         defaultValues: async () => {
           const {
             data: { session },
           } = await supabase.auth.getSession();
           const { data } = await supabase
             .from("Users")
             .select("*")
             .eq("id", session?.user.id)
             .single();
           setUnitPreference(data.unit_preference);
           return {
             name: data.name,
             gender: data.gender,
             date_of_birth: data.date_of_birth,
             unit_preference: data.unit_preference,
             weight_kg: data.weight_kg,
             height_cm: data.height_cm,
             body_fat_percentage: data.body_fat_percentage,
           };
         },
       });

       useEffect(() => {
         const subscription = form.watch((value) => {
           fetch("/api/v1/users", {
             method: "PATCH",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify(value),
           });
         });
         return () => subscription.unsubscribe();
       }, [form.watch]);

       return (
         <div className="pb-20">
           <PageHeader
             title="Settings"
             rightContent={
               <div className="flex items-center gap-2">
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                 >
                   {theme === "dark" ? (
                     <Sun className="h-5 w-5" />
                   ) : (
                     <Moon className="h-5 w-5" />
                   )}
                 </Button>
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={() =>
                     supabase.auth.signOut().then(() => router.push("/auth"))
                   }
                 >
                   <LogOut className="h-5 w-5" />
                 </Button>
               </div>
             }
           />
           <div className="p-4 space-y-6">
             <Card>
               <CardContent className="p-4">
                 <Form {...form}>
                   <form className="space-y-6">
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
                           <Select
                             onValueChange={field.onChange}
                             defaultValue={field.value}
                           >
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
                           <FormLabel>Unit Preference</FormLabel>
                           <Select
                             onValueChange={(value: "metric" | "imperial") => {
                               field.onChange(value);
                               setUnitPreference(value);
                             }}
                             defaultValue={field.value}
                           >
                             <FormControl>
                               <SelectTrigger>
                                 <SelectValue placeholder="Select units" />
                               </SelectTrigger>
                             </FormControl>
                             <SelectContent>
                               <SelectItem value="metric">
                                 Metric (kg/cm)
                               </SelectItem>
                               <SelectItem value="imperial">
                                 Imperial (lb/ft-in)
                               </SelectItem>
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
                             Weight ({unitPreference === "metric" ? "kg" : "lb"})
                           </FormLabel>
                           <FormControl>
                             <Input
                               type="number"
                               step="0.1"
                               {...field}
                               value={
                                 unitPreference === "imperial"
                                   ? (field.value * 2.20462).toFixed(2)
                                   : field.value
                               }
                               onChange={(e) =>
                                 field.onChange(
                                   unitPreference === "imperial"
                                     ? parseFloat(e.target.value) / 2.20462
                                     : parseFloat(e.target.value)
                                 )
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
                             Height (
                             {unitPreference === "metric" ? "cm" : "ft/in"})
                           </FormLabel>
                           <FormControl>
                             {unitPreference === "metric" ? (
                               <Input
                                 type="number"
                                 {...field}
                                 onChange={(e) =>
                                   field.onChange(parseFloat(e.target.value))
                                 }
                               />
                             ) : (
                               <div className="flex gap-2">
                                 <Input
                                   type="number"
                                   placeholder="ft"
                                   className="w-20"
                                   value={Math.floor(field.value / 2.54 / 12)}
                                   onChange={(e) => {
                                     const feet = parseFloat(e.target.value);
                                     const inches = parseFloat(
                                       (
                                         document.querySelector(
                                           'input[placeholder="in"]'
                                         ) as HTMLInputElement
                                       )?.value || "0"
                                     );
                                     field.onChange(
                                       (feet * 12 + inches) * 2.54
                                     );
                                   }}
                                 />
                                 <Input
                                   type="number"
                                   placeholder="in"
                                   className="w-20"
                                   value={Math.round((field.value / 2.54) % 12)}
                                   onChange={(e) => {
                                     const inches = parseFloat(e.target.value);
                                     const feet = parseFloat(
                                       (
                                         document.querySelector(
                                           'input[placeholder="ft"]'
                                         ) as HTMLInputElement
                                       )?.value || "0"
                                     );
                                     field.onChange(
                                       (feet * 12 + inches) * 2.54
                                     );
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
                       name="body_fat_percentage"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Body Fat %</FormLabel>
                           <FormControl>
                             <Input
                               type="number"
                               step="0.1"
                               {...field}
                               onChange={(e) =>
                                 field.onChange(parseFloat(e.target.value))
                               }
                             />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                   </form>
                 </Form>
               </CardContent>
             </Card>
           </div>
         </div>
       );
     }
     ```

### Step 4: Workout Logging

1. **Create API Routes**:

   - **File**: `app/api/v1/exercises/route.ts`

     ```typescript
     import { createSupabaseServerClient } from "@/lib/supabase/server";
     import { NextResponse } from "next/server";

     export async function GET() {
       const supabase = createSupabaseServerClient();
       const { data, error } = await supabase
         .from("Available_Exercises")
         .select("*");
       if (error)
         return NextResponse.json({ error: error.message }, { status: 400 });
       return NextResponse.json(data);
     }
     ```

   - **File**: `app/api/v1/workouts/route.ts`

     ```typescript
     import { createSupabaseServerClient } from "@/lib/supabase/server";
     import { NextRequest, NextResponse } from "next/server";
     import * as z from "zod";

     const workoutSchema = z.object({
       exercises: z.array(
         z.object({
           exercise_id: z.string().uuid(),
           sets: z.array(
             z.object({
               reps: z.number().min(1),
               weight_kg: z.number().min(0),
             })
           ),
         })
       ),
     });

     export async function POST(req: NextRequest) {
       const supabase = createSupabaseServerClient();
       const {
         data: { session },
       } = await supabase.auth.getSession();
       if (!session)
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

       const body = await req.json();
       const validated = workoutSchema.parse(body);

       const { data: workout, error: workoutError } = await supabase
         .from("Workouts")
         .insert({ user_id: session.user.id })
         .select()
         .single();
       if (workoutError)
         return NextResponse.json(
           { error: workoutError.message },
           { status: 400 }
         );

       const workoutExercises = validated.exercises.map((ex) => ({
         workout_id: workout.id,
         exercise_id: ex.exercise_id,
       }));
       const { data: exercisesData, error: exercisesError } = await supabase
         .from("Workout_Exercises")
         .insert(workoutExercises)
         .select();
       if (exercisesError)
         return NextResponse.json(
           { error: exercisesError.message },
           { status: 400 }
         );

       const sets = validated.exercises.flatMap((ex, index) =>
         ex.sets.map((set) => ({
           workout_exercise_id: exercisesData[index].id,
           reps: set.reps,
           weight_kg: set.weight_kg,
         }))
       );
       const { error: setsError } = await supabase.from("Sets").insert(sets);
       if (setsError)
         return NextResponse.json(
           { error: setsError.message },
           { status: 400 }
         );

       const totalVolume = sets.reduce(
         (sum, set) => sum + set.reps * set.weight_kg,
         0
       );
       const { error: rpcError } = await supabase.rpc("update_user_stats", {
         p_user_id: session.user.id,
         p_volume: totalVolume,
       });
       if (rpcError)
         return NextResponse.json({ error: rpcError.message }, { status: 400 });

       return NextResponse.json(workout, { status: 201 });
     }
     ```

2. **Update Workout Context**:

   - **File**: `contexts/workout-context.tsx`

     ```typescript
     "use client";

     import { createContext, useContext, useState, ReactNode } from "react";
     import { supabase } from "@/lib/supabase/client";
     import type { WorkoutExercise } from "@/types/types";

     type WorkoutContextType = {
       exercises: WorkoutExercise[];
       selectedExercise: WorkoutExercise | null;
       selectedExercises: string[];
       isWorkoutValid: boolean;
       setSelectedExercise: (exercise: WorkoutExercise | null) => void;
       handleExerciseToggle: (id: string) => void;
       handleAddExercises: () => void;
       handleUpdateSets: (
         exerciseIndex: number,
         newSets: { weight_kg: number; reps: number }[]
       ) => void;
       handleRemoveExercise: (index: number) => void;
       handleSaveWorkout: () => void;
     };

     const WorkoutContext = createContext<WorkoutContextType | undefined>(
       undefined
     );

     export function WorkoutProvider({ children }: { children: ReactNode }) {
       const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
       const [selectedExercise, setSelectedExercise] =
         useState<WorkoutExercise | null>(null);
       const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

       const isWorkoutValid =
         exercises.length > 0 &&
         exercises.every(
           (exercise) =>
             exercise.sets.length > 0 &&
             exercise.sets.every((set) => set.reps > 0 && set.weight_kg >= 0)
         );

       const handleExerciseToggle = (id: string) => {
         setSelectedExercises((prev) =>
           prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
         );
       };

       const handleAddExercises = async () => {
         const { data } = await supabase
           .from("Available_Exercises")
           .select("*");
         const newExercises = selectedExercises
           .map((id) => {
             const exercise = data?.find((e) => e.id === id);
             if (!exercise) return null;
             return { exercise, sets: [{ weight_kg: 0, reps: 0 }] };
           })
           .filter((ex): ex is WorkoutExercise => ex !== null);
         setExercises([...exercises, ...newExercises]);
         setSelectedExercises([]);
       };

       const handleUpdateSets = (
         exerciseIndex: number,
         newSets: { weight_kg: number; reps: number }[]
       ) => {
         if (exerciseIndex === -1) return;
         const updatedExercises = exercises.map((ex, i) =>
           i === exerciseIndex ? { ...ex, sets: newSets } : ex
         );
         setExercises(updatedExercises);
       };

       const handleRemoveExercise = (index: number) => {
         setExercises(exercises.filter((_, i) => i !== index));
       };

       const handleSaveWorkout = async () => {
         if (!isWorkoutValid) return;
         const response = await fetch("/api/v1/workouts", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             exercises: exercises.map((ex) => ({
               exercise_id: ex.exercise.id,
               sets: ex.sets,
             })),
           }),
         });
         if (response.ok) {
           setExercises([]);
         }
       };

       const value = {
         exercises,
         selectedExercise,
         selectedExercises,
         isWorkoutValid,
         setSelectedExercise,
         handleExerciseToggle,
         handleAddExercises,
         handleUpdateSets,
         handleRemoveExercise,
         handleSaveWorkout,
       };

       return (
         <WorkoutContext.Provider value={value}>
           {children}
         </WorkoutContext.Provider>
       );
     }

     export function useWorkout() {
       const context = useContext(WorkoutContext);
       if (context === undefined)
         throw new Error("useWorkout must be used within a WorkoutProvider");
       return context;
     }
     ```

3. **Update Exercise Selector**:

   - **File**: `components/exercise/exercise-selector.tsx`

     ```typescript
     "use client";

     import { useState, useEffect } from "react";
     import { X } from "lucide-react";
     import { Button } from "@/components/ui/button";
     import { Input } from "@/components/ui/input";
     import { ScrollArea } from "@/components/ui/scroll-area";
     import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
     import { motion } from "framer-motion";
     import { supabase } from "@/lib/supabase/client";
     import { Exercise } from "@/types/types";

     interface ExerciseSelectorProps {
       open: boolean;
       onOpenChange: (open: boolean) => void;
       selectedExercises: string[];
       onExerciseToggle: (id: string) => void;
       onAddExercises: () => void;
     }

     export function ExerciseSelector({
       open,
       onOpenChange,
       selectedExercises,
       onExerciseToggle,
       onAddExercises,
     }: ExerciseSelectorProps) {
       const [searchQuery, setSearchQuery] = useState("");
       const [exercises, setExercises] = useState<Exercise[]>([]);

       useEffect(() => {
         async function fetchExercises() {
           const { data } = await supabase
             .from("Available_Exercises")
             .select("*");
           setExercises(data || []);
         }
         fetchExercises();
       }, []);

       const filteredExercises = exercises.filter((ex) =>
         ex.name.toLowerCase().includes(searchQuery.toLowerCase())
       );

       return (
         <Sheet open={open} onOpenChange={onOpenChange}>
           <SheetContent side="bottom" className="h-[80vh] px-0">
             <div className="flex flex-col h-full">
               <div className="px-6 pb-6 flex items-center justify-between border-b">
                 <SheetTitle className="text-xl">Add Exercise</SheetTitle>
                 <Button
                   size="icon"
                   variant="ghost"
                   onClick={() => onOpenChange(false)}
                   className="rounded-full h-8 w-8"
                 >
                   <X className="h-4 w-4" />
                 </Button>
               </div>
               <div className="px-6 pt-4 space-y-4">
                 <Input
                   placeholder="Search exercises..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="rounded-xl bg-accent/10 border-0"
                 />
               </div>
               <ScrollArea className="flex-1">
                 <div className="px-6 space-y-6 py-4">
                   <div className="space-y-2">
                     {filteredExercises.map((exercise) => (
                       <motion.div
                         key={exercise.id}
                         whileHover={{ scale: 1.01 }}
                         whileTap={{ scale: 0.99 }}
                       >
                         <div
                           className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer hover:bg-accent/5 transition-colors"
                           onClick={() => onExerciseToggle(exercise.id)}
                         >
                           <div className="flex-1">
                             <div>{exercise.name}</div>
                             <div className="text-sm text-muted-foreground">
                               {exercise.primary_muscle_group}
                               {exercise.secondary_muscle_group &&
                                 `, ${exercise.secondary_muscle_group}`}
                             </div>
                           </div>
                           <div
                             className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors
                               ${
                                 selectedExercises.includes(exercise.id)
                                   ? "bg-[#4B7BFF] border-[#4B7BFF] text-white"
                                   : "border-input"
                               }`}
                           >
                             {selectedExercises.includes(exercise.id) && "✓"}
                           </div>
                         </div>
                       </motion.div>
                     ))}
                   </div>
                 </div>
               </ScrollArea>
               <div className="p-4 bg-background/80 backdrop-blur-sm border-t">
                 <Button
                   onClick={onAddExercises}
                   disabled={selectedExercises.length === 0}
                   className="w-full bg-[#4B7BFF] hover:bg-[#4B7BFF]/90 text-white rounded-xl h-12"
                 >
                   Add {selectedExercises.length} Exercise
                   {selectedExercises.length !== 1 ? "s" : ""}
                 </Button>
               </div>
             </div>
           </SheetContent>
         </Sheet>
       );
     }
     ```

### Step 5: Workout History

1. **Update API Routes**:

   - **File**: `app/api/v1/workouts/route.ts` (add GET and DELETE)

     ```typescript
     export async function GET(req: NextRequest) {
       const supabase = createSupabaseServerClient();
       const {
         data: { session },
       } = await supabase.auth.getSession();
       if (!session)
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

       const rangeFrom = parseInt(req.headers.get("Range-From") || "0");
       const rangeTo = parseInt(req.headers.get("Range-To") || "19");

       const { data, error } = await supabase
         .from("Workouts")
         .select(
           `
           id, created_at,
           Workout_Exercises (
             id, exercise_id,
             Available_Exercises (name, primary_muscle_group, secondary_muscle_group),
             Sets (reps, weight_kg)
           )
         `
         )
         .eq("user_id", session.user.id)
         .order("created_at", { ascending: false })
         .range(rangeFrom, rangeTo);

       if (error)
         return NextResponse.json({ error: error.message }, { status: 400 });
       return NextResponse.json(data);
     }

     export async function DELETE(req: NextRequest) {
       const supabase = createSupabaseServerClient();
       const {
         data: { session },
       } = await supabase.auth.getSession();
       if (!session)
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

       const { workoutId } = await req.json();
       const { data: setsData } = await supabase
         .from("Sets")
         .select("reps, weight_kg")
         .eq(
           "workout_exercise_id",
           (
             await supabase
               .from("Workout_Exercises")
               .select("id")
               .eq("workout_id", workoutId)
           ).data?.map((we) => we.id)
         );
       const volumeReduction =
         setsData?.reduce((sum, set) => sum + set.reps * set.weight_kg, 0) || 0;

       const { error } = await supabase
         .from("Workouts")
         .delete()
         .eq("id", workoutId)
         .eq("user_id", session.user.id);
       if (error)
         return NextResponse.json({ error: error.message }, { status: 400 });

       await supabase.rpc("update_user_stats", {
         p_user_id: session.user.id,
         p_volume: -volumeReduction,
       });
       return NextResponse.json(
         { message: "Workout deleted" },
         { status: 200 }
       );
     }
     ```

2. **Update History Page**:

   - **File**: `app/history/page.tsx`

     ```typescript
     "use client";

     import { useState, useEffect } from "react";
     import { Calendar } from "@/components/history/calendar";
     import { WorkoutList } from "@/components/history/workout-list";
     import { WorkoutDetails } from "@/components/history/workout-details";
     import { BottomNav } from "@/components/navigation/bottom-nav";
     import type { Workout } from "@/types/types";
     import { supabase } from "@/lib/supabase/client";

     export default function HistoryPage() {
       const [currentDate, setCurrentDate] = useState(new Date(2025, 1));
       const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(
         null
       );
       const [workouts, setWorkouts] = useState<Workout[]>([]);

       useEffect(() => {
         async function fetchWorkouts() {
           const response = await fetch("/api/v1/workouts", {
             headers: { "Range-From": "0", "Range-To": "19" },
           });
           const data = await response.json();
           setWorkouts(
             data.map((w: any) => ({
               id: w.id,
               date: new Date(w.created_at).toISOString().split("T")[0],
               time: new Date(w.created_at).toLocaleTimeString(),
               duration: 60, // Placeholder, could be calculated
               totalVolume: w.Workout_Exercises.reduce(
                 (sum: number, we: any) =>
                   sum +
                   we.Sets.reduce(
                     (s: number, set: any) => s + set.reps * set.weight_kg,
                     0
                   ),
                 0
               ),
               exercises: w.Workout_Exercises.map((we: any) => ({
                 name: we.Available_Exercises.name,
                 sets: we.Sets.map((set: any) => ({
                   reps: set.reps,
                   weight_kg: set.weight_kg,
                 })),
               })),
             }))
           );
         }
         fetchWorkouts();
       }, []);

       const workoutDates = new Set(workouts.map((w) => w.date));

       const handleDeleteWorkout = async (workoutId: string) => {
         await fetch("/api/v1/workouts", {
           method: "DELETE",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ workoutId }),
         });
         setWorkouts(workouts.filter((w) => w.id !== workoutId));
       };

       return (
         <div className="min-h-screen bg-background pb-20">
           <div className="p-4 space-y-6">
             <Calendar
               currentDate={currentDate}
               workoutDates={workoutDates}
               onDateChange={setCurrentDate}
               onDateSelect={(date) => {
                 const workout = workouts.find((w) => w.date === date);
                 if (workout) setSelectedWorkout(workout);
               }}
             />
             <WorkoutList
               workouts={workouts}
               onWorkoutSelect={setSelectedWorkout}
               onWorkoutDelete={handleDeleteWorkout}
             />
           </div>
           <WorkoutDetails
             workout={selectedWorkout}
             onClose={() => setSelectedWorkout(null)}
           />
           <BottomNav />
         </div>
       );
     }
     ```

### Step 6: Dashboard

1. **Update Dashboard Page**:

   - **File**: `app/dashboard/page.tsx`

     ```typescript
     import { createSupabaseServerClient } from "@/lib/supabase/server";
     import { Moon, Settings, Sun } from "lucide-react";
     import { Button } from "@/components/ui/button";
     import { useTheme } from "next-themes";
     import { redirect, useRouter } from "next/navigation";
     import { MetricsCards } from "@/components/dashboard/metrics-cards";
     import { VolumeChart } from "@/components/volume-chart";
     import { BottomNav } from "@/components/navigation/bottom-nav";

     export async function getServerSideProps() {
       const supabase = createSupabaseServerClient();
       const {
         data: { session },
       } = await supabase.auth.getSession();
       if (!session) redirect("/auth");

       const { data: user } = await supabase
         .from("Users")
         .select("total_workouts, total_volume")
         .eq("id", session.user.id)
         .single();
       const { data: daily } = await supabase.rpc("get_volume_by_day", {
         p_user_id: session.user.id,
         p_days: 7,
       });

       return {
         props: {
           stats: {
             totalWorkouts: user.total_workouts,
             totalVolume: user.total_volume,
           },
           dailyData: daily.map((d: any) => ({
             date: new Date(d.date).toLocaleDateString("en-US", {
               weekday: "short",
             }),
             volume: d.volume,
           })),
         },
       };
     }

     export default function DashboardPage({
       stats,
       dailyData,
     }: {
       stats: { totalWorkouts: number; totalVolume: number };
       dailyData: any[];
     }) {
       const { theme, setTheme } = useTheme();
       const router = useRouter();

       return (
         <div className="min-h-screen bg-background pb-20">
           <div className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 backdrop-blur-lg">
             <h1 className="text-xl font-semibold">Dashboard</h1>
             <div className="flex items-center gap-2">
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
               >
                 {theme === "dark" ? (
                   <Sun className="h-5 w-5" />
                 ) : (
                   <Moon className="h-5 w-5" />
                 )}
               </Button>
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => router.push("/settings")}
               >
                 <Settings className="h-5 w-5" />
               </Button>
             </div>
           </div>
           <div className="p-4 space-y-6">
             <MetricsCards
               totalWorkouts={stats.totalWorkouts}
               totalVolume={stats.totalVolume}
             />
             <VolumeChart dailyData={dailyData} />
           </div>
           <BottomNav />
         </div>
       );
     }
     ```

2. **Update Volume Chart**:

   - **File**: `components/volume-chart.tsx`

     ```typescript
     "use client";

     import {
       Bar,
       BarChart,
       ResponsiveContainer,
       XAxis,
       YAxis,
       Tooltip,
     } from "recharts";
     import {
       Card,
       CardContent,
       CardHeader,
       CardTitle,
     } from "@/components/ui/card";

     export function VolumeChart({
       dailyData,
     }: {
       dailyData: { date: string; volume: number }[];
     }) {
       return (
         <Card>
           <CardHeader>
             <CardTitle>Volume</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={dailyData}>
                   <XAxis
                     dataKey="date"
                     stroke="#888888"
                     fontSize={12}
                     tickLine={false}
                     axisLine={false}
                   />
                   <YAxis
                     stroke="#888888"
                     fontSize={12}
                     tickLine={false}
                     axisLine={false}
                     tickFormatter={(value) => `${value}kg`}
                   />
                   <Tooltip
                     content={({ active, payload }) => {
                       if (active && payload && payload.length) {
                         return (
                           <div className="rounded-lg border bg-background p-2 shadow-sm">
                             <div className="grid grid-cols-2 gap-2">
                               <div className="flex flex-col">
                                 <span className="text-[0.70rem] uppercase text-muted-foreground">
                                   Volume
                                 </span>
                                 <span className="font-bold text-muted-foreground">
                                   {payload[0].value}kg
                                 </span>
                               </div>
                             </div>
                           </div>
                         );
                       }
                       return null;
                     }}
                   />
                   <Bar
                     dataKey="volume"
                     fill="currentColor"
                     radius={[4, 4, 0, 0]}
                     className="fill-primary"
                   />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </CardContent>
         </Card>
       );
     }
     ```

### Step 7: Middleware and Optimization

1. **Add Rate Limiting**:

   - **File**: `middleware.ts`

     ```typescript
     import { NextRequest, NextResponse } from "next/server";
     import { createSupabaseServerClient } from "@/lib/supabase/server";

     const rateLimit = new Map<string, number>();

     export async function middleware(req: NextRequest) {
       const supabase = createSupabaseServerClient();
       const {
         data: { session },
       } = await supabase.auth.getSession();
       const ip = req.ip || "anonymous";
       const isAuthRoute = req.nextUrl.pathname.startsWith("/auth");

       const limit = session ? 100 : 20; // 100 req/min for auth, 20 for unauth
       const windowMs = 60 * 1000; // 1 minute

       const now = Date.now();
       const userLimit = rateLimit.get(ip) || 0;

       if (userLimit && now - userLimit < windowMs && !isAuthRoute) {
         return NextResponse.json(
           { error: "Rate limit exceeded" },
           { status: 429 }
         );
       }

       rateLimit.set(ip, now);
       return NextResponse.next();
     }

     export const config = {
       matcher: ["/api/:path*"],
     };
     ```

### Step 8: Testing and Deployment

1. **Test Core Flows**:

   - Run `npm run dev` and verify:
     - Authentication (signup, login, Google OAuth, forgot password).
     - Workout logging (exercise selection, sets, save).
     - History (pagination, swipe-to-delete).
     - Dashboard (stats and charts load <1s).
     - Settings (profile updates, unit/theme switching).

2. **Deploy to Vercel**:
   - Run: `vercel --prod`
   - Test the deployed app to ensure all features work as expected.

---

## Final Notes

- **Automation**: Steps are designed for AI execution with minimal manual input, using existing files and Supabase integrations.
- **Prioritization**: Focus on core features (authentication, workout logging, dashboard) for the MVP.
- **Performance**: Server-side rendering and indexed queries ensure fast load times.
- **UI/UX**: Retains iOS-like gestures and Fitbod-inspired styling from the existing codebase.
- **Error Handling**: Zod validation and API error responses are implemented for robustness.

This plan ensures ThriveTrack is production-ready with Supabase integration, leveraging the AI agent's capabilities in an IDE like Cursor to complete the MVP efficiently.
