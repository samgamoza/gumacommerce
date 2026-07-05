import { Sparkles } from "lucide-react"

const platforms = ["Facebook", "Instagram", "TikTok", "Messenger", "Website"]

const columns = [
  { title: "Shop", links: ["Featured", "Today's Deals", "New Arrivals", "Live Selling"] },
  { title: "Support", links: ["Track Order", "Returns", "Messenger Chat", "FAQ"] },
  { title: "Company", links: ["About Guma AI-commerce", "Become a Seller", "Careers", "Privacy"] },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      {/* Sell everywhere banner */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl bg-foreground p-7 text-center text-background sm:p-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1 text-xs font-semibold">
            <Sparkles className="size-3.5" /> One store, every feed
          </span>
          <h2 className="mx-auto mt-4 max-w-xl font-display text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            Sell on every platform from a single Guma AI-commerce store
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {platforms.map((p) => (
              <span
                key={p}
                className="rounded-full bg-background/10 px-4 py-2 text-sm font-medium text-background"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <a href="#" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-5" />
            </span>
            <span className="font-display text-xl font-bold text-foreground">Guma AI-commerce</span>
          </a>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            The AI-powered social storefront that turns your feed into a fast, friendly shop.
          </p>
          <div className="mt-4 flex gap-2">
            {["Facebook", "Instagram", "TikTok"].map((social) => (
              <a
                key={social}
                href="#"
                aria-label={social}
                className="flex size-9 items-center justify-center rounded-full border border-border text-xs font-bold text-foreground transition-colors hover:bg-muted"
              >
                {social === "Instagram" ? "IG" : social === "TikTok" ? "TT" : "f"}
              </a>
            ))}
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 text-sm font-semibold text-foreground">{col.title}</h3>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Guma AI-commerce. All rights reserved.</p>
          <p>Made for social sellers everywhere.</p>
        </div>
      </div>
    </footer>
  )
}
