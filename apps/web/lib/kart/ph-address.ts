/**
 * Philippine address data (PSGC): Region → Province → City/Municipality → Barangay.
 *
 * Static JSON under public/ph-address/ (shared with Kuya Eddie), fetched lazily:
 *   index.json               regions, provinces, cities (~115 KB, once)
 *   barangays/<prov>.json    barangays for one province keyed by city code
 *
 * No DB round-trip: the checkout webview must work on a weak mobile signal.
 */

export interface PhRegion { code: string; name: string }
export interface PhProvince { code: string; region: string; name: string }
export interface PhCity { code: string; province: string; name: string; city: boolean }

export interface PhAddressIndex {
  regions: PhRegion[];
  provinces: PhProvince[];
  cities: PhCity[];
}

export interface KartAddress {
  line1: string;
  regionCode: string;
  region: string;
  provinceCode: string;
  province: string;
  cityCode: string;
  city: string;
  barangay: string;
  landmark: string;
}

export const EMPTY_ADDRESS: KartAddress = {
  line1: "",
  regionCode: "",
  region: "",
  provinceCode: "",
  province: "",
  cityCode: "",
  city: "",
  barangay: "",
  landmark: "",
};

const BASE = "/ph-address";
let indexPromise: Promise<PhAddressIndex> | null = null;
const brgyCache = new Map<string, Promise<Record<string, string[]>>>();

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json() as Promise<T>;
}

export function loadPhIndex(): Promise<PhAddressIndex> {
  if (!indexPromise) {
    indexPromise = getJson<PhAddressIndex>(`${BASE}/index.json`).catch((e) => {
      indexPromise = null;
      throw e;
    });
  }
  return indexPromise;
}

export function loadBarangays(provinceCode: string): Promise<Record<string, string[]>> {
  let p = brgyCache.get(provinceCode);
  if (!p) {
    p = getJson<Record<string, string[]>>(`${BASE}/barangays/${provinceCode}.json`).catch((e) => {
      brgyCache.delete(provinceCode);
      throw e;
    });
    brgyCache.set(provinceCode, p);
  }
  return p;
}

export function isAddressComplete(a: KartAddress): boolean {
  return Boolean(a.line1.trim() && a.regionCode && a.provinceCode && a.cityCode && a.barangay);
}

export function formatAddress(a: KartAddress): string {
  return [a.line1, a.barangay && `Brgy. ${a.barangay}`, a.city, a.province]
    .filter(Boolean)
    .join(", ");
}
