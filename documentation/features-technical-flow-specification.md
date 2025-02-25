# ThriveTrack Features/Technical Flow Specification

## Overview
This document provides a detailed breakdown of the feature specifications and technical flow for ThriveTrack, a fitness tracking web app designed for casual gym-goers and beginners. It outlines the user stories, requirements, and technical implementation details for each feature, ensuring a seamless and efficient development process.

---

## Feature Specifications

### Authentication
- **User Story**: As a new user, I want to sign up with my email or Google account and provide profile details, so I can start tracking workouts.
- **Requirements**:
  - Signup form: Collect name, gender (Male/Female/Other), date of birth (13+ years), weight (20-500 kg), height (50-250 cm), body fat % (0-100%), unit preference (metric/imperial, default metric).
  - Login: Email/password or Google OAuth; redirect to Home on success.
  - Add a "Forgot Password" link on the login page. When clicked, Supabase sends a reset email.
  - **Technical Specs**: Use Supabase Auth; validate inputs with Zod (e.g., email format, min age); store in Users table.

### Workout Logging (Home Page)
- **User Story**: As a user, I want to log workouts with multiple exercises and sets, selecting from a dynamic list, so I can track my activity.
- **Requirements**:
  - Multi-select dropdown fetching exercises from `Available_Exercises` (e.g., "Bench Press (Chest, Triceps)").
  - Add multiple sets per exercise (reps, weight in user’s unit).
  - Buttons: "Add Set," "Add Exercise," "Save Workout."
  - **Technical Specs**: POST to Supabase Workouts table; update `Users.total_volume`, `Users.total_workouts`, and `Daily_Volume` in a transaction.

### Workout History
- **User Story**: As a user, I want to see my past workouts by date, so I can review my progress.
- **Requirements**:
  - List workouts with date, exercises, sets (reps/weights in user’s unit), and timestamps.
  - Paginate (20 items/page) with swipe gestures for navigation (e.g., swipe left to delete).
  - **Technical Specs**: GET from Workouts with joins to `Workout_Exercises`, `Sets`, and `Available_Exercises`; use Range headers for pagination.

### Dashboard
- **User Story**: As a user, I want an instant overview of my stats and volume trends, so I can assess my performance.
- **Requirements**:
  - Display total workouts and total volume (from Users table).
  - Static bar charts: last 7 days, 4 weeks, 6 months volume (from `Daily_Volume`).
  - **Technical Specs**: Server-side fetch with optimized queries (e.g., `get_volume_by_day` RPC); render charts with Chart.js.

### Profile/Settings
- **User Story**: As a user, I want to edit my profile and preferences, so I can customize my experience.
- **Requirements**:
  - Edit all signup fields, toggle units (updates all displays), switch theme (light/dark, Fitbod-inspired dark: #1C2526 background).
  - Logout button.
  - **Technical Specs**: PATCH to Users table; real-time UI updates via Context API for unit/theme changes.

---

## Technical Flow Specification

### App Initialization
1. Check Supabase Auth session (server-side).
2. If authenticated, fetch user data (profile, preferences) and redirect to Home.
3. If not, redirect to Login/Signup.

### Login/Signup Flow
1. User submits email/password or Google OAuth.
2. Validate with Zod (e.g., email format, min age 13).
3. On signup, insert into Users with default metric unit and light theme.
4. Return session token, redirect to Home.

### Workout Logging Flow
1. Fetch `Available_Exercises` (GET /rest/v1/available_exercises).
2. User selects exercises, adds sets (reps, weight converted to kg if imperial).
3. On "Save," POST to /rest/v1/workouts:
   - Insert Workout, Workout_Exercises, Sets.
   - Update `Users.total_volume`, `Users.total_workouts`, and `Daily_Volume` in a transaction.

### History Flow
1. GET /rest/v1/workouts with pagination (Range: items=0-19).
2. Join `Workout_Exercises`, `Sets`, and `Available_Exercises`.
3. Convert weights to user’s unit for display.
4. Render paginated list with swipe-to-delete (react-swipeable, framer-motion).

### Dashboard Flow
1. Server-side fetch (getServerSideProps):
   - Total stats from Users.
   - Volume data from `Daily_Volume` (7 days, 4 weeks, 6 months).
2. Render static Chart.js bar charts.
3. Adjust volume display to user’s unit.

### Profile/Settings Flow
1. Fetch current user data.
2. On update, validate with Zod, PATCH to /rest/v1/users.
3. Update Context API state for unit/theme changes (next-themes for Fitbod dark: #1C2526, #3B82F6).

---

## Notes for AI
- Use Context API for unit-locking state during workouts.
- Ensure iOS-like gestures and theme switching.
- Optimize for one-day completion, focusing on core flows.