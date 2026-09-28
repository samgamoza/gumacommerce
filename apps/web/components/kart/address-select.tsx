"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  loadBarangays,
  loadPhIndex,
  type KartAddress,
  type PhAddressIndex,
} from "@/lib/kart/ph-address";
import { Field } from "./ui";

/*
  Strict chained dropdowns: Region → Province → City/Municipality → Barangay (spec §C.2).
  No free-text city, no zip-code gate. Each level resets the ones below it.
*/
export function AddressSelect({
  value,
  onChange,
  errors,
}: {
  value: KartAddress;
  onChange: (next: KartAddress) => void;
  errors?: Partial<Record<keyof KartAddress, string>>;
}) {
  const [index, setIndex] = useState<PhAddressIndex | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [brgys, setBrgys] = useState<Record<string, string[]> | null>(null);
  const [brgyLoading, setBrgyLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    loadPhIndex()
      .then((i) => alive && setIndex(i))
      .catch(() => alive && setIndexError("Address list unavailable — check your signal and retry."));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!value.provinceCode) {
      setBrgys(null);
      return;
    }
    let alive = true;
    setBrgyLoading(true);
    loadBarangays(value.provinceCode)
      .then((b) => alive && setBrgys(b))
      .catch(() => alive && setBrgys({}))
      .finally(() => alive && setBrgyLoading(false));
    return () => {
      alive = false;
    };
  }, [value.provinceCode]);

  const provinces = useMemo(
    () => (index ? index.provinces.filter((p) => p.region === value.regionCode) : []),
    [index, value.regionCode]
  );
  const cities = useMemo(
    () => (index ? index.cities.filter((c) => c.province === value.provinceCode) : []),
    [index, value.provinceCode]
  );
  const barangays = useMemo(() => (brgys && value.cityCode ? brgys[value.cityCode] ?? [] : []), [brgys, value.cityCode]);

  const set = (patch: Partial<KartAddress>) => onChange({ ...value, ...patch });

  return (
    <div className="grid gap-4">
      <Field label="Region" error={errors?.regionCode ?? indexError}>
        <select
          className="k-input"
          value={value.regionCode}
          disabled={!index}
          aria-invalid={Boolean(errors?.regionCode)}
          onChange={(e) => {
            const r = index?.regions.find((x) => x.code === e.target.value);
            set({ regionCode: r?.code ?? "", region: r?.name ?? "", provinceCode: "", province: "", cityCode: "", city: "", barangay: "" });
          }}
        >
          <option value="">{index ? "Select region" : "Loading regions…"}</option>
          {index?.regions.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Province" error={errors?.provinceCode}>
        <select
          className="k-input"
          value={value.provinceCode}
          disabled={!value.regionCode}
          aria-invalid={Boolean(errors?.provinceCode)}
          onChange={(e) => {
            const p = provinces.find((x) => x.code === e.target.value);
            set({ provinceCode: p?.code ?? "", province: p?.name ?? "", cityCode: "", city: "", barangay: "" });
          }}
        >
          <option value="">{value.regionCode ? "Select province" : "Choose a region first"}</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="City / Municipality" error={errors?.cityCode}>
        <select
          className="k-input"
          value={value.cityCode}
          disabled={!value.provinceCode}
          aria-invalid={Boolean(errors?.cityCode)}
          onChange={(e) => {
            const c = cities.find((x) => x.code === e.target.value);
            set({ cityCode: c?.code ?? "", city: c?.name ?? "", barangay: "" });
          }}
        >
          <option value="">{value.provinceCode ? "Select city or municipality" : "Choose a province first"}</option>
          {cities.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Barangay" error={errors?.barangay}>
        <div className="relative">
          <select
            className="k-input"
            value={value.barangay}
            disabled={!value.cityCode || brgyLoading}
            aria-invalid={Boolean(errors?.barangay)}
            onChange={(e) => set({ barangay: e.target.value })}
          >
            <option value="">
              {!value.cityCode ? "Choose a city first" : brgyLoading ? "Loading barangays…" : "Select barangay"}
            </option>
            {barangays.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {brgyLoading && <Loader2 className="absolute right-9 top-3.5 h-4 w-4 animate-spin text-slate-400" />}
        </div>
      </Field>

      <Field label="House no. / Street / Building" error={errors?.line1} hint="Unit, block & lot, building name — what the rider needs at the gate.">
        <input
          className="k-input"
          value={value.line1}
          aria-invalid={Boolean(errors?.line1)}
          placeholder="e.g. Blk 4 Lot 12, Maligaya St."
          autoComplete="address-line1"
          onChange={(e) => set({ line1: e.target.value })}
        />
      </Field>

      <Field label="Landmark (optional)">
        <input
          className="k-input"
          value={value.landmark}
          placeholder="e.g. across the barangay hall"
          onChange={(e) => set({ landmark: e.target.value })}
        />
      </Field>
    </div>
  );
}
