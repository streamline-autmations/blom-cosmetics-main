-- Fix order BL-MIJ9P3QJ by mapping order items to actual products
-- This will allow the order to be marked as paid without stock movement errors

-- First, let's see what products we have that match the order items
WITH product_matches AS (
  SELECT 
    p.id as product_id,
    p.name as product_name,
    'Colour Acrylics - 005' as target_name
  FROM products p 
  WHERE p.name ILIKE '%Colour Acrylics%' AND p.name ILIKE '%005%'
  LIMIT 1
  
  UNION ALL
  
  SELECT 
    p.id as product_id,
    p.name as product_name,
    'Colour Acrylics - Nude Snowkiss(E002)' as target_name
  FROM products p 
  WHERE p.name ILIKE '%Colour Acrylics%' AND (p.name ILIKE '%Nude%' OR p.name ILIKE '%Snowkiss%')
  LIMIT 1
  
  UNION ALL
  
  SELECT 
    p.id as product_id,
    p.name as product_name,
    'Core Acrylics - Blom Cover Pink (072)' as target_name
  FROM products p 
  WHERE p.name ILIKE '%Core Acrylics%' AND p.name ILIKE '%Blom Cover Pink%'
  LIMIT 1
  
  UNION ALL
  
  SELECT 
    p.id as product_id,
    p.name as product_name,
    'Core Acrylics - Crystal Clear (073)' as target_name
  FROM products p 
  WHERE p.name ILIKE '%Core Acrylics%' AND p.name ILIKE '%Crystal Clear%'
  LIMIT 1
  
  UNION ALL
  
  SELECT 
    p.id as product_id,
    p.name as product_name,
    'Core Acrylics - The Perfect Milky White (074)' as target_name
  FROM products p 
  WHERE p.name ILIKE '%Core Acrylics%' AND p.name ILIKE '%Milky White%'
  LIMIT 1
  
  UNION ALL
  
  SELECT 
    p.id as product_id,
    p.name as product_name,
    'Glitter Acrylic - 56g' as target_name
  FROM products p 
  WHERE p.name ILIKE '%Glitter%' AND p.name ILIKE '%56g%'
  LIMIT 1
  
  UNION ALL
  
  SELECT 
    p.id as product_id,
    p.name as product_name,
    'Nail Forms - Default' as target_name
  FROM products p 
  WHERE p.name ILIKE '%Nail Forms%' OR p.name ILIKE '%Nail Forms%Default%'
  LIMIT 1
  
  UNION ALL
  
  SELECT 
    p.id as product_id,
    p.name as product_name,
    'Hand Files - 5-Pack Bundle' as target_name
  FROM products p 
  WHERE p.name ILIKE '%Hand Files%' AND p.name ILIKE '%5-Pack%'
  LIMIT 1
  
  UNION ALL
  
  SELECT 
    p.id as product_id,
    p.name as product_name,
    'Colour Acrylics - 064' as target_name
  FROM products p 
  WHERE p.name ILIKE '%Colour Acrylics%' AND p.name ILIKE '%064%'
  LIMIT 1
  
  UNION ALL
  
  SELECT 
    p.id as product_id,
    p.name as product_name,
    'Colour Acrylics - 040' as target_name
  FROM products p 
  WHERE p.name ILIKE '%Colour Acrylics%' AND p.name ILIKE '%040%'
  LIMIT 1
)
SELECT * FROM product_matches;