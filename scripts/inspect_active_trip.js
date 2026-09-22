const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lupzvpxcuwwyhozeqlty.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cHp2cHhjdXd3eWhvemVxbHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM2NzQ3MiwiZXhwIjoyMTA0OTQzNDcyfQ.70lovkOPMPtn_qShOqdXFpMfoA3zFwGVZAXor-tQR4k';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function inspect() {
  console.log('=== INSPECTING DRIVERS, VEHICLES & VEHICLE REQUESTS ===\n');

  const { data: drivers } = await supabase.from('drivers').select('*');
  console.log('DRIVERS:');
  console.dir(drivers, { depth: null });

  const { data: vehicles } = await supabase.from('vehicles').select('*');
  console.log('\nVEHICLES:');
  console.dir(vehicles, { depth: null });

  const { data: requests } = await supabase.from('vehicle_requests').select('*').order('created_at', { ascending: false });
  console.log('\nVEHICLE REQUESTS (First 5):');
  console.dir(requests ? requests.slice(0, 5) : [], { depth: null });
}

inspect().catch(console.error);
