-- ============================================================================
-- SCRIPT TO CHANGE COLLECTIONS TO BUNDLE DEALS
-- ============================================================================
-- Run this script in the Supabase SQL Editor to move specific collections
-- to the "Bundle Deals" category.
-- ============================================================================

-- 1. UPDATE PRODUCTS TABLE
-- Replace 'Your Collection Name Here' with the actual name of the collection
-- You can add multiple names to the list
UPDATE products
SET category = 'bundle-deals'
WHERE name IN (
  'Example Collection Name 1',
  'Example Collection Name 2'
  -- Add more names here...
);

-- 2. UPDATE BUNDLES TABLE
-- Do the same for bundles if your collection is stored as a bundle
UPDATE bundles
SET category = 'bundle-deals'
WHERE name IN (
  'Example Bundle Collection 1',
  'Example Bundle Collection 2'
);

-- 3. VERIFY CHANGES
-- Check if the category was updated correctly
SELECT id, name, category, product_type 
FROM products 
WHERE category = 'bundle-deals' AND name LIKE '%Collection%';

SELECT id, name, category 
FROM bundles 
WHERE category = 'bundle-deals' AND name LIKE '%Collection%';
