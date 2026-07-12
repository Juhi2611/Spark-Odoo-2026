const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://zzekcloougyvdefzbptj.supabase.co', 'sb_publishable_23uPa7sTcrnFnSz0EOICXg_fNCmNgDF');

async function test() {
  const { data, error } = await supabase.from('vehicles').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Data:", data);
  }
}
test();
