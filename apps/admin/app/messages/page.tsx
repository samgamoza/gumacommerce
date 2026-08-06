"use client";

import { useEffect, useState } from "react";
import { PatternAdminShell } from "@/components/pattern-admin-shell";
import { MessagesInbox } from "@/components/messages-inbox";

export default function MessagesPage() {
  const [shop, setShop] = useState<{ slug?: string; name?: string }>({});

  useEffect(() => {
    fetch("/api/shop")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok) {
          setShop({
            slug: data.shop?.tenant?.slug,
            name: data.shop?.tenant?.name,
          });
        }
      })
      .catch(() => null);
  }, []);

  return (
    <PatternAdminShell
      title="Messages"
      description="Owner-led chat for products, checkout, GCash/Maya proof, and order revisions. Buyers message from your shop."
    >
      <MessagesInbox shopSlug={shop.slug} shopName={shop.name} />
    </PatternAdminShell>
  );
}
