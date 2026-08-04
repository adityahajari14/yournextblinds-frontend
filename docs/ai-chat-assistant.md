# Nova — AI Chat Assistant

Storefront shopping assistant backed by Google Gemini. Answers product, sizing,
and pricing questions using the site's own catalog and pricing engine.

**Nova** is the shopper-facing name. It is set in two places that must stay in
sync: `ASSISTANT_NAME` in `ChatWidget.tsx` (UI chrome and greeting) and the
opening lines of `SYSTEM_PROMPT` in `knowledge.ts` (so the model self-identifies
as Nova and deflects questions about the underlying model).

The avatar (`NovaAvatar.tsx`) is drawn from the site logo's cascading-slat motif
rather than a stock chat bubble, so it reads as Your Next Blinds branding. It
ships in two variants: the header disc (`NovaAvatar`) and the launcher glyph
(`NovaLauncherIcon`), which adds a small chat tail.

## Setup

1. Create a free API key at <https://aistudio.google.com/apikey>.
2. Set `GEMINI_API_KEY` in `.env.local` (and in Vercel project settings for deploys).
3. Restart the dev server.

Without a key the widget still renders and degrades to a friendly "can't reach
the assistant" message — it never surfaces an error to the shopper.

| Env var | Default | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | — | Required for the model to respond |
| `CHAT_PROVIDER` | `gemini` | Provider selector |
| `CHAT_MODEL` | `gemini-3.5-flash-lite` | Model id |

### Free-tier quota — read this before launch

Measured on this project (Aug 2026), not documented by Google:

| Model | Free-tier requests/day |
| --- | --- |
| `gemini-3.6-flash` | **20** |
| `gemini-3.5-flash-lite` | higher — the current default |

**20/day on `gemini-3.6-flash` is not viable for a live storefront**, which is why
the default is `gemini-3.5-flash-lite`. Note one shopper message can cost 2-4
requests, since each tool call is its own model round trip — so daily quota
divided by ~3 is the real conversation ceiling.

Check current usage at <https://ai.dev/rate-limit>. To read the exact quota for a
model, call it directly and inspect the 429 body — the `limit: N` in the error
message is authoritative where the docs are not:

```sh
curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" -H "Content-Type: application/json" \
  -d '{"contents":[{"role":"user","parts":[{"text":"hi"}]}]}'
```

When quota runs out the widget degrades to "We're getting a lot of questions right
now" — shoppers never see an error. If that message becomes common, either enable
billing on the Google project or switch providers.

## Architecture

```
ChatWidget (client)  →  POST /api/chat  →  guard → Gemini ⇄ tools → guard → reply
```

- `src/lib/server/chat/provider.ts` — provider-neutral interface
- `src/lib/server/chat/gemini.ts` — Gemini transport (the only provider-aware file)
- `src/lib/server/chat/search.ts` — query parsing + relevance ranking
- `src/lib/server/chat/tools.ts` — the four storefront tools (search, product
  details, price, lead capture)
- `src/lib/server/chat/subscribers.ts` — Shopify customer upsert for captured leads
- `src/lib/server/chat/knowledge.ts` — brand facts + system prompt
- `src/lib/server/chat/guard.ts` — abuse screening, price guard, rate limiting
- `src/app/api/chat/route.ts` — tool loop
- `src/components/chat/ChatWidget.tsx` — UI
- `src/components/chat/NovaAvatar.tsx` — brand avatar (header + launcher variants)

### Reset

The header's reset button (left of the close button) starts a fresh conversation.
It clears the transcript **and rotates the session id** — leaving the id in place
would attribute the new conversation's analytics to the old session. The price
ledger is per-request server-side, so it clears on its own.

All model and catalog calls happen server-side; no credentials reach the browser.

### Swapping providers

`ChatProvider` is the seam. To move to another model, implement the interface and
register it in `getChatProvider()`. Tool schemas, the system prompt, the guards,
and the UI are all provider-neutral and need no changes.

### Thought signatures (Gemini 3.x) — do not "clean up"

Gemini 3.x attaches an opaque `thoughtSignature` to function-call parts and
**rejects** a resent history that has lost it:

```
400 INVALID_ARGUMENT — Function call is missing a thought_signature in
functionCall parts.
```

Because this SDK has no server-side conversation state, every turn is resent, so
the signatures must survive the round trip. `ChatReply.raw` carries the provider's
verbatim parts and `ChatTurn.raw` replays them unchanged — that is why the model
turn is not rebuilt from the normalized `text`/`toolCalls` fields when `raw` is
present. Reconstructing those parts, reordering them, or dropping `raw` to
"simplify" the type will reintroduce the 400 on any multi-tool query.

## Tools

| Tool | Wraps | Purpose |
| --- | --- | --- |
| `search_products` | `fetchShopifyProductsPageMerged` | Find products by query |
| `get_product_details` | `fetchShopifyProductByHandleMerged` | Colors, description, delivery |
| `get_price` | `calculateProductPrice` | Exact made-to-measure price |

