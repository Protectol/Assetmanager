const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const testId = process.argv[2] || "81bb438c-cd46-471f-a608-74010c9ca6c4";

async function testLookup(label, key) {
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const fields =
    "id, asset_name, asset_tag, asset_type, serial_number, brand, model, condition, status, current_holder_id, has_sim, sim_number";

  const byId = await supabase.from("assets").select(fields).eq("id", testId).maybeSingle();
  console.log(`\n[${label}] by id:`);
  console.log("  error:", byId.error?.message || null);
  console.log("  data:", byId.data ? `${byId.data.asset_tag} (${byId.data.asset_name})` : null);

  const baseFields =
    "id, asset_name, asset_tag, asset_type, serial_number, brand, model, condition, status, current_holder_id";
  const byIdBase = await supabase.from("assets").select(baseFields).eq("id", testId).maybeSingle();
  console.log(`[${label}] by id (base fields):`);
  console.log("  error:", byIdBase.error?.message || null);
  console.log("  data:", byIdBase.data ? `${byIdBase.data.asset_tag} (${byIdBase.data.asset_name})` : null);

  const count = await supabase.from("assets").select("id", { count: "exact", head: true });
  console.log(`[${label}] total assets visible:`, count.count, count.error?.message || "");
}

async function main() {
  console.log("Supabase URL:", url);
  console.log("Service role key set:", !!serviceKey);
  console.log("Anon key set:", !!anonKey);
  console.log("Testing asset id:", testId);

  if (serviceKey) await testLookup("service_role", serviceKey);
  await testLookup("anon", anonKey);
}

main().catch(console.error);
