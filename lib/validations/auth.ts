import * as z from "zod";
import { calculateAge } from "../utils";

const Gender = ["Male", "Female", "Other"] as const;
const UnitPreference = ["metric", "imperial"] as const;
const ThemePreference = ["light", "dark"] as const;

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
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  gender: z.enum(Gender, {
    required_error: "Please select your gender",
  }),
  date_of_birth: z.coerce
    .date()
    .refine(
      (date) => {
        const age = calculateAge(date);
        return age >= 13;
      },
      {
        message: "You must be at least 13 years old",
      }
    )
    .refine((date) => date <= new Date(), {
      message: "Birth date cannot be in the future",
    }),
  weight_kg: z
    .number()
    .min(20, "Weight must be at least 20 kg")
    .max(300, "Weight must be less than 300 kg"),
  height_cm: z
    .number()
    .min(100, "Height must be at least 100 cm")
    .max(250, "Height must be less than 250 cm"),
  body_fat_percentage: z
    .number()
    .min(1, "Body fat percentage must be at least 1%")
    .max(100, "Body fat percentage must be less than 100%")
    .nullish(),
  unit_preference: z.enum(UnitPreference).default("metric"),
  theme_preference: z.enum(ThemePreference).default("light"),
});

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
