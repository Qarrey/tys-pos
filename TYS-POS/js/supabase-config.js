//======================================================
// TYS POS
// SUPABASE CONNECTION
//======================================================

const SUPABASE_URL =
    "https://pmtrxotnrmzvvldioyqb.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_CnzUKPzoN4YV1W86fzP9wg_T3WygW15";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// Expose one shared client to every classic script in the POS.
window.supabaseClient = supabaseClient;

console.log("Supabase connected.");