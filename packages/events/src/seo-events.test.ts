import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DomainEventSchema,
  EVENT_NAMES,
} from "./schemas";

describe("SEO domain events", () => {
  it("registers Seo.*.V1 names", () => {
    assert.equal(EVENT_NAMES.SEO_UPDATED, "Seo.Updated.V1");
    assert.equal(EVENT_NAMES.SEO_CHANGE_APPROVED, "Seo.ChangeApproved.V1");
    assert.equal(EVENT_NAMES.SEO_PUBLISHED, "Seo.Published.V1");
    assert.equal(EVENT_NAMES.SEO_ROLLED_BACK, "Seo.RolledBack.V1");
  });

  it("accepts Seo.Published.V1 payloads", () => {
    const parsed = DomainEventSchema.parse({
      name: EVENT_NAMES.SEO_PUBLISHED,
      tenantId: "11111111-1111-1111-1111-111111111111",
      data: {
        tenantId: "11111111-1111-1111-1111-111111111111",
        changeRequestId: "22222222-2222-2222-2222-222222222222",
        siteTitle: "Acme",
      },
    });
    assert.equal(parsed.name, "Seo.Published.V1");
  });
});
