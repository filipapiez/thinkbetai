import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-CANCEL-SUB] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    if (!userData.user) throw new Error("Not authenticated");

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized: admin role required");
    logStep("Admin verified", { adminId: userData.user.id });

    const { target_user_id } = await req.json();
    if (!target_user_id) throw new Error("target_user_id is required");

    // Look up the user's profile for stripe_subscription_id
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("email, stripe_subscription_id, stripe_customer_id")
      .eq("user_id", target_user_id)
      .single();

    if (!profile?.email) throw new Error("Target user email not found");
    logStep("Found target", { email: profile.email, subId: profile.stripe_subscription_id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let subscriptionId = profile.stripe_subscription_id;
    let customerId = profile.stripe_customer_id;

    // If no subscription ID stored, find it via customer ID or email
    if (!subscriptionId) {
      logStep("No stored subscription ID, looking up in Stripe");

      // Step 1: resolve Stripe customer — prefer stored customer ID, then email
      if (!customerId) {
        const customers = await stripe.customers.list({ email: profile.email, limit: 1 });
        if (customers.data.length === 0) {
          return new Response(JSON.stringify({ success: false, error: "This user has no Stripe subscription linked." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404,
          });
        }
        customerId = customers.data[0].id;
      }

      logStep("Using Stripe customer", { customerId });

      // Step 2: find active subscription for this customer
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
      if (subs.data.length === 0) {
        // Save the customer ID we found, but don't revoke — let admin use Revoke button
        await supabaseClient
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", target_user_id);

        return new Response(JSON.stringify({ success: false, error: "No active subscription found for this Stripe customer.", stripe_customer_id: customerId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404,
        });
      }

      subscriptionId = subs.data[0].id;
    }

    // Set cancel_at_period_end on Stripe
    const updated = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      proration_behavior: "none",
    });

    const periodEnd = new Date((updated as any).current_period_end * 1000).toISOString();
    const customerId = typeof updated.customer === "string" ? updated.customer : (updated.customer as any)?.id;

    logStep("Set cancel_at_period_end", { subId: subscriptionId, periodEnd });

    // Update DB
    await supabaseClient
      .from("profiles")
      .update({
        subscription_status: updated.status,
        cancel_at_period_end: true,
        current_period_end: periodEnd,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId || profile.stripe_customer_id,
      })
      .eq("user_id", target_user_id);

    return new Response(JSON.stringify({
      success: true,
      subscription_status: updated.status,
      cancel_at_period_end: true,
      current_period_end: periodEnd,
      message: `Subscription will cancel on ${new Date(periodEnd).toLocaleDateString()}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
