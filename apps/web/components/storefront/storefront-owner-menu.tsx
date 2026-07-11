"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Tag,
  Truck,
  User,
  Wallet,
} from "lucide-react";
import {
  OWNER_BILLING_LINKS,
  OWNER_SETTINGS_LINKS,
  OWNER_SHOP_LINKS,
  OWNER_SUPPORT_LINKS,
} from "@/lib/storefront-owner-nav";
import { adminUrl, storefrontUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

const SETTINGS_ICONS: Record<string, React.ReactNode> = {
  Shop: <Store className="h-4 w-4" />,
  "Delivery & Shipping": <Truck className="h-4 w-4" />,
  Notifications: <Settings className="h-4 w-4" />,
  "Password & security": <User className="h-4 w-4" />,
  "KYC verification": <User className="h-4 w-4" />,
  "WhatsApp Agent": <Settings className="h-4 w-4" />,
  Tracking: <Settings className="h-4 w-4" />,
};

function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setCoarse(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return coarse;
}

export function StorefrontOwnerMenu({
  tenantSlug,
  variant = "v0",
}: {
  tenantSlug: string;
  variant?: "v0" | "classic";
}) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const isCoarsePointer = useCoarsePointer();

  const isV0 = variant === "v0";

  function openMenu() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  }

  function scheduleClose() {
    if (isCoarsePointer) return;
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 120);
  }

  function toggleMenu() {
    setOpen((value) => !value);
  }

  useEffect(() => {
    if (!open) setSettingsOpen(false);
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const triggerClass = cn(
    "flex size-10 items-center justify-center rounded-full border transition",
    isV0
      ? open
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border text-foreground hover:bg-muted"
      : open
        ? "border-neutral-900 bg-neutral-900 text-white"
        : "border-neutral-200 hover:bg-neutral-50"
  );

  const panelClass = cn(
    "w-72 overflow-hidden py-2 shadow-xl",
    isV0
      ? "rounded-2xl border border-border bg-card"
      : "rounded-2xl border border-neutral-200 bg-white"
  );

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={toggleMenu}
        className={triggerClass}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <User className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 pt-2"
          role="menu"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          <div className={panelClass}>
            <MenuLink
              href={`${storefrontUrl}/${tenantSlug}`}
              icon={<Store className="h-4 w-4" />}
              highlight
              variant={variant}
            >
              Go to my shop
            </MenuLink>

            <MenuLink
              href={`${adminUrl}${OWNER_SHOP_LINKS[0].href}`}
              icon={<LayoutDashboard className="h-4 w-4" />}
              variant={variant}
            >
              Dashboard
            </MenuLink>

            {OWNER_SHOP_LINKS.slice(1).map((item) => (
              <MenuLink
                key={item.href}
                href={`${adminUrl}${item.href}`}
                icon={
                  item.label === "Products" ? (
                    <Package className="h-4 w-4" />
                  ) : item.label === "Categories" ? (
                    <Tag className="h-4 w-4" />
                  ) : item.label === "Orders" ? (
                    <ShoppingBag className="h-4 w-4" />
                  ) : (
                    <Store className="h-4 w-4" />
                  )
                }
                variant={variant}
              >
                {item.label}
              </MenuLink>
            ))}

            <Divider variant={variant} />

            <p
              className={cn(
                "px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider",
                isV0 ? "text-muted-foreground" : "text-neutral-400"
              )}
            >
              Billing
            </p>
            {OWNER_BILLING_LINKS.map((item) => (
              <MenuLink
                key={item.href + item.label}
                href={`${adminUrl}${item.href}`}
                icon={
                  item.label.includes("Wallet") || item.label.includes("funds") ? (
                    <Wallet className="h-4 w-4" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )
                }
                variant={variant}
              >
                {item.label}
              </MenuLink>
            ))}

            <Divider variant={variant} />

            <button
              type="button"
              role="menuitem"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((value) => !value)}
              className={cn(
                "flex w-full items-center justify-between px-4 py-2.5 text-sm transition",
                isV0
                  ? "text-foreground hover:bg-muted"
                  : "text-neutral-700 hover:bg-neutral-50"
              )}
            >
              <span className="flex items-center gap-3">
                <span className={isV0 ? "text-muted-foreground" : "text-neutral-400"}>
                  <Settings className="h-4 w-4" />
                </span>
                Settings
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition",
                  isV0 ? "text-muted-foreground" : "text-neutral-400",
                  settingsOpen && "rotate-180"
                )}
              />
            </button>

            {settingsOpen && (
              <div
                className={cn(
                  "py-1",
                  isV0 ? "border-t border-border bg-muted/40" : "border-t border-neutral-100 bg-neutral-50/80"
                )}
              >
                {OWNER_SETTINGS_LINKS.map((item) => (
                  <MenuLink
                    key={item.href}
                    href={`${adminUrl}${item.href}`}
                    icon={SETTINGS_ICONS[item.label] ?? <Settings className="h-4 w-4" />}
                    variant={variant}
                    nested
                  >
                    {item.label}
                  </MenuLink>
                ))}
              </div>
            )}

            <Divider variant={variant} />

            {OWNER_SUPPORT_LINKS.map((item) => (
              <MenuLink
                key={item.href}
                href={`${adminUrl}${item.href}`}
                icon={<HelpCircle className="h-4 w-4" />}
                variant={variant}
              >
                {item.label}
              </MenuLink>
            ))}

            <Divider variant={variant} />

            <MenuLink
              href={`${adminUrl}/login`}
              icon={<LogOut className="h-4 w-4" />}
              variant={variant}
            >
              Log out
            </MenuLink>
          </div>
        </div>
      )}
    </div>
  );
}

function Divider({ variant }: { variant: "v0" | "classic" }) {
  return (
    <div
      className={cn("my-1 border-t", variant === "v0" ? "border-border" : "border-neutral-100")}
    />
  );
}

function MenuLink({
  href,
  icon,
  children,
  highlight,
  nested,
  variant,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  highlight?: boolean;
  nested?: boolean;
  variant: "v0" | "classic";
}) {
  const isV0 = variant === "v0";

  return (
    <Link
      href={href}
      role="menuitem"
      className={cn(
        "flex items-center gap-3 py-2.5 text-sm transition",
        nested ? "pl-11 pr-4" : "px-4",
        highlight
          ? isV0
            ? "bg-primary/10 font-medium text-primary hover:bg-primary/15"
            : "bg-emerald-50 font-medium text-emerald-700 hover:bg-emerald-100"
          : isV0
            ? "text-foreground hover:bg-muted"
            : "text-neutral-700 hover:bg-neutral-50",
        nested && isV0 && "text-muted-foreground hover:text-foreground"
      )}
    >
      <span
        className={cn(
          highlight
            ? isV0
              ? "text-primary"
              : "text-emerald-600"
            : isV0
              ? "text-muted-foreground"
              : "text-neutral-400"
        )}
      >
        {icon}
      </span>
      {children}
    </Link>
  );
}