Called in-process, not over HTTP. `get_price` passes `variantCode`/`variantLabel`
through so multi-table products (Roller Band F, Dayandnight Band H) resolve the
correct per-color price band rather than falling back to the product-level band.

### Search relevance (`search.ts`)

Shopify's Storefront search **ANDs every term**, so passing a shopper's sentence
straight through returns nothing: "vertical blinds in black color" matched zero
products because no title contains "in" or "color". `searchCatalog()` fixes this:

1. **Parse** — strip stopwords, singularize ("blinds" → "blind"), and extract
   product type, colors, features, and room.
2. **Room → feature mapping** — "bathroom"/"kitchen" imply waterproof,
   "bedroom"/"nursery" imply blackout. Shoppers rarely name the feature directly,
   so "anything for a bathroom" returns waterproof blinds with no keyword overlap.
3. **Strategy fallback** — try the narrow query first, then progressively broader
   ones (type + modifier → type alone → feature → color), **sequentially with an
   early exit**. Running them in parallel triples Storefront API load per search
   and trips Shopify's rate limiter under real traffic.
4. **Rank** — product type is weighted heaviest (+100 title match, −60 for the
   wrong type), then color (checked in variant titles as well as the product
   title), features, and remaining terms.

Results are cached in-memory for 2 minutes, keyed on parsed terms so
"show me black vertical blinds" and "black vertical blind" share an entry.

To tune ranking, temporarily add a dev-only route calling `searchCatalog()` and
`parseQuery()` and inspect the scores — the weights above are the levers.

## Safety guarantees

These are enforced in code, not by prompt instructions alone — prompt rules are
guidance a model can be talked out of, which matters more on a free-tier model.

**Scope.** `screenUserMessage()` rejects instruction-override attempts, prompt
extraction, persona swaps, and general-assistant requests (code, essays,
translation, homework, model questions) *before* a model call is spent. Verified
against 30 cases covering evasion phrasings and blinds-domain false positives.

**Pricing.** The model is never trusted as a source of prices. Every figure a tool
returns — `get_price` quotes and the catalog from-prices in `search_products` /
`get_product_details` — is recorded in a per-conversation ledger;
`sanitizeResponse()` strips any currency figure in the model's prose that isn't in
that ledger and replaces it with a prompt for measurements. This blocks
hallucinated prices *and* the arithmetic case ("two of those would be $378").
Blocked prices are logged and counted in analytics — a rising `blockedPrices`
count means the model is misbehaving and it's time to reconsider the provider.

**Orders.** There is no order-lookup tool. Order, tracking, refund, and
cancellation questions are matched and answered deterministically with a link to
the Shopify account portal, without a model call.

**Other.** 10 requests/min per IP; 800-char message cap; 16-turn history cap;
6-iteration tool-loop cap; secret-pattern redaction on all outbound text.

## Policy answers (`src/data/policies.ts`)

Nova can answer general questions about all four store policies — refunds/
returns/warranty, shipping, terms & conditions, privacy — from real policy
content, not invented text.

`policies.ts` holds a structured copy of each policy page's sections. It is
**chat-only knowledge, not wired into the actual policy pages** — `/refund-policy`,
`/shipping-policy`, `/terms-and-conditions`, and `/privacy-policy` keep their own
independent, verbatim content. This is deliberate: Terms & Conditions and
Privacy Policy are 20-30 clauses of legal boilerplate (indemnification,
governing law, IP, liability caps) that shouldn't be handed to an LLM to recite
as if reciting the binding text, and shouldn't silently change if someone edits
prompt copy. So:

- **Refund and shipping policy** are copied verbatim (no legal boilerplate to
  trim) and rendered in full — every section, in `renderPolicyFull()`.
- **Terms & conditions and privacy policy** are condensed to an intro + section
  list via `renderPolicySummary()`, plus a few hand-written practical facts
  (e.g. "we do not sell personal information"). The prompt explicitly tells the
  model not to recite specific clauses or invent legal terms, and to link the
  real page for anything requiring exact wording.

**There is no automated sync between a policy page and `policies.ts`.** If a
policy page's content changes, `policies.ts` must be updated by hand as a
separate step, or the assistant will answer from stale policy text.

The order-lookup guard in `guard.ts` still splits general policy questions
("what is your return policy") from order-specific ones ("where is my order",
"can I return this") — see the comment on `ORDER_LOOKUP_PATTERN` for the exact
boundary. Only the latter gets deflected to the account portal.

## Production readiness

Audited 2026-08-02. Overall: **functionally solid, two items need a decision
before real traffic.**

**Confirmed working:**
- API key never reaches the client bundle (server-only imports, no `NEXT_PUBLIC_*`).
- Tool failures (a throttled Shopify call, a bad handle) degrade to a `{error}`
  result the model can recover from, not a 500 that kills the turn.
- Network failure in the browser (fetch throws) shows a friendly retry message,
  not a blank/broken widget.
