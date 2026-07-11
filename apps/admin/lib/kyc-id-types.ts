/** Philippine ID types accepted for seller KYC (BSP/AMLC-style tiers). */

export type PhIdTier = "primary" | "secondary";

export interface PhIdType {
  id: string;
  label: string;
  tier: PhIdTier;
  hint?: string;
}

export const PH_PRIMARY_IDS: PhIdType[] = [
  { id: "passport", label: "Passport", tier: "primary" },
  { id: "drivers_license", label: "Driver's License (LTO)", tier: "primary" },
  { id: "umid", label: "UMID", tier: "primary" },
  { id: "national_id", label: "National ID (PhilSys)", tier: "primary" },
  { id: "prc_id", label: "PRC ID", tier: "primary" },
  { id: "postal_id", label: "Postal ID", tier: "primary" },
];

export const PH_SECONDARY_IDS: PhIdType[] = [
  { id: "sss_id", label: "SSS ID / UMID (SSS)", tier: "secondary" },
  { id: "gsis_id", label: "GSIS ID", tier: "secondary" },
  { id: "philhealth_id", label: "PhilHealth ID", tier: "secondary" },
  { id: "voters_id", label: "Voter's ID", tier: "secondary" },
  { id: "tin_id", label: "TIN ID", tier: "secondary" },
  { id: "senior_citizen_id", label: "Senior Citizen ID", tier: "secondary" },
  { id: "pwd_id", label: "PWD ID", tier: "secondary" },
  { id: "barangay_id", label: "Barangay ID / Certification", tier: "secondary" },
  { id: "company_id", label: "Company ID", tier: "secondary", hint: "Must show full name & photo" },
  { id: "school_id", label: "School ID", tier: "secondary", hint: "Must show full name & photo" },
  { id: "police_clearance", label: "Police Clearance", tier: "secondary" },
  { id: "nbi_clearance", label: "NBI Clearance", tier: "secondary" },
];

export const PH_ID_TYPES = [...PH_PRIMARY_IDS, ...PH_SECONDARY_IDS];

export function getPhIdType(id: string): PhIdType | undefined {
  return PH_ID_TYPES.find((item) => item.id === id);
}

export function isPrimaryId(id: string): boolean {
  return PH_PRIMARY_IDS.some((item) => item.id === id);
}

export function isSecondaryId(id: string): boolean {
  return PH_SECONDARY_IDS.some((item) => item.id === id);
}
