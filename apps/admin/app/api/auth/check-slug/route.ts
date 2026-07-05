import { NextResponse } from "next/server";
import { isSlugAvailable, normalizeSlug, validateSlug } from "@guma-commerce/auth";
import { clientIpFrom, rateLimit } from "@guma-commerce/services";

export async function GET(request: Request) {
  const limited = await rateLimit(`check-slug:${clientIpFrom(request)}`, {
    limit: 30,
    windowSeconds: 60,
  });
  if (!limited.allowed) {
    return NextResponse.json(
      { available: false, slug: "", reason: "Too many checks — slow down a little." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

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
