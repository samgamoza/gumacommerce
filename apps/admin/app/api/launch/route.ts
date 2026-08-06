import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getLaunchTenantState,
  updateStoreDna,
  saveThemeDraft,
} from "@guma-commerce/db";
import {
  brandGuardHasErrors,
  buildStoreDNA,
  deriveBrandKit,
  isShopTemplateId,
  matchStorePattern,
  recommendTemplates,
  listLibraryMatchesForDna,
  resolveShopTheme,
  validateBrandGuardPersonalize,
} from "@guma-commerce/storefront-themes";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

export async function GET() {
  try {
    const session = await requireTenantSession();
    const state = await getLaunchTenantState(session.tenantId);
    if (!state) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    const dna =
      state.storeDnaJson ??
      buildStoreDNA({
        businessName: state.name,
        category: state.category,
        vibe: state.themeDraftJson?.vibe ?? state.themeJson?.vibe,
        launchStep: "dna",
      });

    const recommendations = recommendTemplates(dna, {
      plan: state.subscriptionPlan,
      limit: 3,
    });
    const libraryMatches = listLibraryMatchesForDna(dna, 6);

    const draft = state.themeDraftJson ?? state.themeJson;
    const theme = resolveShopTheme(draft, state.name);
    const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3010";
    const published = Boolean(state.themePublishedJson?.templateId);
    const launchDone = dna.launchStep === "done" || published;

    return NextResponse.json({
      ok: true,
      state,
      dna,
      recommendations,
      libraryMatches,
      theme,
      draft,
      published,
      launchDone,
      libraryStats: {
        liveInstallable: recommendations.length,
        note: "Top 3 are scored from the live storefront library (HTML ports + Guma themes), boosted by Free Bundle 2023 category matches.",
      },
      urls: {
        storefront: `${storefrontUrl}/${state.slug}`,
        preview: `${storefrontUrl}/${state.slug}?preview=1`,
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[launch GET]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}

const dnaSchema = z.object({
  action: z.literal("save_dna"),
  audience: z.string().max(120).optional(),
  productCountHint: z.enum(["none", "1-10", "11-50", "50+"]).optional(),
  sellingChannels: z.array(z.enum(["social", "marketplace", "in_person"])).optional(),
  goals: z.array(z.enum(["launch_fast", "brand_look", "conversion", "live_selling"])).optional(),
  vibe: z.string().max(32).optional(),
  category: z.string().max(100).optional(),
});

const selectSchema = z.object({
  action: z.literal("select_template"),
  templateId: z.string().min(1).max(64),
});

const personalizeSchema = z.object({
  action: z.literal("personalize"),
  tagline: z.string().max(160).optional(),
  promoTitle: z.string().max(120).optional(),
  promoSubtitle: z.string().max(160).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  paletteId: z.string().max(64).optional(),
});

const publishSchema = z.object({
  action: z.literal("publish"),
});

const bodySchema = z.discriminatedUnion("action", [
  dnaSchema,
  selectSchema,
  personalizeSchema,
  publishSchema,
]);

export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = bodySchema.parse(await request.json());
    const state = await getLaunchTenantState(session.tenantId);
    if (!state) {
      return NextResponse.json({ ok: false, error: "Shop not found." }, { status: 404 });
    }

    if (body.action === "save_dna") {
      const current = state.storeDnaJson;
      const dna = buildStoreDNA({
        businessName: state.name,
        category: body.category ?? current?.category ?? state.category,
        vibe: body.vibe ?? current?.vibe ?? "fresh",
        audience: body.audience ?? current?.audience,
        productCountHint: body.productCountHint ?? current?.productCountHint,
        sellingChannels: body.sellingChannels ?? current?.sellingChannels,
        goals: body.goals ?? current?.goals,
        locale: current?.locale ?? "taglish",
        launchStep: "templates",
        selectedTemplateId: current?.selectedTemplateId,
      });
      const updated = await updateStoreDna(session.tenantId, dna);
      const recommendations = recommendTemplates(dna, {
        plan: state.subscriptionPlan,
        limit: 3,
      });
      const libraryMatches = listLibraryMatchesForDna(dna, 6);
      return NextResponse.json({ ok: true, dna, recommendations, libraryMatches, state: updated });
    }

    if (body.action === "select_template") {
      if (!isShopTemplateId(body.templateId)) {
        return NextResponse.json({ ok: false, error: "Unknown template." }, { status: 400 });
      }

      const dnaBase =
        state.storeDnaJson ??
        buildStoreDNA({
          businessName: state.name,
          category: state.category,
          vibe: "fresh",
        });

      const brandKit = deriveBrandKit({
        shopName: state.name,
        slug: state.slug,
        category: dnaBase.category,
        vibe: String(dnaBase.vibe),
        subscriptionPlan: state.subscriptionPlan ?? "free",
      });

      const patternId = matchStorePattern({
        templateId: body.templateId,
        category: dnaBase.category,
        vibe: String(dnaBase.vibe),
      });

      const draft = {
        ...brandKit,
        templateId: body.templateId,
        patternId,
        vibe: String(dnaBase.vibe),
      };

      const dna = {
        ...dnaBase,
        selectedTemplateId: body.templateId,
        launchStep: "personalize" as const,
      };

      await updateStoreDna(session.tenantId, dna);
      const updated = await saveThemeDraft(session.tenantId, draft);
      const theme = resolveShopTheme(draft, state.name);

      return NextResponse.json({ ok: true, draft, theme, dna, state: updated });
    }

    if (body.action === "personalize") {
      const current = state.themeDraftJson ?? state.themeJson ?? {};
      if (!current.templateId) {
        return NextResponse.json(
          { ok: false, error: "Select a template first." },
          { status: 400 }
        );
      }

      const brandGuardIssues = validateBrandGuardPersonalize({
        tagline: body.tagline,
        promoTitle: body.promoTitle,
        promoSubtitle: body.promoSubtitle,
        paletteId: body.paletteId,
        primaryColor: body.primaryColor,
        accentColor: body.accentColor,
      });
      if (brandGuardHasErrors(brandGuardIssues)) {
        return NextResponse.json(
          {
            ok: false,
            error: brandGuardIssues.find((i) => i.severity === "error")?.message ?? "Brand Guard rejected this copy.",
            code: "BRAND_GUARD",
            brandGuardIssues,
          },
          { status: 400 }
        );
      }

      const draft = {
        ...current,
        ...(body.tagline !== undefined ? { tagline: body.tagline } : {}),
        ...(body.promoTitle !== undefined ? { promoTitle: body.promoTitle } : {}),
        ...(body.promoSubtitle !== undefined ? { promoSubtitle: body.promoSubtitle } : {}),
        ...(body.primaryColor !== undefined ? { primaryColor: body.primaryColor } : {}),
        ...(body.accentColor !== undefined ? { accentColor: body.accentColor } : {}),
        ...(body.paletteId !== undefined ? { paletteId: body.paletteId } : {}),
      };

      if (state.storeDnaJson) {
        await updateStoreDna(session.tenantId, {
          ...state.storeDnaJson,
          launchStep: "preview",
        });
      }

      const updated = await saveThemeDraft(session.tenantId, draft);
      const theme = resolveShopTheme(draft, state.name);
      return NextResponse.json({
        ok: true,
        draft,
        theme,
        state: updated,
        brandGuardIssues,
      });
    }

    if (body.action === "publish") {
      const { resolveApprovalLevel } = await import("@guma-commerce/ai");
      const { publishStorefrontWithApproval } = await import("@guma-commerce/db");
      const approvalLevel = resolveApprovalLevel(
        "ai.publish.store",
        state.subscriptionPlan
      );

      const result = await publishStorefrontWithApproval({
        tenantId: session.tenantId,
        actorUserId: session.userId,
        actorEmail: session.email ?? null,
        approvalLevel,
        scope: "ai.publish.store",
      });

      const { ensureEventsWired } = await import("@/lib/events-bootstrap");
      ensureEventsWired();
      const { emitDomainEvent, EVENT_NAMES } = await import("@guma-commerce/events");
      await emitDomainEvent({
        name: EVENT_NAMES.THEME_CHANGE_APPROVED,
        data: {
          tenantId: session.tenantId,
          changeRequestId: result.request.id,
          scope: "ai.publish.store",
        },
        idempotencyKey: `Theme.ChangeApproved.V1:${result.request.id}`,
      });
      await emitDomainEvent({
        name: EVENT_NAMES.THEME_PUBLISHED,
        data: {
          tenantId: session.tenantId,
          changeRequestId: result.request.id,
          customizationVersion: result.customizationVersion,
          templateId: result.templateId,
        },
        idempotencyKey: `Theme.Published.V1:${session.tenantId}:${result.customizationVersion}`,
      });
      await emitDomainEvent({
        name: EVENT_NAMES.STORE_PUBLISHED,
        data: {
          tenantId: session.tenantId,
          slug: result.slug,
          templateId: result.templateId,
          customizationVersion: result.customizationVersion,
        },
        idempotencyKey: `Store.Published.V1:${session.tenantId}:${result.customizationVersion}`,
      });

      const updated = await getLaunchTenantState(session.tenantId);
      return NextResponse.json({
        ok: true,
        published: true,
        changeRequestId: result.request.id,
        state: updated,
        message: "Storefront published with approval audit. Add a product, then activate your shop.",
      });
    }

    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: error.errors[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }
    console.error("[launch POST]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Something went wrong." },
      { status: 500 }
    );
  }
}
