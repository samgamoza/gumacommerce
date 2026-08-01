import { NextResponse } from "next/server";
import {
  listCustomersForTenant,
  getCustomerStatsForTenant,
  getCustomerForTenant,
} from "@guma-commerce/db";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const session = await requireTenantSession();
    const url = new URL(request.url);

    const id = url.searchParams.get("id");
    if (id) {
      const customer = await getCustomerForTenant(session.tenantId, id);
      if (!customer) {
        return NextResponse.json({ ok: false, error: "Customer not found." }, { status: 404 });
      }
      return NextResponse.json({ ok: true, customer });
    }

    const search = url.searchParams.get("search") ?? undefined;
    const sortParam = url.searchParams.get("sort");
    const sort = sortParam === "top" || sortParam === "orders" ? sortParam : "recent";

    const [customers, stats] = await Promise.all([
      listCustomersForTenant(session.tenantId, { search, sort, limit: 100 }),
      getCustomerStatsForTenant(session.tenantId),
    ]);
    return NextResponse.json({ ok: true, customers, stats });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error("[customers GET]", error);
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
