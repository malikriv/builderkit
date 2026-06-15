// BuilderKit validate — reference capture route (Supabase flavored, Vercel/Node handler).
// Copy into your app's /api/capture. Inserts one row, idempotent via the schema's
// dedupe_key (on conflict do nothing). Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const allowedTiers = ["land", "signup", "activation", "payment", "loi", "scarce_action", "intent_click"];
  if (!allowedTiers.includes(body?.tier) || !body?.session) return res.status(400).json({ error: "bad event" });
  const row = {
    tier: body.tier, cohort: body.cohort || "unverifiable", email: body.email || null,
    session: body.session, source: body.source || "", amount: body.amount || 0,
    live: !!body.live, is_founder: !!body.is_founder,
  };
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/builderkit_events`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "resolution=ignore-duplicates,return=minimal", // idempotent on dedupe_key
    },
    body: JSON.stringify(row),
  });
  if (!r.ok && r.status !== 409) return res.status(502).json({ error: "store insert failed", status: r.status });
  return res.status(204).end();
}
