import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getPlanIdFromPriceId } from "../_shared/stripePlans.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd: string | null = null;
    let productId: string | null = null;
    let priceId: string | null = null;
    let planId: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      const periodEnd = (subscription as any).current_period_end;
      if (typeof periodEnd === "number" && Number.isFinite(periodEnd)) {
        subscriptionEnd = new Date(periodEnd * 1000).toISOString();
      } else {
        // Avoid throwing "Invalid time value" and still allow access sync.
        logStep("Missing/invalid current_period_end", { periodEnd });
      }

      const item = subscription.items?.data?.[0];
      productId = (item?.price?.product as string | undefined) ?? null;
      priceId = (item?.price?.id as string | undefined) ?? null;
      planId = getPlanIdFromPriceId(priceId);

      logStep("Active subscription found", {
        subscriptionId: subscription.id,
        endDate: subscriptionEnd,
        productId,
        priceId,
        planId,
      });

      // Update profile subscription status
      // IMPORTANT: access_type must match our DB constraint, so store planId (basic/pro/insider).
      const updatePayload: Record<string, any> = {
        subscription_status: "active",
        has_access: true,
      };
      if (planId) updatePayload.access_type = planId;

      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update(updatePayload)
        .eq("user_id", user.id);

      if (updateError) {
        logStep("Error updating profile", { error: updateError.message, updatePayload });
      } else {
        logStep("Profile updated with active subscription", { access_type: updatePayload.access_type });
      }
    } else {
      logStep("No active subscription found");

      // Check if user still has access via promo code
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("promo_used, has_access")
        .eq("user_id", user.id)
        .single();

      // Only update to inactive if they don't have promo access
      if (!profile?.promo_used) {
        await supabaseClient
          .from("profiles")
          .update({ subscription_status: "inactive", has_access: false })
          .eq("user_id", user.id);
      }
    }

    return new Response(
      JSON.stringify({
        subscribed: hasActiveSub,
        product_id: productId,
        subscription_end: subscriptionEnd,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
