import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  allowFreePostPublishTemplateSwitch,
  canChangeStorefrontTemplateAfterPublish,
} from "./template-switch";

const KEYS = [
  "GUMA_SOFT_LAUNCH",
  "GUMA_FREE_TEMPLATE_SWITCH",
  "GUMA_TEMPLATE_SWITCH_REQUIRES_UPGRADE",
  "VERCEL_ENV",
  "NODE_ENV",
] as const;

const saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {};

describe("template switch entitlement", () => {
  beforeEach(() => {
    for (const key of KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of KEYS) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("allows free switch in development", () => {
    process.env.NODE_ENV = "development";
    assert.equal(allowFreePostPublishTemplateSwitch(), true);
    assert.equal(canChangeStorefrontTemplateAfterPublish("free").allowed, true);
  });

  it("allows free switch when soft launch is on in production", () => {
    process.env.NODE_ENV = "production";
    process.env.GUMA_SOFT_LAUNCH = "true";
    assert.equal(allowFreePostPublishTemplateSwitch(), true);
    assert.equal(canChangeStorefrontTemplateAfterPublish("free").allowed, true);
    assert.equal(canChangeStorefrontTemplateAfterPublish("free").freeDuringSoftLaunch, true);
  });

  it("requires growth in hard production", () => {
    process.env.NODE_ENV = "production";
    assert.equal(allowFreePostPublishTemplateSwitch(), false);
    assert.equal(canChangeStorefrontTemplateAfterPublish("free").allowed, false);
    assert.equal(canChangeStorefrontTemplateAfterPublish("growth").allowed, true);
    assert.equal(canChangeStorefrontTemplateAfterPublish("pro").allowed, true);
  });

  it("honors force upgrade even during soft launch", () => {
    process.env.GUMA_SOFT_LAUNCH = "true";
    process.env.GUMA_TEMPLATE_SWITCH_REQUIRES_UPGRADE = "true";
    assert.equal(allowFreePostPublishTemplateSwitch(), false);
    assert.equal(canChangeStorefrontTemplateAfterPublish("free").allowed, false);
  });

  it("honors ops SoftLaunchOverrides over env", () => {
    process.env.NODE_ENV = "production";
    process.env.GUMA_SOFT_LAUNCH = "false";
    assert.equal(
      allowFreePostPublishTemplateSwitch({ softLaunch: true }),
      true
    );
    assert.equal(
      allowFreePostPublishTemplateSwitch({
        softLaunch: true,
        requiresUpgrade: true,
      }),
      false
    );
  });
});
