import { NextResponse } from "next/server";
import { z } from "zod";
import { createLalamoveClient } from "@guma-commerce/services";

const quoteSchema = z.object({
  pickup: z.object({
    address: z.string(),
    lat: z.string(),
    lng: z.string(),
  }),
  dropoff: z.object({
    address: z.string(),
    lat: z.string(),
    lng: z.string(),
  }),
});

export async function POST(request: Request) {
  try {
    const body = quoteSchema.parse(await request.json());
    const lalamove = createLalamoveClient();

    const quote = await lalamove.getQuotation({
      pickup: {
        address: body.pickup.address,
        coordinates: { lat: body.pickup.lat, lng: body.pickup.lng },
      },
      dropoff: {
        address: body.dropoff.address,
        coordinates: { lat: body.dropoff.lat, lng: body.dropoff.lng },
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Delivery quote error:", error);
    return NextResponse.json({ error: "Quote failed" }, { status: 400 });
  }
}
