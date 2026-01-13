-- ============================================
-- Make Your Account an Admin
-- ============================================
-- Run this in Supabase SQL Editor after signing up
-- Replace 'your-email@example.com' with your actual email

-- Step 1: Find your user ID from auth.users
-- (This query shows you all signed up users)
SELECT id, email, created_at FROM auth.users;

-- Step 2: Create your doctor profile and link to your auth account
-- REPLACE the email below with YOUR email!
INSERT INTO doctors (name, email, team_key, role, user_id, is_active)
SELECT 
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
  email,
  'ESU' as team_key,  -- You can change this to your actual team
  'admin' as role,    -- This makes you an admin!
  id as user_id,
  true as is_active
FROM auth.users
WHERE email = 'your-email@example.com'  -- ⚠️ CHANGE THIS TO YOUR EMAIL
ON CONFLICT (email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  role = 'admin';

-- Step 3: Verify it worked
SELECT * FROM doctors WHERE role = 'admin';

-- ============================================
-- Alternative: If you already have a doctor record, just update it:
-- ============================================
-- UPDATE doctors 
-- SET role = 'admin', 
--     user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com')
-- WHERE email = 'your-email@example.com';
