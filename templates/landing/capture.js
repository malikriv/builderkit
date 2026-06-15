// BuilderKit validate — client capture. Cookieless (a per-tab sessionStorage id only,
// no tracking cookies), idempotent (the store's dedupe_key collapses repeats), and
// cohort-aware (the tracked link's ?src= tag classifies the cohort). Replace
// STORE_ENDPOINT with your data connector (e.g. a Supabase RPC/REST insert).
const STORE_ENDPOINT = "/api/capture"; // wire to validate.data.* (blank => planner-mode)

function sessionId() {
  let s = sessionStorage.getItem("bk_sid");
  if (!s) { s = "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem("bk_sid", s); }
  return s;
}
function cohortFromSource(src) {
  // The tracked link carries ?src=cold_public|warm_dm|friend. Default unverifiable.
  const allowed = ["cold_public", "warm_dm", "friend"];
  return allowed.includes(src) ? src : "unverifiable";
}
export async function capture(tier, { email = null, amount = 0, live = false } = {}) {
  const params = new URLSearchParams(location.search);
  const body = {
    tier, email, amount, live,
    session: sessionId(),
    source: params.get("src") || "",
    cohort: cohortFromSource(params.get("src")),
    is_founder: false, // ingestion (validate V3) re-flags founder/known-contact rows
  };
  if (STORE_ENDPOINT === "") return; // true planner-mode: nothing wired, intentional no-op
  try {
    const res = await fetch(STORE_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error("capture route " + res.status);
  } catch (e) {
    console.error("[builderkit] capture failed:", e);
    if (typeof document !== "undefined") {
      let el = document.getElementById("bk-warn");
      if (!el) { el = document.createElement("div"); el.id = "bk-warn"; el.style.cssText = "background:#fee;color:#900;padding:8px;font:14px sans-serif"; document.body.prepend(el); }
      el.textContent = "Event capture failed — your store is not recording. Fix before launch.";
    }
  }
}
// A "qualified land" = first view of the page from a tracked link. Recorded as its own
// `land` tier (NOT a conversion) so the orchestration can count lands for the exposure
// denominator; gate-eval excludes land rows from the user count.
export function recordLand() { if (new URLSearchParams(location.search).get("src")) capture("land"); }
