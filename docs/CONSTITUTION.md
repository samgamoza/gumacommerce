# GUMA ai-Commerce Constitution

**Status:** Adopted  
**Date:** 2026-07-12  
**Authority:** Highest priority for all product and engineering decisions

---

## Core identity

GUMA ai-Commerce is an **AI-powered, human-controlled** commerce platform for social sellers, SMEs, and entrepreneurs.

**AI serves. Humans decide. Merchants own.**

If an implementation conflicts with this principle, redesign it.

---

## Product philosophy

The merchant should never spend time configuring what AI (or deterministic software) can confidently understand.

Every screen, workflow, agent, API, schema, and automation must **reduce friction**, never increase it.

---

## Product vision

We are **not** building another Shopify clone.

We are building an **AI Commerce Operating System**. The storefront is one capability. The platform helps merchants launch, operate, market, sell, analyze, automate, and grow — with AI assistance and merchant authority.

---

## Two experiences

### GUMA Launch (Freemium)

Help merchants launch a professional storefront in minutes.

- Prefer **deterministic** systems (rules, metadata, scoring)
- Avoid unnecessary AI / LLM usage
- Flow: Signup → Business Profile → Store DNA → Top 3 templates → Selection → Personalize → Preview → Publish
- **Install** curated templates; **personalize** them — do not generate layouts/CSS/components with AI

### GUMA Workspace (Paid)

Become the merchant’s AI business operator (marketing, analytics, campaigns, SEO, pricing, live selling, multi-agent workflows).

Keep Launch lightweight. Keep Workspace intelligent.

---

## Template philosophy

Templates are **proven commerce experiences**, not mere themes.

Each template is a reusable product package with structured metadata (industry fit, product count, style, conversion focus, mobile score, live-selling compatibility, SEO, accessibility, features).

Selection uses **metadata + rules + scoring** first. Use AI only when it materially improves recommendations.

---

## AI philosophy

Prefer rules, metadata, configuration, scoring, caching, and structured workflows **before** invoking an LLM.

Reserve advanced LLM orchestration for paid Workspace features with clear business value.

---

## Human control

Significant business changes follow:

**Draft → Preview → Merchant Approval → Publish**

AI may suggest, prepare, analyze, and automate **approved** workflows. AI must not perform critical actions without merchant authorization unless the merchant explicitly enables that.

---

## Engineering principles

Modern modular monolith · DDD · Event-driven workflows · Plugin-ready · Strong typing · Strict validation · Observability · Cost awareness · Security by default

Avoid unnecessary complexity. Every abstraction must justify itself.

---

## Guiding question

> Does this make commerce simpler for merchants while preserving their control?

If the answer is no, redesign it.

---

## Plan mapping (canonical)

| Constitution label | DB / billing id | Role |
|--------------------|-----------------|------|
| Free | `free` | GUMA Launch |
| Pro | `growth` | GUMA Workspace (standard) |
| Advance | `pro` | GUMA Workspace (advanced) |

Prices (PHP/mo): Free ₱0 · Pro (growth) ₱499 · Advance (pro) ₱999

---

## Related docs

- `docs/ARCHITECTURE.md` — domain map and folder conventions
- `docs/CONSTITUTIONAL-REFACTORING-ASSESSMENT.md` — assessment & roadmap
- `docs/COMPREHENSIVE-HANDOFF-2026-07-12.md` — repo state snapshot
