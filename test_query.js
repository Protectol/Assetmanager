const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase
    .from('assets')
    .select('id, has_sim')
    .limit(1);
  console.log('Error:', error);
}

test();
