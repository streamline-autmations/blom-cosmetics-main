-- STEP 1: Run this FIRST to see all existing source values
SELECT DISTINCT source FROM contacts ORDER BY source;

-- STEP 2: Run this SECOND to see all existing status values  
SELECT DISTINCT status FROM contacts ORDER BY status;

-- STEP 3: Drop constraints (run separately)
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_source_check;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_status_check;

-- STEP 4: AFTER dropping constraints, DON'T add them back
-- Just leave the table without constraints for now
-- The signup will work without the constraints

-- OPTIONAL: If you want to add constraints later, first update any bad data:
-- UPDATE contacts SET source = 'website' WHERE source NOT IN ('website', 'popup', 'footer', 'beauty_club', 'contact_form', 'checkout', 'manual', 'import', 'api');
