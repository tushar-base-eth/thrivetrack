-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
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

-- Create workouts table
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create available_exercises table
CREATE TABLE available_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  primary_muscle_group TEXT NOT NULL,
  secondary_muscle_group TEXT
);

-- Create workout_exercises table
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES available_exercises(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sets table
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
  reps INTEGER NOT NULL,
  weight_kg FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create daily_volume table
CREATE TABLE daily_volume (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  volume NUMERIC NOT NULL,
  UNIQUE (user_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_created_at ON workouts(created_at);
CREATE INDEX idx_daily_volume_date ON daily_volume(date);

-- Create stored procedures
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id UUID, p_volume NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET total_volume = total_volume + p_volume,
      total_workouts = total_workouts + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id;

  INSERT INTO daily_volume (user_id, date, volume)
  VALUES (p_user_id, CURRENT_DATE, p_volume)
  ON CONFLICT (user_id, date)
  DO UPDATE SET volume = daily_volume.volume + EXCLUDED.volume;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_total_volume(p_user_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN (SELECT total_volume FROM users WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_volume_by_day(p_user_id UUID, p_days INTEGER)
RETURNS TABLE (date DATE, volume NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT dv.date, dv.volume
  FROM daily_volume dv
  WHERE dv.user_id = p_user_id
  AND dv.date > CURRENT_DATE - p_days
  ORDER BY dv.date ASC;
END;
$$ LANGUAGE plpgsql;

-- Seed initial exercise data
INSERT INTO available_exercises (id, name, primary_muscle_group, secondary_muscle_group) VALUES
  (uuid_generate_v4(), 'Bench Press', 'Chest', 'Triceps'),
  (uuid_generate_v4(), 'Squat', 'Legs', 'Glutes'),
  (uuid_generate_v4(), 'Deadlift', 'Back', 'Hamstrings'),
  (uuid_generate_v4(), 'Pull-up', 'Back', 'Biceps'),
  (uuid_generate_v4(), 'Shoulder Press', 'Shoulders', 'Triceps'),
  (uuid_generate_v4(), 'Push-up', 'Chest', 'Shoulders'),
  (uuid_generate_v4(), 'Lunge', 'Legs', 'Glutes'),
  (uuid_generate_v4(), 'Bent-Over Row', 'Back', 'Biceps');
