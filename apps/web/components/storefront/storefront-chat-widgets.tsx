"use client";

import type { DemoTenant } from "@/lib/demo-data";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import { whatsappChatUrl } from "@/lib/storefront-settings";
import { storefrontUrl } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

/** MVP Beta: owner-led shop chat + optional WhatsApp overflow. */
export function StorefrontChatWidgets({ tenant }: { tenant: DemoTenant }) {
  const assistant = tenant.storeSettings.shopAssistant;
  const whatsapp = tenant.storeSettings.whatsapp;
  const wa =
    whatsapp.enabled && whatsapp.phone
      ? whatsappChatUrl(
          whatsapp.phone,
          `${whatsapp.greeting}\n\n${storefrontUrl}/${tenant.slug}`
        )
      : null;

  return (
    <>
      <ShopAssistant
        tenantSlug={tenant.slug}
        shopName={tenant.name}
        assistant={assistant}
        whatsappUrl={wa}
      />
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition hover:scale-105 md:bottom-8"
          style={{ backgroundColor: "#25D366" }}
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      ) : null}
    </>
  );
}
