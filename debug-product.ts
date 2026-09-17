
import { createClient } from '@supabase/supabase-js';

// Use the values from the user's environment or hardcoded for testing if needed
// WARNING: These should be the ANON KEY, not service role, for testing client access.
// However, to debug if it exists at all, we might want service role if RLS is blocking.
// Let's try Anon first to match user experience.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yvmnedjybrpvlupygusf.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Use env var // Using provided Service Key for debugging

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkProduct() {
  console.log('Checking for prep-solution...');
  
  // 1. Exact match
  const { data: exact, error: exactError } = await supabase
    .from('products')
    .select('id, slug, name')
    .eq('slug', 'prep-solution');
    
  console.log('Exact match result:', exact);
  if (exactError) console.error('Exact match error:', exactError);

  // 2. Like match
  const { data: like, error: likeError } = await supabase
    .from('products')
    .select('id, slug, name')
    .ilike('slug', '%prep%');
    
  console.log('Like "prep" match result:', like);
  if (likeError) console.error('Like match error:', likeError);
  
  // 3. Check all slugs (limit 20)
  const { data: all, error: allError } = await supabase
    .from('products')
    .select('slug')
    .limit(20);
    
  console.log('First 20 slugs:', all?.map(p => p.slug));
}

checkProduct();
