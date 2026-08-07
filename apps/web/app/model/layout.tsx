import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Halo Queen Manila — Live demo storefront",
  description:
    "Flagship Guma model store: premium halo-halo & shakes with guest checkout, GCash/Maya instructions, and same-day Metro Manila delivery.",
  robots: { index: false, follow: true },
};

export default function ModelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
