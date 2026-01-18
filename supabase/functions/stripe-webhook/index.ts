import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getPlanIdFromPriceId } from "../_shared/stripePlans.ts";

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

    // Get raw body for signature verification
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

    // Create backend admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.completed", {
        sessionId: session.id,
        clientReferenceId: session.client_reference_id,
        metadata: session.metadata,
      });

      const userId = session.client_reference_id || session.metadata?.userId;
      if (!userId) {
        logStep("No userId found on session");
        return new Response("No userId on session", { status: 400 });
      }

      // IMPORTANT: profiles.access_type has a DB constraint.
      // We must store the in-app plan id (basic/pro/insider), not a generic value like "subscription".
      const planId =
        (session.metadata?.planId as string | undefined) ||
        getPlanIdFromPriceId(session.metadata?.priceId);

      if (!planId) {
        logStep("Could not determine planId from session metadata", { userId, metadata: session.metadata });
        return new Response("No planId on session", { status: 400 });
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          has_access: true,
          subscription_status: "active",
          access_type: planId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        logStep("Error updating profile", { error: updateError.message, userId, planId });
        return new Response(`Error updating profile: ${updateError.message}`, { status: 500 });
      }

      logStep("Profile updated successfully", { userId, planId });
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Handle subscription canceled/deleted
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Processing subscription deletion", { subscriptionId: subscription.id });

      // Find user by Stripe customer ID
      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId);

      if (!customer.deleted && customer.email) {
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            has_access: false,
            subscription_status: "canceled",
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

    // Handle subscription updates (e.g., renewal, payment failed)
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Processing subscription update", {
        subscriptionId: subscription.id,
        status: subscription.status,
      });

      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId);

      if (!customer.deleted && customer.email) {
        const isActive = subscription.status === "active" || subscription.status === "trialing";

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            has_access: isActive,
            subscription_status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq("email", customer.email);

        if (error) {
          logStep("Error updating profile on subscription update", { error: error.message });
        } else {
          logStep("Profile updated for subscription change", {
            email: customer.email,
            status: subscription.status,
            hasAccess: isActive,
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
