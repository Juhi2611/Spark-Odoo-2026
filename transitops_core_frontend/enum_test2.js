import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://zzekcloougyvdefzbptj.supabase.co', 'sb_publishable_23uPa7sTcrnFnSz0EOICXg_fNCmNgDF');

async function testEnums() {
  const statuses = [
    'on_duty', 'off_duty', 'on_leave', 'available', 'on_trip', 'suspended',
    'On Duty', 'Off Duty', 'On Leave', 'Available', 'On Trip', 'Suspended',
    'active', 'inactive', 'Active', 'Inactive', 'Active', 'Idle'
  ];

  for (const s of statuses) {
    const payload = {
      name: 'Test',
      contact_number: '123',
      license_number: '123',
      status: s,
      license_expiry_date: '2025-01-01'
    };
    
    const { data, error } = await supabase.from('drivers').insert([payload]).select();
    if (error) {
      if (error.message.includes('invalid input value for enum')) {
        console.log(`[INVALID ENUM] ${s}`);
      } else {
        console.log(`[OTHER ERROR for ${s}]: ${error.message}`);
      }
    } else {
      console.log(`[SUCCESS!!!] Generated row with status: ${s}`);
      await supabase.from('drivers').delete().eq('id', data[0].id);
    }
  }
}
testEnums();
