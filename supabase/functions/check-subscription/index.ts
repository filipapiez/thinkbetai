import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getPlanIdFromPriceId, getPlanIdFromAmount } from "../_shared/stripePlans.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

type StripeSubscriptionMatch = {
  customerId: string;
  subscriptionId: string;
  subscriptionStatus: string;
  subscriptionEnd: string | null;
  productId: string | null;
  priceId: string | null;
  planId: string | null;
  cancelAtPeriodEnd: boolean;
};

function getStripeKeys(): string[] {
  const keys = [Deno.env.get("STRIPE_SECRET_KEY"), Deno.env.get("STRIPE_OLD_SECRET_KEY")].filter(
    (key): key is string => Boolean(key && key.startsWith("sk_")),
  );
  return Array.from(new Set(keys));
}

function pickAccessibleSubscription(subscriptions: Stripe.Subscription[]): Stripe.Subscription | null {
  const nowMs = Date.now();

  for (const sub of subscriptions) {
    const periodEnd = (sub as any).current_period_end;
    const periodEndMs =
      typeof periodEnd === "number" && Number.isFinite(periodEnd) ? periodEnd * 1000 : Number.NaN;

    const keepsAccess =
      sub.status === "active" ||
      sub.status === "trialing" ||
      (sub.cancel_at_period_end && Number.isFinite(periodEndMs) && periodEndMs > nowMs);

    if (keepsAccess) return sub;
  }

  return null;
}

async function findSubscriptionForUser(
  stripeKey: string,
  userEmail: string,
  knownCustomerId?: string | null,
): Promise<StripeSubscriptionMatch | null> {
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const candidateCustomerIds: string[] = [];

  if (knownCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(knownCustomerId);
      if (!customer.deleted) {
        candidateCustomerIds.push(customer.id);
      }
    } catch {
      // Ignore and fall back to email lookup.
    }
  }

  const customersByEmail = await stripe.customers.list({ email: userEmail, limit: 5 });
  for (const customer of customersByEmail.data) {
    if (!candidateCustomerIds.includes(customer.id)) {
      candidateCustomerIds.push(customer.id);
    }
  }

  for (const customerId of candidateCustomerIds) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
    });

    const matchedSubscription = pickAccessibleSubscription(subscriptions.data);
    if (!matchedSubscription) continue;

    const periodEnd = (matchedSubscription as any).current_period_end;
    const subscriptionEnd =
      typeof periodEnd === "number" && Number.isFinite(periodEnd)
        ? new Date(periodEnd * 1000).toISOString()
        : null;

    const item = matchedSubscription.items?.data?.[0];
    const productId = (item?.price?.product as string | undefined) ?? null;
    const priceId = (item?.price?.id as string | undefined) ?? null;
    const planId = getPlanIdFromPriceId(priceId) || getPlanIdFromAmount(item?.price?.unit_amount);

    return {
      customerId,
      subscriptionId: matchedSubscription.id,
      subscriptionStatus: matchedSubscription.status,
      subscriptionEnd,
      productId,
      priceId,
      planId,
      cancelAtPeriodEnd: matchedSubscription.cancel_at_period_end,
    };
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKeys = getStripeKeys();
    if (stripeKeys.length === 0) {
      throw new Error("No valid Stripe secret key is configured");
    }
    logStep("Stripe key(s) verified", { keyCount: stripeKeys.length });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
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

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select(
        "promo_used, has_access, subscription_status, stripe_customer_id, stripe_subscription_id, current_period_end",
      )
      .eq("user_id", user.id)
      .single();

    let matched: StripeSubscriptionMatch | null = null;

    for (const stripeKey of stripeKeys) {
      matched = await findSubscriptionForUser(stripeKey, user.email, profile?.stripe_customer_id);
      if (matched) break;
    }

    if (matched) {
      const updatePayload: Record<string, any> = {
        subscription_status: matched.subscriptionStatus,
        has_access: true,
        cancel_at_period_end: matched.cancelAtPeriodEnd,
        current_period_end: matched.subscriptionEnd,
        stripe_customer_id: matched.customerId,
        stripe_subscription_id: matched.subscriptionId,
      };
      if (matched.planId) updatePayload.access_type = matched.planId;
      if (matched.priceId) updatePayload.price_id = matched.priceId;

      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update(updatePayload)
        .eq("user_id", user.id);

      if (updateError) {
        logStep("Error updating profile", { error: updateError.message, updatePayload });
      } else {
        logStep("Profile updated with subscription", {
          status: matched.subscriptionStatus,
          access_type: updatePayload.access_type,
          customerId: matched.customerId,
        });
      }

      return new Response(
        JSON.stringify({
          subscribed: true,
          product_id: matched.productId,
          subscription_end: matched.subscriptionEnd,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // No active/trialing subscription found in Stripe for either account.
    // Preserve promo access; otherwise mark as inactive.
    if (!profile?.promo_used) {
      await supabaseClient
        .from("profiles")
        .update({
          subscription_status: "inactive",
          has_access: false,
          cancel_at_period_end: false,
          current_period_end: null,
          stripe_subscription_id: null,
        })
        .eq("user_id", user.id);
      logStep("No active subscription found. Profile downgraded to inactive", { userId: user.id });
    } else {
      logStep("No active subscription found, keeping promo access", { userId: user.id });
    }

    return new Response(
      JSON.stringify({
        subscribed: Boolean(profile?.promo_used),
        product_id: null,
        subscription_end: null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
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
