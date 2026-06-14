// BuilderKit validate — the HARD willingness-to-pay signal: a real card PRE-AUTH
// (Stripe manual-capture), never settled, auto-voided at sprint end. A successful
// pre-auth from a cold stranger at real price is a valid Gate V pay-proof while
// removing the money, fulfillment, refund, and chargeback risk (spec 4.3).
// Wire STRIPE_PUBLISHABLE_KEY + a server route that creates a manual-capture
// PaymentIntent for validate.payments.* (blank provider => planner-mode).
const STRIPE_PUBLISHABLE_KEY = ""; // wire from validate.payments.*; empty => planner-mode

export async function startPreauth(capture) {
  if (!STRIPE_PUBLISHABLE_KEY) {
    // planner-mode: no payments connector. Record the intent as SOFT only.
    await capture("intent_click");
    return { ok: false, mode: "planner" };
  }
  // Server route must create a PaymentIntent with capture_method:"manual" at the real
  // D2 price, in LIVE mode, and return {amount, currency}. On client confirmation:
  const res = await fetch("/api/preauth", { method: "POST" });
  const { amount } = await res.json();
  // amount is the authorized (not captured) figure; live:true marks it gate-eligible.
  await capture("payment", { amount, live: true });
  return { ok: true, mode: "preauth" };
}
