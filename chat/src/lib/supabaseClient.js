import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL ||
  import.meta.env?.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ofbezbmilnoiwgjyvhba.supabase.co";

const supabaseKey =
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_EvU6HsPT3gcUcP1gZkJNcA_Nbc3Z39X";

export const supabase = createClient(supabaseUrl, supabaseKey);
