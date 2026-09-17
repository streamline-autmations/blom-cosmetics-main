
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yvmnedjybrpvlupygusf.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixSlug() {
  console.log('Updating slug for prep-solution...');
  
  const { data, error } = await supabase
    .from('products')
    .update({ slug: 'prep-solution' })
    .eq('id', '1c1386c9-5fe4-47a0-a780-ff9178b09433')
    .select();
    
  if (error) {
    console.error('Error updating slug:', error);
  } else {
    console.log('Slug updated successfully:', data);
  }
}

fixSlug();
