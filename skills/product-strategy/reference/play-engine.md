# Product-strategy engine — built-in pattern library & method

The self-contained engine the `product-strategy` skill runs on. It ships **complete** — a
user never has to supply an external deck. It covers: the card anatomy, the 12 strategy
families with their metrics and analysis lenses, a built-in library of product-design plays
(each with an original in-practice note), an original pairing graph, the conflict-flagging rules,
and the metric→play wiring for the Insight Loop.

Everything here is general product-design knowledge expressed as an operational engine. The
**in-practice notes and pairing graph are original BuilderKit material**, reasoned from how each
pattern actually works — not derived from any specific commercial deck. Stack- and
product-agnostic.

> Optional override: if `product.playbook_ref` points at a deck the user licenses and keeps
> outside this plugin, the skill may additionally consult it for that deck's specific named
> plays and pairings. A power-user convenience, not a requirement — the engine below is fully
> sufficient on its own.

---

## Card anatomy (how the engine reads any play)

Normalize every play to: **Mechanic** (what it does) · **Why it works** · **When** · **Do /
Don't** · **Pairs with** · **In practice** (the experiential one-liner) · **Maps to**
(audit-time: the concrete surface in *this* product + a P0/P1/P2 tier).

---

## Strategy families (what each optimises)

| Family | Optimises for | Core metrics | Analysis lens |
|--------|---------------|--------------|---------------|
| **Onboarding** | First familiarity → first value | Activation, Onboarding Completion, Step Drop-off, TTV | conversion funnel · segmentation · behavioural patterns |
| **Activation** | Experiencing core value | Activation, TTV, Feature Adoption | activation-path · journey friction · "aha" triggers |
| **Retention** | Coming back | D1/7/30, Stickiness, Streak Length | retention curve · usage evolution · habit triggers |
| **Engagement** | Activity & depth | Screens/Session, Duration, Adoption, Stickiness | engagement flow · discovery · interaction quality |
| **Growth & Viral** | Users bringing users | K-factor, Referral ROI, Organic Growth, Cycle Time | viral loop · network effects · channel quality |
| **Monetisation** | Free → paying | Free-to-Paid, Paywall Conv, ARPU, LTV, Trial-to-Paid, Churn | funnel · pricing & packaging · willingness-to-pay |
| **Conversion Optimisation** | Funnel-step efficiency | Conversion, Funnel Drop-off, Time-to-Convert, by-source | step friction · traffic quality · timing/urgency |
| **Experience Refinement** | Delight & premium feel | Task Success, Duration, CSAT/NPS, Error Rate | usability · experience quality · design effectiveness |
| **Trust Building** | Credibility & confidence | Permission Grant, Complex-Flow Completion, Trust Tickets | permission timing · flow confidence · trust issues |
| **Intent Shaping** | Commitment & product fit | Profile Completion, Abandonment, Task Success | collection friction · data value · willingness to share |
| **Habit Formation** | Sticky repeated usage | WAU, Session Frequency, Streak Completion, Return-30d | usage rhythm · reinforcement · behavioural triggers |
| **Premium Positioning** | High-value perception | ARPU, Price Sensitivity, Premium CSAT | premium value · pricing power · premium experience |

**Weighting rubric (Step 1 of every audit):** daily-habit product → Habit + Retention +
Onboarding Critical · one-shot utility → Activation + Sharing + TTV Critical, Habit Later ·
trust-led / sensitive / regulated → Trust Building Critical and governs what's allowed ·
pre-revenue → Monetisation / Premium / Conversion Later.

---

## Built-in play library

Recognised patterns grouped by function. Each carries an original in-practice note.

### Feedback & life
- **Micro-interactions** — small functional animations/haptics on taps, transitions, success/error. Pairs: loading feedback, success moments.
  > *In practice:* If you can afford polish in only one place, spend it on the instant right after a tap. Confirming "I heard you" buys more perceived quality than any animation users have to wait through.
- **Loading / skeleton feedback** — structure the wait; progress over spinners; optimistic UI where safe. Pairs: micro-interactions, labor illusion.
  > *In practice:* A progress bar honest about being slow beats a spinner pretending to be fast. Users forgive waiting; they don't forgive being misled. Show what's happening, not just that something is.
