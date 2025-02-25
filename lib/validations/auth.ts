import * as z from "zod";
import { calculateAge } from "../utils";
import { type Database } from "@/types/supabase";

// Type aliases from database schema
type UserInsert = Database['public']['Tables']['users']['Insert'];

const Gender = ["Male", "Female", "Other"] as const;
const UnitPreference = ["metric", "imperial"] as const;
const ThemePreference = ["light", "dark"] as const;

// Workaround for date_of_birth type issue
type UserInsertWithDateString = Omit<UserInsert, 'date_of_birth'> & {
  date_of_birth: string;
};

// Additional fields in the signup form not in the database
type SignupFields = {
  password: string;
};

// Type for the signup schema that uses string for date_of_birth
type SignupSchemaType = Omit<UserInsert, 'date_of_birth' | 'id' | 'created_at' | 'updated_at' | 'total_volume' | 'total_workouts'> & {
  date_of_birth: string;
  password: string;
};

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must include uppercase, lowercase, number and special character"
    ),
  name: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(Gender, {
    required_error: "Please select your gender",
  }),
  date_of_birth: z.string(),
  weight_kg: z
    .number()
    .min(20, "Weight must be at least 20 kg")
    .max(300, "Weight must be less than 300 kg"),
  height_cm: z
    .number()
    .min(50, "Height must be at least 50 cm")
    .max(250, "Height must be less than 250 cm"),
  body_fat_percentage: z
    .number()
    .min(1, "Body fat must be at least 1%")
    .max(50, "Body fat must be less than 50%")
    .optional(),
  unit_preference: z.enum(UnitPreference, {
    required_error: "Please select your unit preference",
  }),
  theme_preference: z.enum(ThemePreference, {
    required_error: "Please select your theme preference",
  }),
}) satisfies z.ZodType<SignupSchemaType>;

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signupSchema>;

// Export const enums for type safety
export const GENDER = Gender;
export const UNIT_PREFERENCE = UnitPreference;
export const THEME_PREFERENCE = ThemePreference;

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name is too long")
    .optional(),
  gender: z
    .enum(Gender, {
      required_error: "Please select your gender",
    })
    .optional(),
  weight_kg: z
    .number()
    .min(20, "Weight must be at least 20 kg")
    .max(300, "Weight must be less than 300 kg")
    .optional(),
  height_cm: z
    .number()
    .min(100, "Height must be at least 100 cm")
    .max(250, "Height must be less than 250 cm")
    .optional(),
  body_fat_percentage: z
    .number()
    .min(1, "Body fat percentage must be at least 1%")
    .max(100, "Body fat percentage must be less than 100%")
    .nullish()
    .optional(),
  unit_preference: z.enum(UnitPreference).default("metric").optional(),
  theme_preference: z.enum(ThemePreference).default("light").optional(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
