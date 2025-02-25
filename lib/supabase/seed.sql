-- Seed available_exercises table with initial data
INSERT INTO available_exercises (id, name, primary_muscle_group, secondary_muscle_group) VALUES
  ('barbell-bench-press', 'Barbell Bench Press', 'Chest', 'Triceps'),
  ('bench-press', 'Bench Press', 'Chest', 'Triceps'),
  ('bent-over-row', 'Bent-Over Row', 'Back', 'Biceps'),
  ('shoulder-press', 'Shoulder Press', 'Shoulders', 'Triceps'),
  ('pull-up', 'Pull-up', 'Back', 'Biceps'),
  ('squats', 'Squats', 'Legs', 'Glutes'),
  ('deadlifts', 'Deadlifts', 'Back', 'Hamstrings'),
  ('calf-raises', 'Calf Raises', 'Legs', 'Calves')
ON CONFLICT (name) DO NOTHING;
