require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSupabase() {
  console.log("Testing Supabase Insert...");
  
  const { data, error } = await supabase.from("bus_timings").insert([{ 
    routeNumber: "TEST", 
    from: "TestOrigin", 
    to: "TestDest", 
    departureTime: "12:00", 
    isActive: true 
  }]).select().single();

  if (error) {
    console.error("SUPABASE ERROR:", error);
  } else {
    console.log("SUCCESS:", data);
  }
}

testSupabase();