- Thought-signature replay (`raw` passthrough) only matters within one request's
  own tool loop — history rehydrated from the client (text-only) doesn't need it,
  confirmed by re-reading how `ClientTurn[]` is converted in `route.ts`.
- Guard regressions re-verified after this session's changes: order lookups
  still refuse deterministically, policy questions still reach the model.

**Needs a decision — not code-blocked, but load-bearing:**

1. **Vercel function duration vs. plan tier — resolved, on Pro.** `maxDuration = 30`
   is declared; Pro allows up to 60s (Hobby hard-caps at 10s regardless of what's
   declared). A multi-tool query (search → details → price → prose) can take
   15-25s+ across several model round trips, so Pro's ceiling gives comfortable
   headroom. No action needed.
2. **Rate limiting is per-instance, not global.** The in-memory 10 req/min cap
   (same tradeoff as `/api/search/suggestions`) doesn't hold across concurrent
   serverless instances. Given the Gemini free tier's daily cap is in the tens
   of requests (not hundreds — see below), a burst of traffic spread across
   instances could exhaust the shared daily quota well before any single
   instance's rate limit fires. Low risk at low traffic, real risk if the bot
   gets featured/promoted.

**Measured, not guessed:**
- `gemini-3.6-flash` free tier: **20 requests/day**, confirmed from the 429
  error body in an earlier session. Not viable for production traffic.
- `gemini-3.5-flash-lite` (current `CHAT_MODEL`): quota not exhausted despite
  heavy testing across this session and the last, but Google does not expose
  the actual daily limit until it's hit — there is no number to report, only
  "higher than 20." Treat this as an open question, not a green light: watch
  `chat_message` events for `outcome: provider_error` / `kind: rate_limited`
  after launch, and have a paid-tier or provider-switch plan ready if it fires
  during real traffic.

## Lead capture (`capture_lead` tool, `subscribers.ts`)

Nova can capture a shopper's name and email during conversation and add them
as a Shopify customer with marketing consent — the same customer record every
other marketing flow uses, not a separate database. Two soft asks per
conversation, both skippable and non-blocking:

1. **Name, once, after the first answer.** "By the way, who am I chatting
   with?" — never before answering the shopper's actual question. If ignored
   or answered with something that isn't a name, Nova drops it silently and
   never asks again in that conversation.
2. **Email, once, framed as offers — never as delivering a quote.** Offered at
   a natural moment (after a price, or when the shopper seems to be wrapping
   up): "Want me to let you know about deals and offers by email?" Deliberately
   *not* "I'll email you this quote" — the price is already visible in the
   chat, so that framing would be a false pretext for the ask. A decline is
   final; no follow-up, no "are you sure?"

Both rules live in `SYSTEM_PROMPT`'s `# GETTING TO KNOW THE SHOPPER` section in
`knowledge.ts` — this is prompt behavior, not code-enforced, the same category
as tone and scope. `capture_lead` itself is only ever called after the shopper
clearly agrees; a shopper mentioning an email in passing is not treated as
consent.

`src/lib/server/chat/subscribers.ts` (`captureChatSubscriber`) mirrors
`newsletter.service.ts`'s Shopify Admin GraphQL upsert (lookup by email →
create or update → set marketing consent), tagged `chat-assistant` instead of
`newsletter-popup` so these are distinguishable in Shopify. Same trust rule as
pricing: the tool only returns `{saved: true}` on a real Shopify success, and
the prompt is told never to claim it saved an email it didn't actually save.
Verified end-to-end against the live store — a real customer was created with
the correct tag and `SUBSCRIBED` marketing state, then deleted as test cleanup.

**Known constraint, not introduced by this feature:** this store's Shopify app
is not approved for direct PII field reads (`email`, `firstName`) on the
`Customer` object — confirmed via a direct Admin API query, which returned
`ACCESS_DENIED` for those two fields specifically. This doesn't block
`capture_lead` (the lookup only needs `id`/`tags`/`emailMarketingConsent`, and
the create/update mutations write successfully), but if a future feature needs
to *read back* a customer's email or name from the Admin API, that will need
approval on Shopify's PII access flow first (Shopify, Advanced, or Plus plan).

## Analytics

Emits `chat_opened` and `chat_message` through the existing events service, so
they appear in `/admin/analytics`. `chat_message` meta carries `outcome`,
`reason` (for refusals), `toolCalls`, `blockedPrices`, `leadCaptured`, and
`model`.

## Known limits

- Responses are not streamed — the widget shows a typing indicator and renders
  the full reply. Streaming with a tool loop adds meaningful complexity; worth
  revisiting if replies feel slow in production.
- Rate limiting is per-instance and in-memory, so it's a soft cap across
  serverless instances (same tradeoff as `/api/search/suggestions`).
- The guard's misuse patterns are deliberately narrow to avoid refusing real
  shoppers. The system prompt handles borderline cases the regexes don't.
