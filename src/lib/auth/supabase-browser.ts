import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

function getClient() {
  if (browserClient) return browserClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase browser configuration is missing");
  browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

// Delay client creation until browser code uses it. This lets the app build without
// deployment secrets while still failing clearly when auth is actually used.
export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
