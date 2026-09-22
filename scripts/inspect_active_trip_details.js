const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lupzvpxcuwwyhozeqlty.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cHp2cHhjdXd3eWhvemVxbHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM2NzQ3MiwiZXhwIjoyMTA0OTQzNDcyfQ.70lovkOPMPtn_qShOqdXFpMfoA3zFwGVZAXor-tQR4k';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function inspectActive() {
  const { data: requests } = await supabase.from('vehicle_requests').select('*').eq('status', 'driver_accepted');
  console.log('ACTIVE REQUESTS (status = driver_accepted):');
  console.dir(requests, { depth: null });
}

inspectActive().catch(console.error);
