import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupRequest {
  email: string;
  password: string;
  promoCode?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, promoCode }: SignupRequest = await req.json();

    // Validate inputs
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize promo code
    const normalizedPromo = (promoCode || "").trim().toUpperCase();

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate promo code against the access_codes table if provided
    let isValidPromo = false;
    if (normalizedPromo) {
      const { data: codeData, error: codeError } = await supabase
        .from("access_codes")
        .select("id, code, is_active, max_uses, current_uses")
        .eq("code", normalizedPromo)
        .eq("is_active", true)
        .single();

      if (codeError || !codeData) {
        return new Response(
          JSON.stringify({ error: "Invalid promo code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if max uses exceeded
      if (codeData.max_uses !== null && codeData.current_uses >= codeData.max_uses) {
        return new Response(
          JSON.stringify({ error: "This promo code has reached its maximum uses" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      isValidPromo = true;

      // Increment current_uses for the code
      await supabase
        .from("access_codes")
        .update({ current_uses: codeData.current_uses + 1 })
        .eq("id", codeData.id);
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error("Auth error:", authError);
      if (authError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "This email is already registered. Please log in." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to create account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;
    const isPro = isValidPromo;
    const promoUsed = isPro ? normalizedPromo : null;

    // Update the profile (created by trigger) with promo status
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        has_access: isPro,
        access_type: isPro ? "promo" : null,
        subscription_status: isPro ? "active" : "inactive",
        promo_used: promoUsed,
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Don't fail the signup, profile was created by trigger
    }

    // Send emails
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");

    console.log("Email config check - RESEND_API_KEY exists:", !!resendApiKey);
    console.log("Email config check - ADMIN_EMAIL:", adminEmail || "NOT SET");

    if (resendApiKey && adminEmail) {
      const resend = new Resend(resendApiKey);
      const createdAt = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

      // Email to admin - ALWAYS send on every signup
      console.log("Attempting to send admin notification email to:", adminEmail);
      try {
        const adminEmailResult = await resend.emails.send({
          from: "ThinkBetAI <onboarding@resend.dev>",
          to: [adminEmail],
          subject: `🆕 New ThinkBetAI Signup: ${email}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">🎉 New User Signup!</h2>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 8px 0;"><strong>Plan:</strong> ${isPro ? "✅ PRO (Free forever – promo)" : "❌ No plan (Free / Locked)"}</p>
                <p style="margin: 8px 0;"><strong>Promo code used:</strong> ${promoUsed || "None"}</p>
                <p style="margin: 8px 0;"><strong>Signup date:</strong> ${createdAt}</p>
              </div>
            </div>
          `,
        });
        console.log("Admin notification email sent successfully:", JSON.stringify(adminEmailResult));
      } catch (emailError: any) {
        console.error("Failed to send admin email - Error:", emailError?.message || emailError);
        console.error("Full error:", JSON.stringify(emailError));
      }

      // Welcome email to user
      console.log("Attempting to send welcome email to:", email);
      try {
        const userEmailResult = await resend.emails.send({
          from: "ThinkBetAI <onboarding@resend.dev>",
          to: [email],
          subject: "Welcome to ThinkBetAI! 🎯",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">Welcome to ThinkBetAI!</h2>
              <p>Thanks for signing up. You're now part of our community of smart bettors.</p>
              <p>If you have any questions or need help, just reply to this email.</p>
              <p style="margin-top: 30px;">— The ThinkBetAI Team</p>
            </div>
          `,
        });
        console.log("Welcome email sent successfully:", JSON.stringify(userEmailResult));
      } catch (emailError: any) {
        console.error("Failed to send welcome email - Error:", emailError?.message || emailError);
      }
    } else {
      console.error("Email sending skipped - Missing config. RESEND_API_KEY:", !!resendApiKey, "ADMIN_EMAIL:", !!adminEmail);
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        isPro,
        message: isPro 
          ? "Account created with PRO access!" 
          : "Account created! Choose a plan to get started.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Signup error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
