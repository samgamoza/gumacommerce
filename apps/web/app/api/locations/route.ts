import { NextRequest, NextResponse } from "next/server";
import { searchPhLocations, type PhLocationKind } from "@guma-commerce/db";

const KINDS = new Set<PhLocationKind>(["province", "city", "barangay"]);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const kind = searchParams.get("type") as PhLocationKind | null;
  if (!kind || !KINDS.has(kind)) {
    return NextResponse.json(
      { error: "Query param type must be province, city, or barangay." },
      { status: 400 }
    );
  }

  const q = searchParams.get("q")?.trim() ?? "";
  const provinceCode = searchParams.get("provinceCode")?.trim() || undefined;
  const cityCode = searchParams.get("cityCode")?.trim() || undefined;

  if (kind === "city" && !provinceCode) {
    return NextResponse.json(
      { error: "provinceCode is required when type=city." },
      { status: 400 }
    );
  }
  if (kind === "barangay" && (!provinceCode || !cityCode)) {
    return NextResponse.json(
      { error: "provinceCode and cityCode are required when type=barangay." },
      { status: 400 }
    );
  }

  try {
    const results = await searchPhLocations({
      kind,
      q,
      provinceCode,
      cityCode,
      limit: 25,
    });
    return NextResponse.json({ results });
  } catch (error) {
    console.error("[locations]", error);
    return NextResponse.json(
      { error: "Location lookup unavailable. Type your address manually." },
      { status: 503 }
    );
  }
}
