# FitLite Frontend Guidelines

## Overview
Defines the frontend implementation for FitLite’s MVP, ensuring a native iOS-like experience with Fitbod-inspired styling, optimized for Next.js and AI tools.

## Design Principles
- **iOS Aesthetic**: Rounded corners (8px), minimal layout, spacious padding (16px), system font (San Francisco via Tailwind).
- **Gestures**: Smooth scrolling (iOS bounce effect), swipe-to-delete in History (react-swipeable), sliding for navigation.
- **Animations**: Use framer-motion for transitions (0.3s ease for slides, 0.2s for form feedback).
- **Themes**: Light mode default (#FFFFFF background, #333333 text, #3B82F6 accents), dark mode (Fitbod-inspired: #1C2526 background, #3B82F6 accents, #FFFFFF text) via next-themes.

## Component Guidelines
- **Shadcn Components**: Use for buttons, cards, forms, charts—customize for iOS look (e.g., rounded buttons, shadows).
- **Navigation**: Bottom bar (Home, History, Dashboard) with icons, top-right settings icon for Profile/Settings.
- **Forms**:
  - Labeled inputs with inline Zod error messages (red #FF0000).
  - Signup: Name, gender (dropdown), DOB (date picker), weight/height (number inputs, unit toggle), body fat %.
  - Workout Logging: Multi-select dropdown for exercises, sets (reps, weight with unit toggle).
- **Charts**: Static Chart.js bar charts (daily, weekly, monthly volume, user’s unit).

## Styling Details
- **Color Scheme**:
  - Light Mode: White background (#FFFFFF), gray text (#333333), blue accents (#3B82F6).
  - Dark Mode: Dark gray background (#1C2526), blue accents (#3B82F6), white text (#FFFFFF).
- **Typography**:
  - Use system font (San Francisco, default in iOS) via Tailwind CSS or Shadcn.
  - Headings: Bold, 16px; Body: Regular, 14px.
- **Layout**:
  - Rounded corners (radius: 8px) for buttons, cards, inputs.
  - Minimalistic, spacious design with 16px padding/margins.
  - Responsive: Mobile-first, iOS breakpoints (e.g., 375px, 768px).
- **Components**:
  - Buttons: Full-width on mobile, rounded, primary blue (#3B82F6).
  - Cards: Shadow (0 2px 4px rgba(0,0,0,0.1)), white/light gray background.
  - Forms: Labeled inputs, inline errors in red (#FF0000).

## Performance
- Use server-side rendering with `getServerSideProps` for dashboard and paginated history.
- Minimize re-renders with React Context API; lazy-load non-critical components.

## Coding Standards
- TypeScript for all components; modular, reusable code in `components/ui/`.
- Use Tailwind CSS for styling; ensure mobile-first responsiveness (iOS breakpoints: 375px, 768px).
- Avoid inline styles; leverage Shadcn’s utility classes.

## Notes for AI
- Generate components in `components/`; ensure iOS-like UX with react-swipeable and framer-motion.
- Reference FitLite’s User Flow for design specifics.
- Prioritize performance and simplicity for one-day MVP completion.

## Few Key Points
- Clear Error Messages:
  - The app uses Zod for validation, but users might not understand errors like "Invalid input."
  - Why It Matters: Users need to know why their input is wrong (e.g., "Weight must be between 20kg and 500kg").
  - How to Fix: In the frontend forms, display specific error messages next to fields. Example:
    - // For a weight input field:
    - {errors.weight_kg && <p className="text-red-500">Weight must be between 20kg and 500kg.</p>}

- Users need confirmation that their actions worked.
  - Add toast notifications (pop-up messages):
    // After saving a workout:  
    import { toast } from 'react-hot-toast';  
    toast.success('Workout saved!');  