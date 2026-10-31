import { supabase } from "./lib/supabaseClient.js";

export async function testConnection() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("❌ Connection error:", error.message);
      return { success: false, error: error.message };
    } else {
      console.log("🌸 Bloom connected to Supabase successfully!", data);
      return { success: true, data };
    }
  } catch (err) {
    console.error("❌ Supabase catch error:", err);
    return { success: false, error: err.message };
  }
}

testConnection();
