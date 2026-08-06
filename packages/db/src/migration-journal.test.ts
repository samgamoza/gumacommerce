import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const here = path.dirname(fileURLToPath(import.meta.url));
const journalPath = path.join(here, "../drizzle/meta/_journal.json");

describe("drizzle migration journal", () => {
  it("includes support helpdesk migration 0013", () => {
    const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
      entries: Array<{ tag: string }>;
    };
    const tags = journal.entries.map((e) => e.tag);
    assert.ok(
      tags.includes("0013_support_helpdesk"),
      `expected 0013_support_helpdesk in journal, got: ${tags.join(", ")}`
    );
  });

  it("includes template intelligence migration 0014", () => {
    const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
      entries: Array<{ tag: string }>;
    };
    const tags = journal.entries.map((e) => e.tag);
    assert.ok(
      tags.includes("0014_template_intelligence"),
      `expected 0014_template_intelligence in journal, got: ${tags.join(", ")}`
    );
  });
});
