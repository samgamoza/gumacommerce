import { NextResponse } from "next/server";
import { z } from "zod";
import { createPlanPayment, PLAN_PRICES_PHP } from "@guma-commerce/db";
import {
  createLogger,
  createPayMongoClient,
  type PayMongoMethod,
} from "@guma-commerce/services";
import { ApiAuthError, requireTenantSession } from "@/lib/api-auth";

const log = createLogger("billing:upgrade");

const upgradeSchema = z.object({
  plan: z.enum(["growth", "pro"]),
  method: z.enum(["gcash", "paymaya", "card"]).default("gcash"),
});

/**
 * Starts a PayMongo payment for a plan upgrade. The PayMongo webhook applies
 * the plan once the payment lands, so nothing is granted here.
 */
export async function POST(request: Request) {
  try {
    const session = await requireTenantSession();
    const body = upgradeSchema.parse(await request.json());

    const amountPhp = PLAN_PRICES_PHP[body.plan];
    if (!amountPhp) {
      return NextResponse.json({ ok: false, error: "Unknown plan." }, { status: 400 });
    }

    const paymongo = createPayMongoClient();
    const intent = await paymongo.createPaymentIntent({
      amountCentavos: amountPhp * 100,
      description: `Guma One ${body.plan} plan (30 days) — ${session.tenantName}`,
      methods: [body.method as PayMongoMethod],
      metadata: {
        purpose: "plan_upgrade",
        tenant_id: session.tenantId,
        plan: body.plan,
      },
    });

    await createPlanPayment({
      tenantId: session.tenantId,
      plan: body.plan,
      amount: amountPhp.toFixed(2),
      gatewayIntentId: intent.id,
    });

    const attached = await paymongo.attachPaymentMethod(
      intent.id,
      body.method as PayMongoMethod,
      intent.clientKey
    );

    return NextResponse.json({
      ok: true,
      redirectUrl: attached.redirectUrl ?? null,
      status: attached.status,
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
    }
    log.error("Plan upgrade failed", error);
    return NextResponse.json(
      { ok: false, error: "Could not start the payment. Try again shortly." },
      { status: 502 }
    );
  }
}