- **Success moments** — mark completion of a key action immediately. Pairs: micro-interactions, streaks, sharing.
  > *In practice:* Celebrate the action, not the app. "You did this" compounds; "look what we made" wears off by the third time.

### Onboarding accelerants
- **Empty states as doors** — turn blank screens into the single next action. Pairs: setup defaults, time-to-value, discovery.
  > *In practice:* The empty screen is the most-read screen in your product on day one. Write it like the first line of onboarding, not like an error.
- **Setup defaults** — pre-fill a usable starting state. Pairs: personalisation, progressive disclosure.
  > *In practice:* The fastest onboarding is the one users don't notice. Every field you can pre-fill is a decision you've spared them — but keep defaults reversible, or "helpful" becomes "presumptuous."
- **Sandbox / no-account trial** — let users feel value before committing to signup. Pairs: time-to-value, success moments.
  > *In practice:* Let people taste the value before you ask who they are. A signup wall in front of the "aha" is a tollbooth on a road nobody's decided to take yet.
- **Endowed progress** — show progress already made; people finish what looks started. Pairs: streaks, setup defaults.
  > *In practice:* Give them step 2 of 5 with step 1 pre-checked, not 0 of 5. The head start is free and the completion lift is real.
- **Progressive disclosure** — reveal complexity in layers. Pairs: time-to-value, intent reflection.
  > *In practice:* Complexity isn't the enemy; complexity shown too early is. Reveal the next layer when the user reaches for it, not when you're proud of it.

### Value navigation
- **Time-to-value compression** — shrink first-touch → first benefit. Pairs: setup defaults, empty states.
  > *In practice:* Measure the seconds between "opened" and "felt something worth it," and treat each one as a leak. This number predicts retention better than any feature you could add.
- **Discovery / suggestion** — guide users to value before they know where to look. Pairs: empty states, personalisation.
  > *In practice:* Don't make people hunt for value you already know they want. Good discovery feels like mind-reading; bad discovery feels like a scavenger hunt.
- **Deep linking** — land users exactly at the moment that matters. Pairs: time-to-value, sharing.
  > *In practice:* Every notification, share, and widget should land one tap from the value. A link that dumps people on a home screen wastes the intent that made them tap.

### Commitment & investment
- **Intent declaration** — let users state a goal; design around it. Pairs: personalisation, streaks, reflection.
  > *In practice:* When a user says out loud what they're here to do, follow-through jumps — and you earn the right to shape the whole experience around that goal. Ask early, then make every screen pay off the promise.
- **Investment** — small user inputs that improve the product and deepen attachment. Pairs: personalisation, progress resurfacing.
  > *In practice:* Every piece a user puts in is a reason to return and a reason not to leave — but ask only after you've given value, or it reads as a chore before a payoff.
- **Sunk-cost surfacing** — acknowledge accumulated effort so leaving feels costly. Pairs: success moments, streaks, progress resurfacing.
  > *In practice:* The work users have already done is your stickiest feature. "You've logged 40 days" isn't a stat — it's the reason staying feels like protecting something and leaving feels like throwing it away.

### Habit engines
- **Streaks / gamified progress** — visible streaks/levels that trigger return. Pairs: success moments, reminders, sharing.
  > *In practice:* A streak that punishes a missed day harder than it rewards a kept one trains people to quit after their first slip. Design the recovery — the "you're back" moment — not just the counter.
- **Home-screen widget** — value + re-entry from the OS home screen. Pairs: deep linking, streaks.
  > *In practice:* A widget is the only part of your product that works while your product is closed. Earn that real estate with one glanceable truth, not a shrunk-down dashboard.
- **Variable reward** — calibrated unpredictability to sustain return. **High-caution.** Pairs: micro-interactions, discovery.
  > *In practice:* The strongest hook and the easiest to abuse. On anything built on trust or used by vulnerable people, reach for it last — and never let it undercut the reliability you're actually selling.
- **Progress resurfacing** — resurface progress outside the product. Pairs: success moments, sunk-cost surfacing, deep linking.
  > *In practice:* Resurface progress as distance travelled, not as a nudge. "Here's how far you've come" pulls; "we miss you" pushes — and people feel the difference.

