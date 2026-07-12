# Storefront template library

External full-code templates are extracted under `reference/` and integrated as Guma Commerce storefront patterns.

## Free Bundle 2023 (100 templates)

- **Source zip:** `Free.Bundle.2023.zip` → `reference/Free.Bundle.2023/Free bundle 2023/`
- **Master catalog:** [BUNDLE-2023-CATALOG.md](./BUNDLE-2023-CATALOG.md)
- **Machine registry:** `packages/storefront-themes/src/bundle-catalog.ts`
- **Status:** Categorized — 14 live integrations + 86 bundle entries mapped to 39 shop categories
- **Priority queue:** `aircon`, `haircut`, `feane`, `dentcare`, `carserv`, `multishop`

Send a bundle template name (e.g. `aircon-1.0.0.zip`) to port the next storefront.

## Bloom (bloomtpl 1.0.0)

- **Source zip:** `bloomtpl-1.0.0.zip` (ThemeWagon / Bloomtpl, MIT)
- **Reference copy:** `reference/bloomtpl-1.0.0/bloomtpl-1.0.0/`
- **Integrated renderer:** `apps/web/components/storefront/bloom/`
- **Template ID:** `bloom`
- **Pattern ID:** `bloom`
- **Demo:** http://localhost:3010/bloom-demo

### Platform wiring

| Bloom original | Guma Commerce |
|----------------|---------------|
| `BLOOMSHOP` header/footer | `tenant.name` + `logoUrl` |
| Hero copy | `promoTitle` + `tagline` |
| `CartContext` / localStorage `cart` | `useCart(tenantSlug)` → `guma-cart:{slug}` |
| `/cart` | `/{tenantSlug}/checkout` |
| `products.json` | Tenant products from DB |
| Sign in / Sign up | Removed (seller uses admin) |
| Theme orange primary | `shopTheme.primaryColor` via CSS vars |

### Assignment

- **Onboarding:** Fashion & Apparel / Retail categories can auto-match via `matchStorePattern()`
- **Shop Builder:** Pick **Bloom** template → sets `templateId` + `patternId`

## Sarab (sarab 1.0.0)

- **Source zip:** `sarab-1.0.0.zip` (ThemeWagon / Bestwpware, MIT)
- **Reference copy:** `reference/sarab-1.0.0/sarab/`
- **Integrated renderer:** `apps/web/components/storefront/sarab/`
- **Template ID:** `sarab`
- **Pattern ID:** `sarab`
- **Demo:** http://localhost:3010/sarab-demo

HTML restaurant template ported to React: topbar, sticky nav, hero with circular image, promo marquee, filterable menu cards, footer. Uses Guma cart + checkout.

### Assignment

- **Onboarding:** Food & Beverage / Catering auto-match via category hints
- **Shop Builder:** Pick **Sarab** template

## Furnish (furnish 1.0.0)

- **Source zip:** `furnish-1.0.0.zip` (ThemeWagon / CodesCandy, MIT)
- **Reference copy:** `reference/furnish-1.0.0/furnish-1.0.0/`
- **Integrated renderer:** `apps/web/components/storefront/furnish/`
- **Template ID:** `furnish`
- **Pattern ID:** `furnish`
- **Demo:** http://localhost:3010/furnish-demo

Editorial furniture template: minimal header, hero with featured product, collection grid with compare-at pricing, testimonial, newsletter, and dark footer. Uses Guma cart + checkout.

### Assignment

- **Onboarding:** Furniture & Home / interior decor auto-match via category hints
- **Shop Builder:** Pick **Furnish** template

## Zay Shop (Zay.Shop)

- **Source zip:** `Zay.Shop.zip` (TemplateMo 559 Zay Shop, free)
- **Reference copy:** `reference/zay-shop/templatemo_559_zay_shop/`
- **Integrated renderer:** `apps/web/components/storefront/zay/`
- **Template ID:** `zay`
- **Pattern ID:** `zay`
- **Demo:** http://localhost:3010/zay-demo

Classic general retail layout: dark top bar, green brand header, hero carousel, category circles, featured product cards, and newsletter footer. Uses Guma cart + checkout.

### Assignment

- **Onboarding:** Retail & General Merchandise / wholesale auto-match via category hints
- **Shop Builder:** Pick **Zay Shop** template

## Electro (Electro-Bootstrap 1.0.0)

- **Source zip:** `Electro-Bootstrap-1.0.0.zip` (HTML Codex / TemplateMo, free)
- **Reference copy:** `reference/electro-bootstrap-1.0.0/Electro-Bootstrap-1.0.0/`
- **Integrated renderer:** `apps/web/components/storefront/electro/`
- **Template ID:** `electro`
- **Pattern ID:** `electro`
- **Demo:** http://localhost:3010/electro-demo

Electronics storefront: top bar, search header with cart total, category sidebar nav, hero carousel with side promo, service strip, tabbed product grid, dark footer. Uses Guma cart + checkout.

### Assignment

- **Onboarding:** Electronics category auto-match via category hints
- **Shop Builder:** Pick **Electro** template

## Kaira (kaira 1.0.0)

- **Source zip:** `kaira-1.0.0.zip` (TemplatesJungle, free)
- **Reference copy:** `reference/kaira-1.0.0/kaira-1.0.0/`
- **Integrated renderer:** `apps/web/components/storefront/kaira/`
- **Template ID:** `kaira`
- **Pattern ID:** `kaira`
- **Demo:** http://localhost:3010/kaira-demo

Editorial fashion layout: minimal header, new collections grid, feature strip, category banners, new arrivals & bestsellers rows, collection spotlight, newsletter. Uses Guma cart + checkout.

### Assignment

