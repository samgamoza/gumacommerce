import { NextResponse } from "next/server";
import { isSlugAvailable, normalizeSlug, validateSlug } from "@guma-commerce/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = normalizeSlug(searchParams.get("slug") ?? "");

  const validation = validateSlug(slug);
  if (!validation.ok) {
    return NextResponse.json({ available: false, slug, reason: validation.reason });
  }

  const available = await isSlugAvailable(slug);
  return NextResponse.json({
    available,
    slug,
    reason: available ? null : "This shop URL is already taken.",
  });
}
