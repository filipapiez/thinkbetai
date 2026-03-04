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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const adminUser = userData.user;
    if (!adminUser) throw new Error("Not authenticated");

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized: admin role required");
    logStep("Admin verified", { adminId: adminUser.id });

    const { target_user_id } = await req.json();
    if (!target_user_id) throw new Error("target_user_id is required");
    logStep("Target user", { target_user_id });

    // Get target user's email from profiles
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("email")
      .eq("user_id", target_user_id)
      .single();

    if (!profile?.email) throw new Error("Target user email not found");
    logStep("Found target email", { email: profile.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: profile.email, limit: 1 });
    if (customers.data.length === 0) {
      // No Stripe customer — just revoke DB access
      await supabaseClient
        .from("profiles")
        .update({ subscription_status: "canceled", has_access: false, access_type: null })
        .eq("user_id", target_user_id);

      logStep("No Stripe customer, revoked DB access");
      return new Response(JSON.stringify({ success: true, message: "Access revoked (no Stripe customer)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;

    // Cancel all active subscriptions
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active" });
    let canceledCount = 0;

    for (const sub of subscriptions.data) {
      await stripe.subscriptions.cancel(sub.id);
      canceledCount++;
      logStep("Canceled subscription", { subId: sub.id });
    }

    // Update profile
    await supabaseClient
      .from("profiles")
      .update({ subscription_status: "canceled", has_access: false, access_type: null })
      .eq("user_id", target_user_id);

    logStep("Profile updated, done", { canceledCount });

    return new Response(JSON.stringify({ success: true, canceled_count: canceledCount }), {
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
