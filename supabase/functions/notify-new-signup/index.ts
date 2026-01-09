import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const adminEmail = Deno.env.get("ADMIN_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewSignupRequest {
  email: string;
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, user_id }: NewSignupRequest = await req.json();

    if (!adminEmail) {
      throw new Error("ADMIN_EMAIL not configured");
    }

    const signupTime = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "full",
      timeStyle: "short",
    });

    const emailResponse = await resend.emails.send({
      from: "Picks Notifications <onboarding@resend.dev>",
      to: [adminEmail],
      subject: "🎉 New User Signup!",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981; margin-bottom: 24px;">New User Signed Up!</h1>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 12px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0 0 12px 0;"><strong>User ID:</strong> ${user_id}</p>
            <p style="margin: 0;"><strong>Time:</strong> ${signupTime}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">You're receiving this because someone signed up on your platform.</p>
        </div>
      `,
    });

    console.log("Admin notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
