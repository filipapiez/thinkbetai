import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-UNDO-CANCEL] ${step}${detailsStr}`);
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

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("email, stripe_subscription_id")
      .eq("user_id", target_user_id)
      .single();

    if (!profile?.stripe_subscription_id) throw new Error("No subscription ID found for user");
    logStep("Found subscription", { subId: profile.stripe_subscription_id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const updated = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    const periodEnd = new Date((updated as any).current_period_end * 1000).toISOString();
    logStep("Undo cancel", { subId: profile.stripe_subscription_id, status: updated.status });

    await supabaseClient
      .from("profiles")
      .update({
        subscription_status: updated.status,
        cancel_at_period_end: false,
        current_period_end: periodEnd,
        has_access: true,
      })
      .eq("user_id", target_user_id);

    return new Response(JSON.stringify({
      success: true,
      subscription_status: updated.status,
      cancel_at_period_end: false,
      current_period_end: periodEnd,
      message: "Cancellation undone — subscription will renew",
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
