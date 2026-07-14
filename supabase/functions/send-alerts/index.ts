// send-alerts — receives a new opportunities row from the DB trigger,
// matches it against enabled alert_rules, and delivers Discord + email.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Opp = {
  id: string;
  edge_type: "value" | "arb" | "middle";
  sport: string;
  sport_key: string;
  event: string;
  commence_time: string;
  market: string;
  selection: string;
  line: number | null;
  book: string;
  odds_decimal: number;
  odds_american: number;
  fair_prob: number;
  ev_pct: number;
  book_count: number;
};

type Rule = {
  id: string;
  is_enabled: boolean;
  name: string;
  edge_types: string[] | null;
  sports: string[] | null;
  sport_keys: string[] | null;
  min_ev_pct: number | null;
  min_profit_pct: number | null;
  min_middle_size: number | null;
  discord_webhook_url: string | null;
  email_to: string | null;
  cooldown_seconds: number;
  last_fired_at: string | null;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));
    const opp = payload?.record as Opp | undefined;
    if (!opp?.id) return json({ error: "no record" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: rules } = await supabase
      .from("alert_rules")
      .select("*")
      .eq("is_enabled", true);

    if (!rules?.length) return json({ matched: 0 });

    const now = Date.now();
    let sent = 0;

    for (const rule of rules as Rule[]) {
      if (!matches(rule, opp)) continue;
      if (
        rule.cooldown_seconds > 0 &&
        rule.last_fired_at &&
        now - new Date(rule.last_fired_at).getTime() < rule.cooldown_seconds * 1000
      ) continue;

      const deliveries: Promise<unknown>[] = [];
      if (rule.discord_webhook_url?.includes("discord.com/api/webhooks/")) {
        deliveries.push(sendDiscord(rule.discord_webhook_url, opp));
      }
      if (rule.email_to) deliveries.push(sendEmail(rule.email_to, opp));

      if (deliveries.length) {
        await Promise.allSettled(deliveries);
        await supabase
          .from("alert_rules")
          .update({ last_fired_at: new Date().toISOString() })
          .eq("id", rule.id);
        sent++;
      }
    }

    return json({ matched: sent });
  } catch (e) {
    console.error("[send-alerts] error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function matches(rule: Rule, opp: Opp): boolean {
  if (rule.edge_types && !rule.edge_types.includes(opp.edge_type)) return false;
  if (rule.sports && !rule.sports.includes(opp.sport)) return false;
  if (rule.sport_keys && !rule.sport_keys.includes(opp.sport_key)) return false;
  if (opp.edge_type === "value" && rule.min_ev_pct != null && (opp.ev_pct ?? 0) < rule.min_ev_pct) return false;
  // Future: arb/middle thresholds when those edge types are populated
  return true;
}

const fmtAmerican = (a: number) => (a > 0 ? `+${a}` : `${a}`);

function headline(opp: Opp): string {
  if (opp.edge_type === "value") return `+${Number(opp.ev_pct).toFixed(1)}% EV — ${opp.event}`;
  if (opp.edge_type === "arb") return `ARB — ${opp.event}`;
  return `MIDDLE — ${opp.event}`;
}

function detail(opp: Opp): string {
  const start = new Date(opp.commence_time).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const marketLabel = opp.market === "h2h" ? "Moneyline" : opp.market === "spreads" ? "Spread" : "Total";
  return [
    `**${opp.selection}** @ **${fmtAmerican(opp.odds_american)}** on ${opp.book}`,
    `Fair: ${Math.round(Number(opp.fair_prob) * 100)}% · ${marketLabel} · ${opp.book_count} books`,
    `Starts ${start}`,
  ].join("\n");
}

const EMBED_COLOR: Record<string, number> = {
  value: 0xf5b942, arb: 0x3ddc84, middle: 0xe8edf5,
};

async function sendDiscord(webhookUrl: string, opp: Opp) {
  return fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [{
        title: headline(opp),
        description: detail(opp),
        color: EMBED_COLOR[opp.edge_type] ?? 0xffffff,
        footer: { text: `${opp.sport} · ${opp.edge_type.toUpperCase()}` },
        timestamp: new Date().toISOString(),
      }],
    }),
  });
}

async function sendEmail(to: string, opp: Opp) {
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("ALERT_FROM_EMAIL") ?? "alerts@thinkbetai.com";
  if (!key) return;
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: headline(opp),
      text: detail(opp).replace(/\*\*/g, ""),
    }),
  });
}
