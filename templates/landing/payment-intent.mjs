// BuilderKit validate — the HARD willingness-to-pay signal: a real card PRE-AUTH
// (Stripe manual-capture), never settled, auto-voided at sprint end. live:true is
// recorded ONLY after a confirmed authorization — never on a bare fetch — so a
// mis-wired page degrades to an honest SOFT signal instead of a fabricated PASS.
// Wire STRIPE_PUBLISHABLE_KEY + a /api/preauth route (see server/preauth.route.mjs)
// that creates a manual-capture PaymentIntent and returns { client_secret, amount }.
const STRIPE_PUBLISHABLE_KEY = ""; // set from validate.payments.*; empty => planner-mode (soft only)

export async function startPreauth(capture) {
  if (!STRIPE_PUBLISHABLE_KEY || typeof window === "undefined" || !window.Stripe) {
    // planner-mode or Stripe.js not loaded: record a SOFT intent only — never live:true.
    await capture("intent_click");
    return { ok: false, mode: "soft" };
  }
  try {
    const res = await fetch("/api/preauth", { method: "POST" });
    if (!res.ok) throw new Error("preauth route " + res.status);
    const { client_secret, amount } = await res.json();
    const stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
    // The page must have mounted a Stripe card Element as `window.bkCardElement`.
    const { paymentIntent, error } = await stripe.confirmCardPayment(client_secret, {
      payment_method: { card: window.bkCardElement },
    });
    if (error || !paymentIntent || !["requires_capture", "succeeded"].includes(paymentIntent.status)) {
      await capture("intent_click"); // declined / not authorized -> honest soft signal
      return { ok: false, mode: "soft", error: error?.message };
    }
    // Confirmed live authorization (a hold; capture/void happens server-side at sprint end).
    await capture("payment", { amount, live: true });
    return { ok: true, mode: "preauth" };
  } catch (e) {
    console.error("[builderkit] preauth failed:", e);
    if (typeof document !== "undefined") showWarning("Payment hold could not be set up — recorded as interest only.");
    await capture("intent_click");
    return { ok: false, mode: "soft", error: String(e) };
  }
}

function showWarning(msg) {
  let el = document.getElementById("bk-warn");
  if (!el) { el = document.createElement("div"); el.id = "bk-warn"; el.style.cssText = "background:#fee;color:#900;padding:8px;font:14px sans-serif"; document.body.prepend(el); }
  el.textContent = msg;
}
export { showWarning };
