# Owner verification required

Facts the website needs, that only the owner can confirm. Nothing on this list
may be guessed, inferred from a neighbouring value, or filled in to make a page
look finished. Each entry says where the blank currently is and what the site
does while it stays blank.

---

## 1. Warranty effective date — BLOCKING a published date

**Needed:** the date the Limited Lifetime Workmanship Warranty policy takes
effect.

**Where it goes:** `WARRANTY_EFFECTIVE_DATE` in `lib/content/warranty.ts`
(currently `null`).

**Why it cannot be guessed.** The policy is explicitly **not retroactive**:
contracts signed before this date keep the five-year term they were sold. That
makes the date a term of somebody's signed contract, not a presentation
detail. A wrong date tells a real customer they hold a warranty they do not
hold — in either direction.

**What the site does meanwhile.** `/warranty/` prints no date. It says the
effective date is being confirmed, points the reader at the warranty document
provided with their project as the controlling agreement, and states plainly
that earlier contracts keep their original five-year term. All of that is true
today, so nothing has to be retracted when the date arrives.

**To fill it in:** set the constant to a display string (for example
`'1 November 2026'`). The warranty page switches to the dated sentence
automatically; no other file needs touching.

---

## 2. Transferability — confirmed per job, not advertised

**Needed:** written transfer terms, if the warranty is ever to be presented as
transferable to a subsequent owner.

**Where it goes:** `WARRANTY_QUALIFIES` in `lib/content/warranty.ts`, and the
transferability FAQ on `/warranty/`.

**Why it is held back.** The confirmed policy is non-transferable unless a
signed contract explicitly says otherwise. Advertising a transfer the standard
document does not grant would be the most expensive kind of wrong — a buyer
purchases a house partly on it.

**What the site does meanwhile.** Both the eligibility list and the FAQ say to
assume it does not transfer, and invite the customer to raise it before signing
so the answer is given in writing for that job. No change needed when terms are
adopted; the copy just becomes more specific.

---

## 3. Commercial warranty terms — deliberately undated

**Needed:** nothing, unless the owner wants to publish commercial terms.

**Where it is handled:** `WARRANTY_COMMERCIAL_STATEMENT` in
`lib/content/warranty.ts`, and the three-category table on `/warranty/`.

**Why.** The Limited Lifetime term is residential. Commercial, warehouse and
industrial floors carry project-specific terms stated in the written proposal.
`scripts/verify-site.mjs` fails the build if a lifetime promise ever appears
next to a commercial word, so this cannot drift by accident.

---

## 4. GA4 measurement ID — analytics is dark without it

**Needed:** the GA4 Measurement ID (`G-XXXXXXXXXX`) for the Houston Superior
**Epoxy** property — not the Painting one.

**Where it goes:** `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel, then redeploy
(`NEXT_PUBLIC_*` is baked in at build time).

**What the site does meanwhile.** `lib/analytics.ts` self-disables: no GA
script, no GA cookie, and `generate_lead` is a no-op. The Meta Pixel
(`908445922031813`) is configured and firing, so Meta conversions are
unaffected.

---

## 5. Meta Conversions API token — browser-only tracking meanwhile

**Needed:** `META_CAPI_ACCESS_TOKEN` (a secret — set it in the Vercel
dashboard, do not paste it into a chat or commit it).

**What the site does meanwhile.** The Pixel fires client-side with a shared
`eventID`, and `lib/meta.ts` is already written to deduplicate against the
server event. Without the token, conversions blocked by iOS or an ad blocker
are simply lost rather than recovered server-side.

---

## How to use this file

Fill a value in at the location named, delete its section, and run:

```
node scripts/verify-site.mjs
node scripts/verify-site.mjs https://houstonsuperiorepoxy.com
```
