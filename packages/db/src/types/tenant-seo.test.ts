import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EMPTY_SEO, normalizeSeoJson } from "./tenant-seo";

describe("normalizeSeoJson", () => {
  it("returns EMPTY_SEO for nullish input", () => {
    assert.deepEqual(normalizeSeoJson(null), { ...EMPTY_SEO });
    assert.deepEqual(normalizeSeoJson(undefined), { ...EMPTY_SEO });
  });

  it("preserves store, social, and technical fields", () => {
    const normalized = normalizeSeoJson({
      siteTitle: "Acme Shop",
      metaDescription: "Buy stuff",
      keywords: ["acme", 12, "shop"],
      canonicalUrl: "https://example.com/acme",
      robots: { index: false, follow: true, extraRules: ["Crawl-delay: 10"] },
      openGraph: {
        title: "OG Acme",
        description: "OG desc",
        imageUrl: "https://cdn.example/og.jpg",
        type: "website",
      },
      twitter: {
        card: "summary",
        title: "TW Acme",
        description: "TW desc",
        imageUrl: "https://cdn.example/tw.jpg",
      },
      jsonLd: [{ "@type": "Organization", name: "Acme" }, "skip-me"],
      rationale: "Improve CTR",
    });

    assert.equal(normalized.siteTitle, "Acme Shop");
    assert.deepEqual(normalized.keywords, ["acme", "shop"]);
    assert.equal(normalized.robots?.index, false);
    assert.deepEqual(normalized.robots?.extraRules, ["Crawl-delay: 10"]);
    assert.equal(normalized.openGraph?.title, "OG Acme");
    assert.equal(normalized.twitter?.card, "summary");
    assert.equal(normalized.jsonLd?.length, 1);
    assert.equal(normalized.rationale, "Improve CTR");
  });

  it("defaults robots index/follow to true when omitted", () => {
    const normalized = normalizeSeoJson({ siteTitle: "X" });
    assert.equal(normalized.robots?.index, true);
    assert.equal(normalized.robots?.follow, true);
  });
});
