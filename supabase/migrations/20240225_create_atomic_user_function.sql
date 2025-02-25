-- Create function for atomic user creation
CREATE OR REPLACE FUNCTION create_user_with_profile(
  user_email TEXT,
  user_password TEXT,
  user_name TEXT,
  user_gender TEXT,
  user_dob DATE,
  user_weight FLOAT,
  user_height FLOAT,
  user_bf FLOAT,
  user_unit TEXT,
  user_theme TEXT
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Create auth user
  new_user_id := (
    SELECT id FROM auth.users 
    WHERE email = user_email
    LIMIT 1
  );

  IF new_user_id IS NULL THEN
    new_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object(
        'name', user_name,
        'gender', user_gender,
        'date_of_birth', user_dob,
        'unit_preference', user_unit,
        'theme_preference', user_theme
      ),
      NOW(),
      NOW()
    );
  END IF;

  -- Create profile in Users table
  INSERT INTO public.Users (
    id,
    email,
    name,
    gender,
    date_of_birth,
    weight_kg,
    height_cm,
    body_fat_percentage,
    unit_preference,
    theme_preference,
    total_volume,
    total_workouts,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    user_email,
    user_name,
    user_gender,
    user_dob,
    user_weight,
    user_height,
    user_bf,
    user_unit,
    user_theme,
    0,
    0,
    NOW(),
    NOW()
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_with_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_with_profile TO service_role;
