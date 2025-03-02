/*
  # Add default admin user

  1. New Data
    - Add admin user with email drohit7789@gmail.com
    - Create profile for admin user
  
  2. Notes
    - This migration adds a default admin user for testing purposes
    - Password is set to '123456'
*/

-- First, we need to create the admin user in auth.users
-- We'll use the auth.users() function to create a new user with email and password
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Check if the user already exists
  SELECT id INTO admin_id FROM auth.users WHERE email = 'drohit7789@gmail.com';
  
  -- If the user doesn't exist, create it
  IF admin_id IS NULL THEN
    -- Create the user in auth.users
    SELECT id INTO admin_id FROM auth.users() WHERE email = 'drohit7789@gmail.com';
    
    -- If the user still doesn't exist, we need to insert it manually
    IF admin_id IS NULL THEN
      -- Generate a UUID for the new user
      admin_id := gen_random_uuid();
      
      -- Insert the user into auth.users
      INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at
      ) VALUES (
        admin_id,
        'drohit7789@gmail.com',
        -- This is a hashed version of '123456'
        crypt('123456', gen_salt('bf')),
        now(),
        now(),
        now()
      );
    END IF;
    
    -- Create a profile for the admin user
    INSERT INTO profiles (
      id,
      username,
      avatar_url,
      created_at
    ) VALUES (
      admin_id,
      'admin',
      'https://ui-avatars.com/api/?name=Admin&background=random',
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;