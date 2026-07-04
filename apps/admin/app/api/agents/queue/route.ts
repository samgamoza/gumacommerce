import { NextResponse } from "next/server";
import { z } from "zod";
import { updateContentQueueStatus } from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "posted", "skipped"]),
});

export async function PATCH(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = patchSchema.parse(await request.json());
    const item = await updateContentQueueStatus(session.tenantId, body.id, body.status);
    if (!item) {
      return NextResponse.json({ ok: false, error: "Queue item not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ ok: false, error: "Could not update queue." }, { status: 400 });
  }
}
