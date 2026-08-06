"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { ShopAssistant } from "@/components/storefront/shop-assistant";
import type { StorefrontStoreSettings } from "@/lib/storefront-settings";
import { whatsappChatUrl } from "@/lib/storefront-settings";

/** Inline CTA that opens owner-led shop chat (MVP Beta). */
export function MessageSellerButton({
  tenantSlug,
  shopName,
  assistant,
  orderNumber,
  whatsapp,
  label = "Message seller",
  className = "",
}: {
  tenantSlug: string;
  shopName: string;
  assistant: StorefrontStoreSettings["shopAssistant"];
  orderNumber?: string;
  whatsapp?: StorefrontStoreSettings["whatsapp"];
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wa =
    whatsapp?.enabled && whatsapp.phone
      ? whatsappChatUrl(
          whatsapp.phone,
          orderNumber
            ? `${whatsapp.greeting || "Hi!"}\n\nOrder ${orderNumber}`
            : whatsapp.greeting
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
        }
      >
        <MessageCircle className="h-4 w-4" />
        {label}
      </button>
      {open ? (
        <ShopAssistant
          tenantSlug={tenantSlug}
          shopName={shopName}
          assistant={assistant}
          orderNumber={orderNumber}
          defaultOpen
          initialMode="seller"
          whatsappUrl={wa}
          hideLauncher
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
