-- Beauty Club Signup Data Cleanup
-- This script removes existing contacts to allow re-signup with same email and phone

-- Step 1: First, let's see what records exist for these details
SELECT id, email, phone, name, status, source, created_at 
FROM contacts 
WHERE email = 'christiaansteffen12345@gmail.com'
   OR phone = '0837797935/+27837797935' 
   OR phone LIKE '%0837797935%'
   OR phone LIKE '%+27 83 779 7935%'
   OR phone LIKE '%27837797935%';

-- Step 2: Delete the records
DELETE FROM contacts 
WHERE email = 'christiaansteffen12345@gmail.com'
   OR phone = '0837797935/+27837797935' 
   OR phone LIKE '%0837797935%'
   OR phone LIKE '%+27 83 779 7935%'
   OR phone LIKE '%27837797935%';

-- Step 3: Verify deletion
SELECT 'Remaining records with these details:' as info;

SELECT id, email, phone, name, status, source, created_at 
FROM contacts 
WHERE email = 'christiaansteffen12345@gmail.com'
   OR phone = '0837797935/+27837797935' 
   OR phone LIKE '%0837797935%'
   OR phone LIKE '%+27 83 779 7935%'
   OR phone LIKE '%27837797935%';

-- Step 4: Also clear any related beauty club signup records if they exist
-- (This is optional but ensures complete cleanup)

-- If there's a beauty_club_signups table, clear those records too:
-- DELETE FROM beauty_club_signups WHERE email = 'christiaansteffen12345@gmail.com';

-- If there's a newsletter_subscriptions table, clear those records too:
-- DELETE FROM newsletter_subscriptions WHERE email = 'christiaansteffen12345@gmail.com';

-- Success message
SELECT 'Cleanup completed! Email and phone are now available for re-signup.' as status;