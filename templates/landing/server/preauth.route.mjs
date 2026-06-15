// BuilderKit validate — reference preauth route (Stripe manual-capture, Vercel/Node).
// Copy into your app's /api/preauth. Creates a LIVE manual-capture PaymentIntent (a
// hold, not a charge) at the D2 price and returns its client_secret for the client to
// confirm. Capture or cancel (void) it server-side at sprint end. Env:
// STRIPE_SECRET_KEY (LIVE), BK_PRICE_CENTS, BK_CURRENCY (default usd).
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const amountCents = Number(process.env.BK_PRICE_CENTS);
  if (!Number.isFinite(amountCents) || amountCents <= 0) return res.status(500).json({ error: "BK_PRICE_CENTS not set" });
  const params = new URLSearchParams({
    amount: String(amountCents),
    currency: process.env.BK_CURRENCY || "usd",
    capture_method: "manual",                  // a hold — never auto-settles
    "automatic_payment_methods[enabled]": "true",
  });
  const r = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const pi = await r.json();
  if (!r.ok) return res.status(502).json({ error: "stripe error", detail: pi?.error?.message });
  return res.status(200).json({ client_secret: pi.client_secret, amount: amountCents / 100 });
}
