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

async function cancelOnStripe(stripeKey: string, email: string, label: string) {
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const customers = await stripe.customers.list({ email, limit: 1 });
  if (customers.data.length === 0) {
    logStep(`[${label}] No customer found`, { email });
    return { found: false, canceledCount: 0, periodEnd: null };
  }

  const customerId = customers.data[0].id;
  const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active" });

  let canceledCount = 0;
  let periodEnd: string | null = null;

  for (const sub of subscriptions.data) {
    const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    canceledCount++;
    const endTs = (updated as any).current_period_end;
    if (typeof endTs === "number") {
      periodEnd = new Date(endTs * 1000).toISOString();
    }
    logStep(`[${label}] Set cancel_at_period_end`, { subId: sub.id, periodEnd });
  }

  return { found: true, canceledCount, periodEnd };
}

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
      .select("email")
      .eq("user_id", target_user_id)
      .single();

    if (!profile?.email) throw new Error("Target user email not found");
    logStep("Found target email", { email: profile.email });

    const newKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const oldKey = Deno.env.get("STRIPE_OLD_SECRET_KEY") ?? "";

    const results = await Promise.allSettled([
      newKey ? cancelOnStripe(newKey, profile.email, "new") : Promise.resolve({ found: false, canceledCount: 0, periodEnd: null }),
      oldKey ? cancelOnStripe(oldKey, profile.email, "old") : Promise.resolve({ found: false, canceledCount: 0, periodEnd: null }),
    ]);

    let totalCanceled = 0;
    let latestPeriodEnd: string | null = null;

    for (const r of results) {
      if (r.status === "fulfilled") {
        totalCanceled += r.value.canceledCount;
        if (r.value.periodEnd && (!latestPeriodEnd || r.value.periodEnd > latestPeriodEnd)) {
          latestPeriodEnd = r.value.periodEnd;
        }
      } else {
        logStep("Stripe account error", { error: String(r.reason) });
      }
    }

    if (totalCanceled === 0) {
      // No active subs found on either account — revoke access immediately
      await supabaseClient
        .from("profiles")
        .update({ subscription_status: "canceled", has_access: false, access_type: null })
        .eq("user_id", target_user_id);

      return new Response(JSON.stringify({ success: true, message: "Access revoked (no active Stripe subscriptions found on either account)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as canceling but keep access until period ends
    await supabaseClient
      .from("profiles")
      .update({ subscription_status: "canceling" })
      .eq("user_id", target_user_id);

    logStep("Done", { totalCanceled, latestPeriodEnd });

    return new Response(JSON.stringify({
      success: true,
      canceled_count: totalCanceled,
      period_end: latestPeriodEnd,
      message: latestPeriodEnd
        ? `Subscription will end on ${new Date(latestPeriodEnd).toLocaleDateString()}`
        : `${totalCanceled} subscription(s) set to cancel at period end`,
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
