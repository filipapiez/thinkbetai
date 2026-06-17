import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: any) => {
  console.log(`[DELETE-ACCOUNT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr) throw new Error(`Auth error: ${userErr.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("Not authenticated");
    log("User authenticated", { userId: user.id, email: user.email });

    // Best-effort: cancel any active Stripe subscription on both keys
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_subscription_id, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const stripeKeys = [Deno.env.get("STRIPE_SECRET_KEY"), Deno.env.get("STRIPE_OLD_SECRET_KEY")]
      .filter((k): k is string => !!k && k.startsWith("sk_"));

    for (const key of stripeKeys) {
      try {
        const stripe = new Stripe(key, { apiVersion: "2025-08-27.basil" });
        let subId = profile?.stripe_subscription_id ?? null;

        if (!subId && user.email) {
          const customers = await stripe.customers.list({ email: user.email, limit: 5 });
          for (const c of customers.data) {
            const subs = await stripe.subscriptions.list({ customer: c.id, status: "all", limit: 5 });
            const active = subs.data.find((s) => s.status === "active" || s.status === "trialing");
            if (active) { subId = active.id; break; }
          }
        }

        if (subId) {
          await stripe.subscriptions.cancel(subId).catch((e) => log("Stripe cancel failed (ignored)", { e: String(e) }));
          log("Stripe subscription canceled", { subId });
        }
      } catch (e) {
        log("Stripe cleanup error (ignored)", { e: String(e) });
      }
    }

    // Delete profile row (cascades not guaranteed for non-FK related tables)
    await admin.from("profiles").delete().eq("user_id", user.id);
    await admin.from("user_roles").delete().eq("user_id", user.id);
    await admin.from("user_parlays").delete().eq("user_id", user.id);
    await admin.from("active_bets").delete().eq("user_id", user.id);

    // Finally delete the auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) throw new Error(`Failed to delete user: ${delErr.message}`);
    log("User deleted", { userId: user.id });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
