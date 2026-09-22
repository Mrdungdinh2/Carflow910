const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lupzvpxcuwwyhozeqlty.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cHp2cHhjdXd3eWhvemVxbHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM2NzQ3MiwiZXhwIjoyMTA0OTQzNDcyfQ.70lovkOPMPtn_qShOqdXFpMfoA3zFwGVZAXor-tQR4k';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkIds() {
  const { data: drivers } = await supabase.from('drivers').select('*');
  console.log('DRIVERS IN SUPABASE:');
  console.dir(drivers, { depth: null });

  const { data: users } = await supabase.from('users').select('*').eq('role', 'driver');
  console.log('USER ACCOUNTS (ROLE DRIVER):');
  console.dir(users, { depth: null });

  const { data: vehicles } = await supabase.from('vehicles').select('*');
  console.log('VEHICLES IN SUPABASE:');
  console.dir(vehicles, { depth: null });
}

checkIds().catch(console.error);