### Trust & safety
- **Confirmation friction** — guard destructive/irreversible actions. Pairs: outcome copy, familiar conventions.
  > *In practice:* Friction is a feature when it stands between a user and a mistake they can't undo. Spend it only there — every other slowdown is just tax.
- **Value-framed permissions** — request access in-context, framed as the benefit. Pairs: success moments, setup defaults.
  > *In practice:* Ask at the moment the value is obvious, framed as what it unlocks, not the access it grants. "Get reminded" converts; "Allow notifications" doesn't.
- **Familiar conventions** — use familiar conventions for load-bearing actions. Pairs: loading feedback, outcome copy.
  > *In practice:* Borrow the conventions users already know for anything load-bearing. Originality in a checkout flow or a camera button is a tax on every user — save novelty for where it delights, not where it confuses.
- **Outcome-oriented copy** — words that move users toward the next action. Pairs: almost everything.
  > *In practice:* Write every button as the outcome the user wants, not the action the system performs. "See my results" beats "Submit" because one is a promise and the other is a chore.

### Conversion & monetisation
- **Earned paywall** — gate after value is felt, not before. Pairs: investment, success moments, time-to-value.
  > *In practice:* A paywall before value feels like a wall; after the user has felt the value, it feels like the natural next step. Let them want it before you gate it.
- **Honest limited offer** — genuine, time-bound, explained urgency. **No fake scarcity.** Pairs: paywall, deep linking.
  > *In practice:* Real deadlines convert and fake ones corrode. A countdown that resets when the user leaves teaches them you're not to be believed.
- **Friction by design** — purposeful slowdown for clarity/confidence/commitment. Pairs: progressive disclosure, labor illusion.
  > *In practice:* Slowness on purpose earns its keep only when it buys the user clarity or confidence they'd otherwise lack. Slowing them to help your metrics is a dark pattern wearing a UX hat.
- **Labor illusion** — a brief, honest pause that signals work. Pairs: loading feedback, friction by design.
  > *In practice:* A short pause can make a result feel considered rather than canned — but it's seasoning, not substance. Add a beat where it signals craft; never one that just makes people wait.

### Identity & delight
- **Signature quirk** — one repeatable moment of character. Pairs: micro-interactions, outcome copy.
  > *In practice:* One small repeatable moment does more for identity than a redesign. Pick the single thing people will screenshot or describe to a friend, and make it unmistakably yours.
- **Premium polish** — craft and restraint that justify high-value perception. Pairs: micro-interactions, familiar conventions.
  > *In practice:* Premium isn't more; it's restraint executed precisely. The feeling comes from nothing being slightly off — from removing every small wrongness, not adding flourish.

### Sharing & growth
- **Opt-in shareable artifact** — turn pride into a user-controlled shareable. Pairs: success moments, referral.
  > *In practice:* The strongest growth is users sharing pride, not you asking for referrals. A share the user initiates carries credibility a prompt never will — make the proud moment effortless to share and entirely their choice.
- **In-flow referral** — sharing/invites built into the flow with two-sided value. Pairs: shareable artifact, deep linking.
  > *In practice:* Referral works when both sides win and the ask lands at a moment of genuine satisfaction. Bolt it onto a frustrated user and you've turned an advocate into an annoyance.
- **Network / contact bridging** — bootstrap via existing contacts/graphs. **Off-brand for privacy-led products.** Pairs: permissions, deep linking.
  > *In practice:* Potent and easily resented. If your promise touches privacy or discretion, this play is off the table — the trust you'd spend is worth more than the growth you'd gain.

---

## Compounding combos (pairing graph)

Original BuilderKit pairings — which plays multiply each other, and why. Reach for the whole
combo, not the single play, when the goal in the heading is the job.

