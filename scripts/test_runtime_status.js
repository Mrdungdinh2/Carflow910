const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lupzvpxcuwwyhozeqlty.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cHp2cHhjdXd3eWhvemVxbHR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM2NzQ3MiwiZXhwIjoyMTA0OTQzNDcyfQ.70lovkOPMPtn_qShOqdXFpMfoA3zFwGVZAXor-tQR4k';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testStatus() {
  const { data: requestsData } = await supabase.from('vehicle_requests').select('*');
  const { data: driversData } = await supabase.from('drivers').select('*');
  const { data: vehiclesData } = await supabase.from('vehicles').select('*');

  // Map requests to frontend camelCase format as mapRequestFromDb does
  const mapReq = (db) => ({
    id: db.id,
    assignedVehicleId: db.assigned_vehicle_id || undefined,
    assignedDriverId: db.assigned_driver_id || undefined,
    status: db.status,
    destination: db.destination,
  });

  const requests = (requestsData || []).map(mapReq);

  console.log('--- TESTING DRIVER STATUSES ---');
  for (const d of driversData) {
    const driverId = d.id;
    const driverName = d.name ? d.name.toLowerCase() : '';
    const targetId = driverId.toLowerCase();

    const activeReq = requests.find(r => {
      if (r.status !== 'driver_accepted') return false;
      if (!r.assignedDriverId) return false;
      const assigned = r.assignedDriverId.toLowerCase();
      return assigned === targetId || (driverName && assigned === driverName);
    });

    const status = activeReq ? 'on_duty' : d.status;
    console.log(`Driver "${d.name}" (ID: ${d.id}): computed status = '${status}' (activeReq: ${activeReq ? activeReq.destination : 'none'})`);
  }

  console.log('\n--- TESTING VEHICLE STATUSES ---');
  for (const v of vehiclesData) {
    const activeReq = requests.find(r =>
      r.assignedVehicleId === v.id &&
      r.status === 'driver_accepted'
    );
    const status = activeReq ? 'in_use' : v.status;
    console.log(`Vehicle "${v.plate_number}" (${v.model}, ID: ${v.id}): computed status = '${status}' (activeReq: ${activeReq ? activeReq.destination : 'none'})`);
  }
}

testStatus().catch(console.error);
