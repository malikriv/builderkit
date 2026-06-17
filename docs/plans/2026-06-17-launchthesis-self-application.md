# LaunchThesis applied to itself (dogfood)

**Status:** worked example / founder's own validation plan
**Date:** 2026-06-17
**Method:** runs the LaunchThesis loop (D0 frame → D1 triage → D2 demand smoke → D3 hardening →
D4 thesis → strategy → validate) on LaunchThesis *as the product*. Doubles as the reference
example shipped with the kit. Assumptions are labeled as assumptions — no fabricated prevalence
numbers (the engine forbids them).

---

## D0 — Concept Brief (frame)

- **ICP / population (sharp).** *Burned* indie builders who ship apps with AI builders
  (Claude Code, Cursor, Lovable, v0, Bolt, Replit) and have launched ≥1 thing that got no
  users. Not "all vibe coders" — the buyer is the one who has *felt the loss* of weeks spent
  building something nobody wanted. Sharpest reachable beachhead: the **Claude-Code / Cursor-native
  slice** (technical, already in-terminal, reachable through the plugin itself).
- **Current alternatives.** Gut feel + Twitter polls; "build in public" and hope; the Mom Test
  / YC essays (advice, not a loop); market-research GPTs (reassurance, no real signal); Carrd +
  manual ads; or just building anyway. **None close the loop to a real cold pay-proof** — they
  stop at "people said they'd use it."
- **Why now.** AI builders collapsed build cost to ~zero, so the bottleneck moved from
  *building* to *knowing what to build*. When building was expensive, validation discipline was
  forced; now it's skippable, so people skip it and build the wrong thing *faster*. The pain is
  newly acute **because** building got easy — and an agent can now orchestrate
  outreach + landing + Stripe + analytics, which wasn't true two years ago.
- **Archetype.** Prosumer (indie builders paying out of pocket; low ACV, high volume).
- **Stated exit.** None declared. Natural future acquirers if it matters: AI-builder platforms
  (Lovable, Replit, Vercel/v0) or dev-tool companies. Keep framing manipulation-free (the brand
  *is* honesty).
- **Founder-access.** Builder inside the Claude Code ecosystem (this session is itself a data
  point). Communities with plausible standing: Claude Code / Anthropic ecosystem, indie hackers,
  build-in-public X, r/SideProject, r/indiehackers, AI-builder Discords, Product Hunt.

## D1 — Triage (cheap go/no-go)

- **Wedge?** Yes — *"the validation tool that won't lie to you."* The honesty floor (a real cold
  stranger must pay before it says 'validated'; the verdict is recomputed from raw receipts) is a
  **differentiated position an incumbent would structurally avoid copying**: engagement-maximizing
  "validation" GPTs sell *reassurance*; a tool whose headline feature is *telling you NO and
  killing your idea* is off-brand for anything optimizing feel-good retention. Hard to copy
  without contradicting their own model.
- **Reachable audience?** Yes — ≥2 communities with non-zero standing (CC ecosystem + indie
  hackers + build-in-public X).
- **WTP path?** Plausible — indie builders already pay for Cursor, v0, Lovable, domains, hosting;
  a tool that saves weeks of wasted building has clear ROI at ~$20–40/validation or a low monthly
  sub. *Risk flagged for D3:* the trigger.
- **Exit-safe?** Yes — anti-manipulative by design.

**Verdict: PASS → D2.** No hard no.

## D2 — Demand smoke (the pulse plan)

The recursive part: LaunchThesis's own D2 *is* a LaunchThesis sprint.

- **Named-list pre-sell (Mom-Test framed).** DM 20–30 named indie builders who've publicly
  lamented "built it, no users." Ask about the *last flop and what it cost*, not the pitch; then a
  soft pre-sell: *"I'm building a tool that forces a real paid signal before you build — early
  access at $X?"*
- **Fake-door.** A one-page *"Get a real cold stranger to pay before you build — or we'll tell you
  not to"* with email capture + a `$29 — validate my idea` pre-auth button (a hold, no charge).
  Post to r/SideProject, indie hackers, X.
- **Pulse gate.** ≥1 real pre-sell / LOI / deposit, or fake-door signups above floor → escalate.
  No pulse → re-frame the offer/audience once, then kill cheap.

## D3 — Hardening: the riskiest assumptions (red-team)

1. **Trigger/timing (top risk).** The pain is acute only *after* a flop; the euphoric first-timer
   won't pay for a tool that might say no. → The buyer is the **2nd-time, burned** builder.
   *Testable:* who actually responds/pays in D2.
