import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getPlanIdFromPriceId, getPlanIdFromAmount } from "../_shared/stripePlans.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey || !webhookSecret) {
      logStep("Missing configuration", { hasStripeKey: !!stripeKey, hasWebhookSecret: !!webhookSecret });
      return new Response("Missing Stripe configuration", { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("Missing stripe-signature header");
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
      logStep("Event verified", { type: event.type, id: event.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Signature verification failed", { error: errorMessage });
      return new Response(`Webhook signature verification failed: ${errorMessage}`, { status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.completed", {
        sessionId: session.id,
        clientReferenceId: session.client_reference_id,
        metadata: session.metadata,
        customerEmail: session.customer_details?.email,
      });

      let userId = session.client_reference_id || session.metadata?.userId;

      if (!userId) {
        const email = session.customer_details?.email || session.customer_email;
        if (email) {
          logStep("No userId on session, falling back to email lookup", { email });
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("user_id")
            .eq("email", email)
            .limit(1)
            .single();
          if (profile?.user_id) {
            userId = profile.user_id;
            logStep("Found user via email", { userId, email });
          }
        }
      }

      if (!userId) {
        logStep("No userId found on session");
        return new Response("No userId on session", { status: 400 });
      }

      let planId =
        (session.metadata?.planId as string | undefined) ||
        getPlanIdFromPriceId(session.metadata?.priceId);

      let priceId: string | undefined;

      if (!planId) {
        try {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
          const linePrice = lineItems.data[0]?.price;
          priceId = linePrice?.id;
          const amountCents = linePrice?.unit_amount;
          logStep("Resolving planId from line item", { priceId, amountCents });
          planId = getPlanIdFromPriceId(priceId) || getPlanIdFromAmount(amountCents);
        } catch (e) {
          logStep("Failed to fetch line items", { error: String(e) });
        }
      }

      if (!planId) {
        planId = "basic";
        logStep("Defaulting to basic plan");
      }

      // Retrieve subscription details if mode is subscription
      const customerId = typeof session.customer === "string" ? session.customer : undefined;
      let stripeSubscriptionId: string | undefined;
      let periodEnd: string | undefined;

      if (session.mode === "subscription" && session.subscription) {
        stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : (session.subscription as any)?.id;
        if (stripeSubscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            periodEnd = new Date((sub as any).current_period_end * 1000).toISOString();
            if (!priceId) priceId = sub.items.data[0]?.price?.id;
          } catch (e) {
            logStep("Failed to retrieve subscription", { error: String(e) });
          }
        }
      }

      const updateData: Record<string, unknown> = {
        has_access: true,
        subscription_status: "active",
        access_type: planId,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      };
      if (customerId) updateData.stripe_customer_id = customerId;
      if (stripeSubscriptionId) updateData.stripe_subscription_id = stripeSubscriptionId;
      if (periodEnd) updateData.current_period_end = periodEnd;
      if (priceId) updateData.price_id = priceId;

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("user_id", userId);

      if (updateError) {
        logStep("Error updating profile", { error: updateError.message, userId, planId });
        return new Response(`Error updating profile: ${updateError.message}`, { status: 500 });
      }

      logStep("Profile updated successfully", { userId, planId });
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Handle subscription deleted
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Processing subscription deletion", { subscriptionId: subscription.id });

      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId);

      if (!customer.deleted && customer.email) {
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            has_access: false,
            subscription_status: "canceled",
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq("email", customer.email);

        if (error) {
          logStep("Error updating profile on cancellation", { error: error.message });
        } else {
          logStep("Profile updated for cancellation", { email: customer.email });
        }
      }

      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Handle subscription updates
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Processing subscription update", {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });

      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId);

      if (!customer.deleted && customer.email) {
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const subPrice = subscription.items.data[0]?.price;
        const planId = getPlanIdFromPriceId(subPrice?.id) || getPlanIdFromAmount(subPrice?.unit_amount);
        const periodEnd = new Date((subscription as any).current_period_end * 1000).toISOString();

        const updateData: Record<string, unknown> = {
          has_access: isActive || (subscription.cancel_at_period_end && new Date(periodEnd) > new Date()),
          subscription_status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: periodEnd,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        };
        if (planId) {
          updateData.access_type = planId;
        }
        if (subPrice?.id) {
          updateData.price_id = subPrice.id;
        }

        const { error } = await supabaseAdmin
          .from("profiles")
          .update(updateData)
          .eq("email", customer.email);

        if (error) {
          logStep("Error updating profile on subscription update", { error: error.message });
        } else {
          logStep("Profile updated for subscription change", {
            email: customer.email,
            status: subscription.status,
            hasAccess: isActive,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            planId,
          });
        }
      }

      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    logStep("Event type not handled, ignoring", { type: event.type });
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Unexpected error", { error: errorMessage });
    return new Response(`Webhook error: ${errorMessage}`, { status: 500 });
  }
});
