// Gate V evaluator — pure & deterministic. Recompute the sprint verdict from the raw
// captured rows against the predicates frozen at V0. The builder is NOT the scorer:
// this runs read-only over the raw export so a human or a separate agent can reproduce
// the verdict. No I/O, no Date, no randomness — the caller passes the window and rows.

const HARD_TIERS = new Set(["payment", "loi", "scarce_action"]);
const COUNT_TIERS = new Set(["signup", "activation", "payment", "loi", "scarce_action"]);
const toMs = (v) => (typeof v === "number" ? v : Date.parse(v));

export function evaluateGate(input, predicates) {
  const { rows = [], lands = null, measurable = true } = input;
  const p = predicates;

  // 1. Instrumentation defects -> NOT-MEASURABLE (neither pass nor normal fail).
  if (measurable === false || lands === null || lands === undefined) {
    return mk("NOT-MEASURABLE", "analytics/instrumentation not firing");
  }
  const ws = toMs(p.window_start), we = toMs(p.window_end);
  const inWindow = rows.filter((x) => { const t = toMs(x.ts); return t >= ws && t <= we; });
  const hard = inWindow.filter((x) => HARD_TIERS.has(x.tier) && !x.is_founder);
  if (p.require_pay_proof && hard.length > 0 && hard.every((x) => x.live !== true)) {
    return mk("NOT-MEASURABLE", "pay-proof present only in test/sandbox mode");
  }

  // 2. Count: in-window, non-founder, conversion tiers only (land + intent_click never count).
  const counted = dedupeByUser(inWindow.filter((x) => !x.is_founder && COUNT_TIERS.has(x.tier)));
  const countedUsers = counted.length;

  // 3. Weights.
  const w = (x) => (p.weights[x.tier] || 0) * (p.cohort_weights[x.cohort] || 0);
  const weighted = counted.reduce((s, x) => s + w(x), 0);
  const coldWeight = counted.filter((x) => x.cohort === "cold_public").reduce((s, x) => s + w(x), 0);
  const friendWeight = counted.filter((x) => x.cohort === "friend").reduce((s, x) => s + w(x), 0);
  const coldWeightFraction = weighted > 0 ? coldWeight / weighted : 0;
  const friendShare = weighted > 0 ? friendWeight / weighted : 0;

  // 4. Cold hard pay-proof.
  const hasColdHardPayProof = counted.some((x) =>
    HARD_TIERS.has(x.tier) &&
    (!p.pay_proof?.cold_required || x.cohort === "cold_public") &&
    (!p.pay_proof?.live_mode_only || x.live === true) &&
    (x.amount || 0) >= (p.pay_proof?.min_amount ?? 0)
  );

  const m = { countedUsers, weighted, coldWeightFraction, friendShare, hasColdHardPayProof, countedRows: counted };

  // 5. Exposure denominator -> INCONCLUSIVE (channel, not product, failed).
  if (lands < p.min_qualified_lands) {
    return mk("INCONCLUSIVE", "qualified lands below the exposure floor — the channel did not deliver audience", m);
  }

  // 6. Rate guard (only above the sample floor) -> land-and-bounce FAIL.
  if (p.rate && lands >= p.rate.rate_min_sample_visits && countedUsers / lands < p.rate.min_lp_visit_to_signup_rate) {
    return mk("FAIL", "landed-and-bounced — visit->signup rate below floor", m);
  }

  // 7. PASS conditions (all must hold).
  const reasons = [];
  if (countedUsers < p.floor_users) reasons.push(`only ${countedUsers}/${p.floor_users} counted users`);
  if (coldWeightFraction < p.min_cold_weight_fraction) reasons.push(`cold weight fraction ${round(coldWeightFraction)} < ${p.min_cold_weight_fraction}`);
  if (friendShare > p.max_friend_share) reasons.push(`friend share ${round(friendShare)} > ${p.max_friend_share}`);
  if (p.require_pay_proof && !hasColdHardPayProof) reasons.push("no cold hard pay-proof");
  if (reasons.length === 0) {
    return mk("PASS", "exposure met, floor met, cold-weighted, with a cold hard pay-proof", m);
  }
  return mk("FAIL", reasons.join("; "), m);
}

function dedupeByUser(rows) {
  const seen = new Set();
  const out = [];
  for (const x of rows) {
    const key = (x.email && x.email.toLowerCase()) || `session:${x.session}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(x);
  }
  return out;
}
function round(x) { return Math.round(x * 100) / 100; }
function mk(verdict, reason, m = {}) {
  return {
    verdict, reason,
    countedUsers: m.countedUsers ?? 0,
    weighted: m.weighted ?? 0,
    coldWeightFraction: m.coldWeightFraction ?? 0,
    friendShare: m.friendShare ?? 0,
    hasColdHardPayProof: m.hasColdHardPayProof ?? false,
    countedRows: m.countedRows ?? [],
  };
}