2. **"They want a yes, not a no."** People say they value honesty but may want *permission*. A
   tool that kills ideas can be emotionally rejected even when rationally valuable. → Frame the
   kill as *"saved you 3 weeks,"* the GO as *"build with a market-paid spec."* Adoption risk is
   real; it's a positioning problem, not a logic problem.
3. **Honesty-floor friction vs. willingness (biggest product risk).** The floor demands real work
   (build a page, run DMs, LIVE Stripe). Many will want a *magic verdict* without the work. → The
   page is cheap for this audience (their strength), and a managed SaaS removes the rest. But
   expect drop-off; instrument it.
4. **"Just use Claude / a GPT."** Substitution by general AI. → General AI gives reassurance, not a
   *real cold pay-proof + deterministic recompute*. The un-gameable gate is the moat — but users
   won't perceive the difference until they've been burned by reassurance.
5. **Segment size.** "Burned indie AI-builder who'll pay" — with AI builders exploding, even a
   small fraction is a real market. Labeled tailwind, not a number.

**Named wedge (v1):** *"The validation tool that won't lie to you — it makes a cold stranger pay
before you build, recomputes the verdict from the raw receipts, and is happy to tell you NOT to
build, so you stop burning AI-build cycles on apps nobody wants."*

## D4 — The Launch Thesis

> **Burned indie builders who ship with AI tools will pay ~$20–40 for a tool that forces a real
> cold-stranger pay-proof before they build — because it saves them weeks of wasted build cycles —
> and they value an honest NO as much as a GO.**

## Strategy (GTM for LaunchThesis itself)

- **First-100 channel.** Lead with 1:1 DMs + build-in-public on X, powered by the **recursive
  dogfood story**: *"I pointed my validation tool at my validation tool — here's the receipt."*
  That meta-narrative is the growth engine. The **plugin itself is a distribution channel** —
  in-ecosystem placement for CC-native builders. Then Product Hunt for the launch moment.
- **Declined plays (brand-safety, mandatory).** The pitch is anti-manipulation, so the marketing
  **must** decline fake scarcity, fake social proof, and manufactured urgency. Walking the talk is
  the brand. (A LaunchThesis that growth-hacks dishonestly refutes its own thesis.)
- **Conversion asset.** Landing leads with the honest-NO promise + the recursive-dogfood proof +
  a single `validate my idea` CTA.

## The SaaS-vs-plugin question, answered by the method

Instead of guessing, treat distribution as a **validation experiment** and let cold pay-proof
decide:

- **Plugin path** tests: do CC/Cursor-native builders install and *complete a loop*, and pay for a
  "pro" tier? Cheap to ship (it's today's form), in-ecosystem, low friction.
- **SaaS path** tests: do *non-CC* builders (Lovable/Bolt) pay for a managed, hosted version?
  Bigger TAM + the cross-user playbook moat, but real build cost.

**Recommendation (self-consistent with the thesis):** **ship the plugin now as the demand smoke
for the methodology**, and *in parallel* run a SaaS demand smoke — a `$49 managed validation`
pre-sell to non-CC builders. **Don't build the SaaS until a cold pay-proof on the SaaS-shaped
offer clears Gate V.** That is exactly what LaunchThesis would tell any other founder to do, so it
is what LaunchThesis does to itself. Plugin-first isn't a hedge — it's the cheapest real test, and
the SaaS adapters get built only on a pulse.

## What this dogfood tells the plan

- **Sharpen the ICP** in the kit's own positioning to the *burned* builder, not the euphoric
  first-timer — the trigger is loss, not optimism. (Feeds `product.positioning` + onboarding copy.)
- **The honest-NO is the headline**, not a footnote — lead the README and the landing with it.
- **Drop-off at the honesty floor is the #1 metric to instrument** — it's the make-or-break of the
  vibe-coder fit, and the strongest argument for the managed SaaS adapter.
- **The recursive dogfood is a marketing asset**, not just an internal exercise — ship this doc.
- **Distribution is now a gated experiment**, removing it from the "undecided open items" as a
  *guess* and reframing it as a *test* (plugin ships; SaaS waits on a cold pay-proof).

## Wedge record (versioned-wedge model)

```yaml
wedge:
  statement: "The validation tool that won't lie to you: a cold stranger must pay before you
    build, the verdict is recomputed from raw receipts, and an honest NO is a first-class outcome."
  version: 1
  status: named          # candidate → named here at D3; → validated only on a real cold pay-proof
  history:
    - version: 1
      statement: "(as above)"
      status: named
      date: 2026-06-17
```
