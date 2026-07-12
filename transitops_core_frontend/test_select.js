import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zzekcloougyvdefzbptj.supabase.co', 'sb_publishable_23uPa7sTcrnFnSz0EOICXg_fNCmNgDF');

async function testSelect() {
  const { data, error } = await supabase.from('vehicles').select('*');
  console.log("SELECT DATA:", data);
  console.log("ERROR:", error);
}

testSelect();
