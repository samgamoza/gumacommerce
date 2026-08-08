import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fallbackTemplateSkins, parseAiSkinBatch } from "./template-skins";

describe("template-skins", () => {
  it("parses AI JSON batch and normalizes unknown palette", () => {
    const skins = parseAiSkinBatch(
      JSON.stringify({
        skins: [
          {
            label: " Warm Amber ",
            paletteId: "NOT-A-REAL-PALETTE",
            displayFont: "bricolage",
            heroLayout: "split",
            notes: "test",
          },
          {
            label: "Cool Indigo",
            paletteId: "midnight-neon",
            menuColumns: "2",
          },
        ],
      }),
      2
    );
    assert.equal(skins.length, 2);
    assert.equal(skins[0]!.label, "Warm Amber");
    assert.equal(skins[0]!.paletteId, "manila-sunset");
    assert.equal(skins[1]!.paletteId, "midnight-neon");
  });

  it("fallback skins are distinct palettes", () => {
    const skins = fallbackTemplateSkins({
      categoryLabel: "Pest Control",
      liveTemplateId: "specialty",
      count: 3,
    });
    const ids = new Set(skins.map((s) => s.paletteId));
    assert.equal(ids.size, 3);
  });
});
