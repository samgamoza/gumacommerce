/**
 * Address → coordinates via OpenStreetMap Nominatim (free, no key).
 * Best-effort: returns null on any failure so callers can fall back to
 * flat-rate delivery fees.
 */
export interface GeocodeResult {
  lat: string;
  lng: string;
  displayName: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const query = address.trim();
  if (query.length < 8) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "ph");
    url.searchParams.set("q", query);

    const res = await fetch(url, {
      headers: {
        // Nominatim usage policy requires an identifying user agent.
        "User-Agent": "guma-commerce/1.0 (delivery-quotes)",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const results = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    const first = results[0];
    if (!first) return null;

    return { lat: first.lat, lng: first.lon, displayName: first.display_name };
  } catch {
    return null;
  }
}