- **Activation triad — `setup defaults + empty states + time-to-value`.** Defaults kill the blank page, empty states point at the first action, TTV compresses the path to it. Use together whenever first-run matters.
- **Habit backbone — `success moments + streaks + progress resurfacing`.** Reward the action, make the streak the reason to return, replay progress to pull them back when they drift. The spine of any daily-use product.
- **Retention-through-investment loop — `investment + sunk-cost surfacing + progress resurfacing`.** Investment builds the asset, sunk-cost surfacing surfaces what they've accumulated, progress resurfacing reminds them it exists outside the app. Makes leaving feel like a loss.
- **Commitment-to-fit path — `intent declaration + personalisation + progressive disclosure`.** A stated goal licenses personalisation; disclosure reveals depth exactly as the goal demands it. Turns a generic product into "made for me."
- **Trust triad — `confirmation friction + outcome-oriented copy + familiar conventions`.** Guard the irreversible, name consequences in plain language, lean on familiar conventions so users feel safe. Essential for anything destructive, financial, or health-adjacent.
- **Monetisation sequence — `time-to-value → success moments → earned paywall`.** Deliver value fast, mark the win so it's felt, then gate depth. Order matters — the paywall only works after the value lands.
- **Growth loop — `success moments + opt-in shareable artifact + in-flow referral`.** A celebrated moment becomes a shareable artifact becomes an invite — but only at the peak, and only opt-in. Forced, it backfires.
- **"Feels considered" cluster — `loading feedback + labor illusion + micro-interactions`.** Structure the wait, add a beat of craft, confirm every touch. Cheap polish that reads as quality.
- **Right-thing-right-place cluster — `discovery + deep linking + personalisation`.** Surface what they want, land them on it in one tap, tuned to them. Collapses the distance between intent and value.

---

## High-leverage primitives

When unsure where to start an audit, these recur across the most strategies and are usually
safe, on-brand entry points: **success moments · time-to-value · habit engine (streak/
progress) · micro-interactions · personalisation (on-device where privacy is the wedge) ·
progressive disclosure.**

---

## Flagging rules (the part that protects the brand)

A Play Audit is not "apply every play." Declining plays is a deliverable. Apply every run:

- **Sensitive category** (`product.sensitive_category: true` — health, finance, self-image,
  minors): flag manipulation-adjacent plays hard. **Variable reward**, **fake/urgency limited
  offers**, and **intentional-friction-as-conversion** → minimised or skipped, reason written.
- **Privacy-as-wedge** positioning: **skip** contact/social-graph bridging; **constrain**
  permissions to in-context + value-framed; personalisation **on-device only**.
- **Friction belongs on safety, not sales.** Guarding destructive actions is legitimate;
  friction to inflate perceived value or push upgrades on a trust brand is not.
- **Exit-safety check.** Anything an acquirer would find litigious, manipulative, or
  brand-damaging is out, regardless of short-term lift.

Encode each flagged play as: **use as-is / constrain (how) / skip (why).**

---

## Standard metric formulas (functional)

- **Activation** = (complete core action ÷ signups) × 100 · **TTV** = avg signup → first core action
- **Onboarding Completion** = (finished ÷ started) × 100 · **Step Drop-off** = (dropped at N ÷ reached N) × 100
- **D1/7/30 Retention** = (active day X ÷ cohort) × 100 · **Stickiness** = DAU ÷ MAU
- **Streak Completion** = (maintain N-day ÷ started) × 100 · **Return-30d** = (returned ÷ were inactive 30d) × 100
- **WAU / Session Frequency** · **Feature Adoption** = (used X ÷ activated) × 100
- **Free-to-Paid** = (paid ÷ free) × 100 · **Paywall Conv** = (upgraded ÷ saw paywall) × 100
- **ARPU** = revenue ÷ users · **LTV** = (ARPU × margin %) ÷ churn · **Churn** = (lost ÷ start) × 100
- **Conversion** = (completed ÷ entrants) × 100 · **Funnel Drop-off** = (abandoned at X ÷ reached X) × 100
- **Permission Grant** = (granted ÷ requested) × 100 · **Task Success** = (completed ÷ attempts) × 100 · **Error Rate** = (failed ÷ total) × 100
- **K-factor** = invites/user × acceptance · **Organic Growth** = (new organic ÷ total) × 100

### Metric → play wiring (fill per product during an audit)

| Metric | This product's definition | Plays that move it |
|--------|---------------------------|--------------------|
| (fill) | | |

---

## Insight Loop

1. Pick **one** metric to improve.
2. Read that family's analysis lens (table above).
3. Match findings to the play(s) — or the combo — that kills the friction.
4. Ship **one** play (`/builderkit:ship`), then re-measure — never batch.
