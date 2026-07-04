import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DemoTenant } from "@/lib/demo-data";

export function StoreHeader({ tenant }: { tenant: DemoTenant }) {
  return (
    <>
      <div
        className="h-28 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700"
        style={{
          backgroundImage: tenant.coverUrl
            ? `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5)), url(${tenant.coverUrl})`
            : undefined,
          backgroundSize: "cover",
        }}
      />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-lg px-4">
          <div className="-mt-10 flex items-end gap-3 pb-3">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-background text-3xl shadow-lg"
              style={{ backgroundColor: `${tenant.theme.primaryColor}20` }}
            >
              {tenant.logoEmoji}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="truncate font-display text-lg font-bold">{tenant.name}</h1>
              <p className="truncate text-xs text-muted-foreground">{tenant.tagline}</p>
            </div>
            <Link href={`/${tenant.slug}/checkout`}>
              <Button size="sm" className="shrink-0 gap-1.5 shadow-md">
                <ShoppingBag className="h-3.5 w-3.5" />
                Order
              </Button>
            </Link>
          </div>
          <div className="relative pb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search menu..."
              className="h-10 w-full rounded-xl border border-border/60 bg-muted/50 pl-9 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>
      </header>
    </>
  );
}
