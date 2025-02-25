-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
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

-- Create Workouts table
CREATE TABLE Workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Available_Exercises table
CREATE TABLE Available_Exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  primary_muscle_group TEXT NOT NULL,
  secondary_muscle_group TEXT
);

-- Create Workout_Exercises table
CREATE TABLE Workout_Exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES Workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES Available_Exercises(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Sets table
CREATE TABLE Sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_exercise_id UUID REFERENCES Workout_Exercises(id) ON DELETE CASCADE,
  reps INTEGER NOT NULL,
  weight_kg FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Daily_Volume table
CREATE TABLE Daily_Volume (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES Users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  volume NUMERIC NOT NULL,
  UNIQUE (user_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_workouts_user_id ON Workouts(user_id);
CREATE INDEX idx_workouts_created_at ON Workouts(created_at);
CREATE INDEX idx_daily_volume_date ON Daily_Volume(date);

-- Create stored procedures
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

-- Seed initial exercise data
INSERT INTO Available_Exercises (id, name, primary_muscle_group, secondary_muscle_group) VALUES
  (uuid_generate_v4(), 'Bench Press', 'Chest', 'Triceps'),
  (uuid_generate_v4(), 'Squat', 'Legs', 'Glutes'),
  (uuid_generate_v4(), 'Deadlift', 'Back', 'Hamstrings'),
  (uuid_generate_v4(), 'Pull-up', 'Back', 'Biceps'),
  (uuid_generate_v4(), 'Shoulder Press', 'Shoulders', 'Triceps'),
  (uuid_generate_v4(), 'Push-up', 'Chest', 'Shoulders'),
  (uuid_generate_v4(), 'Lunge', 'Legs', 'Glutes'),
  (uuid_generate_v4(), 'Bent-Over Row', 'Back', 'Biceps');
