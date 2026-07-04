import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createCategoryForTenant,
  deleteCategoryForTenant,
  listCategoriesForTenant,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().max(64).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export async function GET() {
  try {
    const session = await requireTenantSession();
    const categories = await listCategoriesForTenant(session.tenantId);
    return NextResponse.json({ ok: true, categories });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[categories GET]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = createSchema.parse(await request.json());
    const category = await createCategoryForTenant(session.tenantId, body);
    return NextResponse.json({ ok: true, category });
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
    console.error("[categories POST]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireTenantSession();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "Category id required." }, { status: 400 });
    }

    const deleted = await deleteCategoryForTenant(session.tenantId, id);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Category not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[categories DELETE]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