- **Onboarding:** Fashion & Apparel category auto-match via category hints (or pick explicitly in Shop Builder)
- **Shop Builder:** Pick **Kaira** template

## FoodMart (FoodMart-1.0.0)

- **Source zip:** `FoodMart-1.0.0.zip` (TemplatesJungle, free)
- **Reference copy:** `reference/foodmart-1.0.0/FoodMart-1.0.0/`
- **Integrated renderer:** `apps/web/components/storefront/foodmart/`
- **Template ID:** `foodmart`
- **Pattern ID:** `foodmart`
- **Demo:** http://localhost:3010/foodmart-demo

Grocery layout: search header with cart total, hero banners, category carousel, tabbed trending products, promo strip. Uses Guma cart + checkout.

### Assignment

- **Onboarding:** Grocery & Supermarket category auto-match via category hints
- **Shop Builder:** Pick **FoodMart** template

## Stylish (stylish-1.0.0)

- **Source zip:** `stylish-1.0.0.zip` (TemplatesJungle, free)
- **Reference copy:** `reference/stylish-1.0.0/stylish-1.0.0/`
- **Integrated renderer:** `apps/web/components/storefront/stylish/`
- **Template ID:** `stylish`
- **Pattern ID:** `stylish`
- **Demo:** http://localhost:3010/stylish-demo

Shoe & apparel layout: promo top bar, hero banner grid, 10% coupon strip, featured & latest product rows with hover actions, collection blocks. Uses Guma cart + checkout.

### Assignment

- **Onboarding:** Shoes & Footwear category auto-match via category hints
- **Shop Builder:** Pick **Stylish** template

## Mellow (mellow-1.0.0)

- **Source zip:** `mellow-1.0.0.zip` (TemplatesJungle, free)
- **Reference copy:** `reference/mellow-1.0.0/mellow-1.0.0/`
- **Integrated renderer:** `apps/web/components/storefront/mellow/`
- **Template ID:** `mellow`
- **Pattern ID:** `mellow`
- **Demo:** http://localhost:3010/mellow-demo

Hotel & resort layout: contact top bar, booking hero with availability form, about section, stats strip, room cards (Guma products), gallery, amenities grid. Uses Guma cart + checkout for room bookings.

### Assignment

- **Onboarding:** Hotels & Resorts category auto-match via category hints
- **Shop Builder:** Pick **Mellow** template

## Organic (organic-1.0.0)

- **Source zip:** `organic-1.0.0.zip` (TemplatesJungle, free)
- **Reference copy:** `reference/organic-1.0.0/organic-1.0.0/`
- **Integrated renderer:** `apps/web/components/storefront/organic/`
- **Template ID:** `organic`
- **Pattern ID:** `organic`
- **Demo:** http://localhost:3010/organic-demo

Farm produce layout: search header, hero with stats & feature strip, category carousel, tabbed best-sellers, promo strip. Uses Guma cart + checkout.

### Assignment

- **Onboarding:** Organic & Farm Produce category auto-match via category hints
- **Shop Builder:** Pick **Organic** template

## Waggy (waggy-1.0.0)

- **Source zip:** `waggy-1.0.0.zip` (TemplatesJungle, free)
- **Reference copy:** `reference/waggy-1.0.0/waggy-1.0.0/`
- **Integrated renderer:** `apps/web/components/storefront/waggy/`
- **Template ID:** `waggy`
- **Pattern ID:** `waggy`
- **Demo:** http://localhost:3010/waggy-demo

Pet shop layout: search header, hero banner, icon categories, tabbed best-sellers, promo strip, services. Uses Guma cart + checkout.

### Assignment

- **Onboarding:** Pet Supplies & Lovers category auto-match via category hints
- **Shop Builder:** Pick **Waggy** template

## Fruitables (fruitables-1.0.0)

- **Source zip:** `fruitables-1.0.0.zip` (HTML Codex, free)
- **Reference copy:** `reference/fruitables-1.0.0/fruitables-1.0.0/`
- **Integrated renderer:** `apps/web/components/storefront/fruitables/`
- **Template ID:** `fruitables`
- **Pattern ID:** `fruitables`
- **Demo:** http://localhost:3010/fruitables-demo

Fruits & vegetables variant: top bar, hero search, feature strip, tabbed products, promo cards, vegetable scroll, banner. Uses Guma cart + checkout.

### Assignment

- **Onboarding:** Fruit/vegetable category hints auto-match (alongside Organic)
- **Shop Builder:** Pick **Fruitables** template for produce shops wanting this layout

## MiniStore (MiniStore-1.0.0)

- **Source zip:** `MiniStore-1.0.0.zip` (TemplatesJungle / Moksha, free)
- **Reference copy:** `reference/MiniStore-1.0.0/MiniStore-1.0.0/`
- **Integrated renderer:** `apps/web/components/storefront/ministore/`
- **Template ID:** `ministore`
- **Pattern ID:** `ministore`
- **Demo:** http://localhost:3010/ministore-demo

Gadgets & tech layout: sticky header, hero billboard, service icons, mobile product carousel, smart watch row, sale banner. Uses Guma cart + checkout.

### Assignment

- **Onboarding:** Electronics / gadget category hints auto-match (alongside Electro)
- **Shop Builder:** Pick **MiniStore** template for minimal tech storefronts

## Adding the next template

1. Extract zip to `reference/{name}/`
2. Port UI to `apps/web/components/storefront/{name}/`
3. Register in `packages/storefront-themes/src/templates.ts` + `patterns.ts`
4. Add entry to `packages/storefront-themes/src/template-registry.ts`
5. Wire `TenantStorefrontHome` dispatcher
6. Add demo tenant in `apps/web/lib/demo-data.ts`
