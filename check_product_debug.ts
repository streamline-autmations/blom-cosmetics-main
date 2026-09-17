
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProduct() {
  const slug = 'whispers-garden-collection';
  console.log(`Checking product with slug: ${slug}`);

  // Check products table
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (productError) {
    console.error('Error fetching from products:', productError);
  } else if (product) {
    console.log('Found in products table:', JSON.stringify(product, null, 2));
  } else {
    console.log('Not found in products table');
  }

  // Check bundles table
  const { data: bundle, error: bundleError } = await supabase
    .from('bundles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (bundleError) {
    console.error('Error fetching from bundles:', bundleError);
  } else if (bundle) {
    console.log('Found in bundles table:', JSON.stringify(bundle, null, 2));
  } else {
    console.log('Not found in bundles table');
  }
}

checkProduct();
