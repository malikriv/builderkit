# Launch Thesis — validation-page-builder

> Written by /launchthesis:discover (D4), run as a dogfood on the "turn the landing-page
> template into a standalone micro-SaaS" idea. Feeds /launchthesis:strategy then
> /launchthesis:validate. Every WTP/competitive claim carries a source + retrieval date
> (2026-06-25). Model-opinion claims are labeled. No fabricated prevalence numbers.

## ICP / population
Indie builders / "vibe-coders" who ship with AI builders (Claude Code, Cursor, Lovable,
v0, Bolt, Replit) and want to test a startup/SaaS idea **before** investing build time.
**Sharper beachhead:** the *repeat, burned* builder — has already shipped something that
got no users — who now wants a cheap interest test first. (Note: this is nearly the same
ICP as LaunchThesis itself — see Riskiest Assumption #4, cannibalization.)

## Archetype
prosumer (indie builders paying out of pocket; low ACV, high volume).

## Stated exit
none declared. Natural future acquirers if it matters: AI-builder platforms (v0/Vercel,
Lovable, Replit) or waitlist/marketing-tool companies. Keep framing manipulation-free —
the brand is honesty.

## Founder access (for THIS seed)
| community | standing (none/lurker/member/contributor/known) | reachable now? |
|-----------|--------------------------------------------------|----------------|
| Claude Code / Anthropic ecosystem | contributor (ships a plugin) | yes |
| Indie Hackers | member | yes |
| build-in-public X/Twitter | member | yes |
| r/SideProject, r/indiehackers | lurker/member | yes |
| Product Hunt | lurker | launch-moment only |

## D1 triage verdict
**PASS → D2** (with a strong copy/positioning + moat risk flagged for D3).
- **Wedge?** Yes — an *indie-priced, honest, throwaway, pay-proof-gated* validation page is
  a differentiated position vs. (a) Prelaunch.com (does the full loop but enterprise-priced)
  and (b) waitlist tools (optimize vanity list growth — the opposite of "delete it in a week
  and maybe tell you NO"). An incumbent waitlist tool would structurally avoid "burn your
  list" + "an honest NO."
- **Reachable audience?** Yes — ≥2 communities with non-zero standing.
- **WTP path?** Plausible at an indie price point (~$0–$20/mo or per-validation), anchored
  to tools this ICP already pays for. *Flagged for D3:* price compression vs. free AI builders.
- **Exit-safe?** Yes — anti-manipulation by design.

## D2 demand smoke — pulse evidence
- Outcome: **PULSE PENDING — founder action required (not fabricated).**
- The agent drafts the pulse; the founder runs it within `discover.reality_probe.window_hours`.
  D2 cannot be auto-passed: a real pulse needs real humans. Plan:
  - **Named-list pre-sell DMs (Mom-Test framed)** to 10–20 indie builders who've publicly
    lamented "built it, got no users": ask about the *last flop and what it cost*, then a soft
    pre-sell ("a $X tool that makes a cold stranger pay before you build — early access?").
  - **No-build fake-door** — fittingly, *the product's own `page.template.html`* is the
    fake-door: a one-pager stating the real stage + a `validate my idea` pre-auth button.
    Post to r/SideProject, Indie Hackers, build-in-public X.
  - **Pulse gate:** ≥1 real pre-sell / LOI / deposit, or fake-door signups above floor →
    escalate. No pulse → re-frame offer/audience once, then kill cheap.

## Problem + intensity (D3)
- Calibrated intensity verdict: **REAL-BUT-TOLERABLE — leaning nice-to-have on the "fast
  landing page" framing.** (medium confidence; high on the WTP/commoditization + traffic-
  bottleneck findings, low on all base-rate claims — no rigorous prevalence survey exists.)
- Confirming evidence (sourced, retrieved 2026-06-25):
  - "Building something nobody wanted" is the most-cited *root* cause of startup failure —
    CB Insights: **42–43% of analyzed post-mortems** cite "no market need / poor PMF" (a
    selected sample, NOT a population base rate). [cbinsights.com]
  - The validate-vs-build question recurs constantly on Indie Hackers ("90% are building the
    wrong thing" after 600 convos; "validate with a landing page before you build" is canon).
  - Audience is broad and exploding via vibe-coding: Lovable ~8M users / ~100k new products/
    day, Bolt ~7M, Replit 40M+, Cursor 1M+ DAU. [TechCrunch/Sacra/Contrary]
- Disconfirming evidence (sourced) — the falsification hunt succeeded on the axes that matter:
  - **WTP is structurally weak (strongest negative):** the page is commoditized to ~free
    (Carrd ~$1.58/mo; free Lovable/Bolt/v0 generate a hosted page from one prompt). No paid
    "validate your idea" product category has formed — search surfaces how-to content, not
    products. Real WTP lives in the *growth/referral* layer ($35–$499/mo), tied to scale.
  - **Traffic, not the page, is the bottleneck (most damaging):** first-party IH quotes —
    "we built a landing page… how do we drive traffic?"; a page builder solves the easy half.
  - **Intention-action gap:** an explicit "argument against idea validation" camp; believers
    admit skipping it "because the research phase is boring and I can't shortcut it."
  - **Premise erosion:** "When building is cheap, building IS validating" — AI is dissolving
    the "validate the page before you build" assumption (contested: IH "is LP validation dead?
    No :)").
- Falsification register:
  | # | Evidence that would prove NO burning need | Found? |
  |---|---|---|
  | F1 | Page commoditized/free → WTP killed | **YES, strong** |
  | F2 | "Validate first" nodded-at but not done | **YES, moderate-strong** |
  | F3 | Builders prefer shipping the real MVP with AI | **YES, strong but contested** |
  | F4 | Real bottleneck is traffic, not the page | **YES, strong** |
  | F5 | Landing-page validation gives false/vanity signals | **YES, moderate-strong** |
  Counter-falsifiers that would have rescued "burning" (pain real, audience broad) passed —
  but there is **no evidence of unmet WTP for a page**, the decisive miss.
- **Where a defensible wedge survives:** NOT "make me a page" (commoditized) but **(a)** killing
  the *friction* of the boring research/validation step (the one thing people say they can't
  shortcut), and/or **(b)** attaching to *distribution + a real paid-intent signal* (cold card,
  not vanity email). That re-frame is the basis for the wedge re-cut (v2) below.

## Value proposition
Stand up a credible, honest demand-validation page in minutes, get a real
willingness-to-pay signal (a refundable card hold, not a vanity email) and an honest
GO/NO-GO read within a week, then throw it away — so you stop burning AI-build cycles on
apps nobody wants. Not a website builder; not a vanity waitlist.

## Wedge (versioned)
```yaml
wedge:
  # v1 did NOT promote to `named`: D3 intensity is real-but-tolerable leaning nice-to-have on
  # the "page" framing, WTP competes with free, and a re-cut (v2) is the disciplined next move.
  statement: "The throwaway validation page that won't flatter you — indie-priced, a refundable
    cold-card hold + an honest GO/NO-GO in a week, then you delete it."
  version: 1
  status: candidate
  history:
    - version: 1
      statement: "(throwaway, indie-priced, pay-proof-gated page)"
      status: candidate
      date: 2026-06-25
      note: "Gate D ITERATE — page framing is commoditized; re-cut to v2 before spend."
  recut_v2_direction: |
    Stop selling "a page" (free via AI builders). Sell the FRICTION-KILL + the PAID-INTENT
    SIGNAL + first DISTRIBUTION: an agent that runs the boring validation step for you and
    gets a cold stranger to put money down — the page is a commodity component, not the product.
    This re-cut moves the concept toward the full LaunchThesis loop (see Riskiest Assumption #4:
    this may be a FEATURE of LaunchThesis, not a separate company). Run a cheap D2 pulse on the
    re-cut offer before any further spend.
```

**Current statement (prose):** An indie-priced, *honest*, *disposable*, *pay-proof-gated*
demand-validation page. The position incumbents avoid: waitlist tools want you to grow and
keep a list (vanity), Prelaunch serves funded teams at $279–$1,399/mo; nobody at the $0–$20
indie tier couples a refundable-pre-auth WTP signal to an opinionated, honest GO/NO-GO that
is designed to be thrown away.

## Monetization + willingness to pay
- Model + who pays: indie builders, ~$0–$20/mo or per-validation. Price anchors (retrieved
  2026-06-25): Carrd $9–$49/yr; v0/Bolt/Lovable Pro ~$20–$25/mo; GetWaitlist/Waitlister
  ~$15/mo. Above ~$30/mo fights muscle memory. **Prelaunch.com $279–$1,399/mo** confirms an
  empty indie middle. _(source: competitive track, vendor pricing pages.)_
- Existing-workaround spend: Carrd + manual Stripe + manual counting; or a $15/mo waitlist
  tool; or $20/mo AI builder to generate a page. **LABELED ASSUMPTION** — substitution risk
  is high (a free AI builder + a Stripe Payment Link approximates this), to be tested in validate.

## Exit-safe framing check
No trademark/claims conflict with the (none) exit. Anti-manipulation positioning is
acquirer-safe. Name candidates were collision-checked (see decision below): avoid GoNoGo
(live competitor), Litmus, Thesis, Verdikt (all owned/risky).

## Riskiest assumptions (ranked, provenance-tagged)
1. **No durable moat — the bundle is commodity.** A page + a Stripe manual-capture hold + a
   threshold readout is a weekend bolt-on for any waitlist tool or AI builder. The moat, if
   any, is a cross-campaign benchmark dataset + opinionated defaults + the throwaway brand,
   not the feature list. **TOP risk — the sprint must disconfirm "easy to copy = no business."**
   [cited-external-source]
2. **A direct full-stack competitor already exists.** Prelaunch.com already does page +
   refundable deposit + price A/B + an explicit launch/abandon verdict; differentiation
   collapses to *price + audience* (indie vs. funded). [cited-external-source]
3. **The bottleneck may be DISTRIBUTION, not the page.** Getting cold strangers in front of
   the page is the hard part; a page builder doesn't solve traffic. If true, the verdict is
   only as good as the founder's reach. [cited-external-source — confirm via demand track]
4. **Cannibalization / "is this a product or a feature?"** This concept is essentially the
   *productized validate step of LaunchThesis itself*. It may be a wedge/feature of the same
   thesis rather than a separate company — running it as its own SaaS could split focus.
   [model-opinion]
5. **Intention-action gap.** "Validate before building" is advice people nod at but skip;
   with AI builders, many would rather just build the MVP. [cited-external-source — demand track]
6. **WTP / price compression.** Will indies pay for a throwaway page when Carrd is $9/yr and
   v0 generates one free? The value must read as *the verdict + the WTP probe*, not the page.
   [cited-external-source]

## Intended surfaces sketch (for /launchthesis:strategy)
- The template gallery / "new validation page" creator (pick theme, fill tokens).
- The live page itself (capture + WTP probe) — already built as `page.template.html`.
- The results dashboard: lands / signups / pay-proofs + the GO/NO-GO verdict (gate-eval).
- The "kill or keep" decision screen + one-click teardown (the throwaway ritual).

## Falsifiable validation hypothesis
> If we put a *"validate your idea with a real paid signal in a week, then throw the page
> away"* offer in front of indie builders via Indie Hackers + build-in-public X + the Claude
> Code ecosystem, ≥ 10 cold strangers will **PAY** (a refundable pre-auth hold on early
> access) within a 48–96h window.

- Mandatory hard_signal for this concept: **paid** (a refundable pre-auth hold).
  (Non-paid would be too weak for a tool whose whole pitch is "a real paid signal".)

## Pre-registered Gate V predicates (frozen at validate V0)
- Exposure denominator (min qualified lands): **25** (INCONCLUSIVE floor; aim 100–200).
- What counts: signup = email; activation = created a draft validation page; hard pay-proof =
  cold, LIVE Stripe manual-capture hold ≥ 25% of the stated price.
- Self/contact exclusion set: the founder's own emails/handles/cards (drop at ingestion).

## Gate D verdict
```
┌ Gate D — ITERATE (re-cut the wedge, then a cheap D2 pulse)
│ Wedge:        throwaway indie-priced pay-proof page  (v1, candidate — not promoted)
│ Intensity:    real-but-tolerable (leaning nice-to-have on the "page" framing)
│ Pulse:        PENDING — D2 not yet run (real outreach required; cannot be auto-passed)
│ WTP path:     weak — page commoditized to ~free; no paid "validation" category
│ Reachable:    yes (Claude Code ecosystem · Indie Hackers · build-in-public X · r/SideProject)
└ Reason:       The pain is real but the "fast landing page" framing competes with free and a
               funded incumbent (Prelaunch.com). Don't false-kill on framing — re-cut to v2
               (friction-kill + paid-intent + distribution) and settle it with a real pulse.
```

**Why not GO:** intensity borderline, WTP weak, a direct full-stack competitor (Prelaunch)
and commodity copy-risk, and **no D2 pulse has actually been run** — a clean GO is unjustified.
**Why not NO-GO (kill):** the underlying pain is real and recurrent, the audience is broad and
exploding, and there is a sharper adjacent wedge the evidence points to. A kill here would be a
false-kill on framing.

## Kill criteria
- No plausible WTP path from real spend data (Gate D fail (a)).
- No cheaply-reachable audience (Gate D fail (b)).
- Demand-intensity verdict of `nice-to-have` (Gate D fail (d)).
- Top assumption #1 (no moat) stays `model-opinion` with no cheap test path (Gate D fail (c)).
- In validate: < 10 cold weighted users OR no cold hard pay-proof in-window after one re-frame.
