import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: any) => {
  console.log(`[CANCEL-SUB] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("Not authenticated");
    log("User authenticated", { userId: user.id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("stripe_subscription_id, stripe_customer_id, current_period_end")
      .eq("user_id", user.id)
      .single();

    let subscriptionId = profile?.stripe_subscription_id ?? null;
    let customerId = profile?.stripe_customer_id ?? null;

    if (!subscriptionId) {
      if (!customerId) {
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length === 0) throw new Error("No Stripe customer found");
        customerId = customers.data[0].id;
      }
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
      if (subs.data.length === 0) throw new Error("No active subscription found");
      subscriptionId = subs.data[0].id;
    }

    const updated = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      proration_behavior: "none",
    });

    const cpeSec = (updated as any).current_period_end;
    const periodEnd = typeof cpeSec === "number" && Number.isFinite(cpeSec)
      ? new Date(cpeSec * 1000).toISOString()
      : profile?.current_period_end ?? null;
    const resolvedCustomerId = typeof updated.customer === "string" ? updated.customer : (updated.customer as any)?.id;

    await supabaseClient
      .from("profiles")
      .update({
        subscription_status: updated.status,
        cancel_at_period_end: true,
        current_period_end: periodEnd,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: resolvedCustomerId || customerId,
      })
      .eq("user_id", user.id);

    log("Subscription set to cancel at period end", { subscriptionId, periodEnd });

    return new Response(JSON.stringify({
      success: true,
      cancel_at_period_end: true,
      current_period_end: periodEnd,
      message: periodEnd
        ? `Subscription will cancel on ${new Date(periodEnd).toLocaleDateString()}`
        : "Subscription scheduled to cancel at period end",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
