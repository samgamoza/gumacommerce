import { getActiveLanding } from "@guma-commerce/db";
import { Frontend1Landing } from "@/components/marketing/Frontend1Landing";
import { Frontend2Landing } from "@/components/marketing/Frontend2Landing";

// Which landing the public sees is controlled by the super-admin "active_landing"
// platform setting (Platform admin → Frontends). Read per request so the toggle
// takes effect immediately.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const active = await getActiveLanding();
  return active === "frontend2" ? <Frontend2Landing /> : <Frontend1Landing />;
}
