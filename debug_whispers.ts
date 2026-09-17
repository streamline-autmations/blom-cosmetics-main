
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

async function debugProduct() {
  const slug = 'whispers-garden-collection';
  console.log(`Analyzing slug: ${slug}`);

  // 1. Check Products Table
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  
  if (product) {
    console.log('\n[PRODUCTS TABLE MATCH]');
    console.log('ID:', product.id);
    console.log('Name:', product.name);
    console.log('Category:', product.category);
    console.log('Images:', product.images);
    console.log('Image URL:', product.image_url);
    console.log('Gallery URLs:', product.gallery_urls);
  } else {
    console.log('\n[PRODUCTS TABLE] No match found.');
  }

  // 2. Check Bundles Table
  const { data: bundle, error: bundleError } = await supabase
    .from('bundles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (bundle) {
    console.log('\n[BUNDLES TABLE MATCH]');
    console.log('ID:', bundle.id);
    console.log('Name:', bundle.name);
    console.log('Images:', bundle.images);
    console.log('Image URL:', bundle.image_url);
  } else {
    console.log('\n[BUNDLES TABLE] No match found.');
  }
}

debugProduct();
