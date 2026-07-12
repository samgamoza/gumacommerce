import { redirect } from "next/navigation";

/**
 * Legacy Shop Builder archived — GUMA Launch is the storefront setup path.
 * Appearance tweaks after publish live under Launch → personalize / publish.
 */
export default function ShopBuilderArchiveRedirect() {
  redirect("/launch");
}
