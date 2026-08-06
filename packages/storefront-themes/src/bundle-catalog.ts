/**
 * Master catalog for reference/Free.Bundle.2023 (100 HTML templates).
 * Maps each source zip to a Guma One shop category, integration status,
 * and nearest already-integrated renderer (if any).
 */
import type { ShopBusinessCategory } from "./shop-categories";

export type BundleTemplateStatus =
  | "integrated"
  | "variant-of-integrated"
  | "queued-storefront"
  | "service-landing"
  | "admin-dashboard"
  | "content-media"
  | "non-storefront";

export type StorefrontFit = "ecommerce" | "service-booking" | "corporate" | "admin" | "content";

export interface BundleTemplateCatalogEntry {
  /** 1–100 bundle index */
  num: number;
  /** Original zip filename inside Free bundle 2023 */
  bundleFile: string;
  /** Proposed Guma template slug when ported */
  proposedId: string;
  label: string;
  detectedTitle: string;
  shopCategory: ShopBusinessCategory;
  status: BundleTemplateStatus;
  storefrontFit: StorefrontFit;
  /** Closest live Guma renderer, if this is a duplicate/variant */
  similarIntegratedId?: string;
  notes: string;
  /**
   * Lower = sooner. Phase 4 priority ports for high-demand PH verticals.
   * Only set on the active port queue — not every queued template.
   */
  portPriority?: number;
}

export const BUNDLE_2023_SOURCE = "reference/Free.Bundle.2023/Free bundle 2023";
export const BUNDLE_2023_LICENSE = "Mixed free licenses (HTML Codex, Colorlib, TemplateMo, etc.) — verify per template before production.";

export const BUNDLE_2023_CATALOG: BundleTemplateCatalogEntry[] = [
  { num: 1, bundleFile: "01 zouFarm-main.zip", proposedId: "zoufarm", label: "ZouFarm", detectedTitle: "Zoufarm | Landing, Corporate & Business", shopCategory: "Organic & Farm Produce", status: "variant-of-integrated", storefrontFit: "ecommerce", similarIntegratedId: "organic", notes: "Farm/agri corporate shop — port after organic/fruitables family." },
  { num: 2, bundleFile: "02 zoofari-1.0.0.zip", proposedId: "zoofari", label: "Zoofari", detectedTitle: "Zoofari - Zoo & Safari Park", shopCategory: "Attractions & Leisure", status: "queued-storefront", storefrontFit: "service-booking", notes: "Ticketed attractions, tours, merch." },
  { num: 3, bundleFile: "03 wooxtravel-1.0.0.zip", proposedId: "wooxtravel", label: "WoOx Travel", detectedTitle: "WoOx Travel Bootstrap 5 Theme", shopCategory: "Travel & Tours", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "mellow", notes: "Travel agency / tour packages — hospitality-adjacent." },
  { num: 4, bundleFile: "04 woody-1.0.0.zip", proposedId: "woody", label: "Woody Carpenter", detectedTitle: "Woody - Carpenter Website", shopCategory: "Home Services & Trades", status: "queued-storefront", storefrontFit: "service-booking", notes: "Carpentry, woodwork, custom furniture quotes." },
  { num: 5, bundleFile: "05 webuild-1.0.0.zip", proposedId: "webuild", label: "WeBuild", detectedTitle: "WEBUILD - Construction Company", shopCategory: "Construction & Renovation", status: "queued-storefront", storefrontFit: "service-booking", notes: "Contractor portfolio + service inquiry." },
  { num: 6, bundleFile: "06 tale-1.0.0.zip", proposedId: "tale", label: "Tale SEO Agency", detectedTitle: "Tale SEO Agency", shopCategory: "Professional & Consulting", status: "service-landing", storefrontFit: "corporate", notes: "Agency landing — optional packaged SEO services." },
  { num: 7, bundleFile: "07 vegefoods-master.zip", proposedId: "vegefoods", label: "Vegefoods", detectedTitle: "Vegefoods - Colorlib", shopCategory: "Organic & Farm Produce", status: "variant-of-integrated", storefrontFit: "ecommerce", similarIntegratedId: "fruitables", notes: "Produce eCommerce — third variant after organic + fruitables." },
  { num: 8, bundleFile: "08 UpConstruction-1.0.0.zip", proposedId: "upconstruction", label: "UpConstruction", detectedTitle: "UpConstruction", shopCategory: "Construction & Renovation", status: "queued-storefront", storefrontFit: "service-booking", notes: "Builder/remodeling services." },
  { num: 9, bundleFile: "09 training-studio-1.0.0.zip", proposedId: "training-studio", label: "Training Studio", detectedTitle: "Training Studio - Free CSS", shopCategory: "Fitness & Wellness", status: "queued-storefront", storefrontFit: "service-booking", notes: "Gym memberships, class packs, supplements." },
  { num: 10, bundleFile: "10 tour-1.0.0.zip", proposedId: "tour", label: "Tour", detectedTitle: "Tour / travel template", shopCategory: "Travel & Tours", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "mellow", notes: "Tour operator storefront." },
  { num: 11, bundleFile: "11 tivo-1.0.0.zip", proposedId: "tivo", label: "Tivo SaaS", detectedTitle: "Tivo SaaS App Landing", shopCategory: "Professional & Consulting", status: "non-storefront", storefrontFit: "corporate", notes: "SaaS marketing page — not physical goods." },
  { num: 12, bundleFile: "12 studio-master.zip", proposedId: "studio", label: "Studio Photography", detectedTitle: "Studio - Creative Photography", shopCategory: "Photography & Creative", status: "integrated", storefrontFit: "service-booking", notes: "Photo packages, prints, session booking. Interim port target for Printing & Signage until a dedicated print theme exists.", portPriority: 4 },
  { num: 13, bundleFile: "13 stride-1.0.0.zip", proposedId: "stride", label: "Stride", detectedTitle: "Stride", shopCategory: "Fitness & Wellness", status: "queued-storefront", storefrontFit: "service-booking", notes: "Sports/fitness brand — verify niche on extract." },
  { num: 14, bundleFile: "14 sterial-1.0.0.zip", proposedId: "sterial", label: "Sterial", detectedTitle: "Sterial", shopCategory: "Retail & General Merchandise", status: "queued-storefront", storefrontFit: "ecommerce", similarIntegratedId: "zay", notes: "General retail multipurpose." },
  { num: 15, bundleFile: "15 startup2-1.0.0.zip", proposedId: "startup2", label: "Startup2", detectedTitle: "Startup Website Template", shopCategory: "Professional & Consulting", status: "service-landing", storefrontFit: "corporate", notes: "Startup pitch / services landing." },
  { num: 16, bundleFile: "16 star-admin2-free-admin-template-1.0.0.zip", proposedId: "star-admin2", label: "Star Admin 2", detectedTitle: "Star Admin 2", shopCategory: "General", status: "admin-dashboard", storefrontFit: "admin", notes: "Seller dashboard reference only — not a storefront." },
  { num: 17, bundleFile: "17 solartec-1.0.0.zip", proposedId: "solartec", label: "Solartec", detectedTitle: "Solartec - Renewable Energy", shopCategory: "Solar & Renewable Energy", status: "queued-storefront", storefrontFit: "service-booking", notes: "Solar install quotes + equipment catalog." },
  { num: 18, bundleFile: "18 soffer-1.0.0.zip", proposedId: "soffer", label: "soFFer Software", detectedTitle: "soFFer - Software Landing", shopCategory: "Electronics", status: "non-storefront", storefrontFit: "corporate", similarIntegratedId: "ministore", notes: "Software product landing — digital goods optional." },
  { num: 19, bundleFile: "19 sneat-1.0.0.zip", proposedId: "sneat", label: "Sneat Admin", detectedTitle: "Sneat", shopCategory: "General", status: "admin-dashboard", storefrontFit: "admin", notes: "Admin UI kit — Guma dashboard reference." },
  { num: 20, bundleFile: "20 seomaster-1.0.0.zip", proposedId: "seomaster", label: "SEO Master", detectedTitle: "SEO Master - SEO Agency", shopCategory: "Professional & Consulting", status: "service-landing", storefrontFit: "corporate", notes: "Marketing agency services." },
  { num: 21, bundleFile: "21 securex-1.0.0.zip", proposedId: "securex", label: "Securex CCTV", detectedTitle: "Securex - CCTV Camera", shopCategory: "Security & Surveillance", status: "queued-storefront", storefrontFit: "service-booking", notes: "CCTV install + security products." },
  { num: 22, bundleFile: "22 revolve-1.0.0.zip", proposedId: "revolve", label: "Revolve Blog", detectedTitle: "Revolve - Personal Magazine", shopCategory: "General", status: "content-media", storefrontFit: "content", notes: "Blog/magazine — pair with shop via General template." },
  { num: 23, bundleFile: "23 restoran-1.0.0.zip", proposedId: "restoran", label: "Restoran", detectedTitle: "Restoran", shopCategory: "Food & Beverage", status: "variant-of-integrated", storefrontFit: "ecommerce", similarIntegratedId: "sarab", notes: "Restaurant menu ordering variant." },
  { num: 24, bundleFile: "24 Restaurantly.zip", proposedId: "restaurantly", label: "Restaurantly", detectedTitle: "Restaurantly", shopCategory: "Food & Beverage", status: "variant-of-integrated", storefrontFit: "ecommerce", similarIntegratedId: "sarab", notes: "Fine dining / restaurant variant." },
  { num: 25, bundleFile: "25 real-estate-html-template.zip", proposedId: "makaan", label: "Makaan Real Estate", detectedTitle: "Makaan - Real Estate HTML", shopCategory: "Real Estate & Property", status: "queued-storefront", storefrontFit: "service-booking", notes: "Property listings — booking/inquiry flow." },
  { num: 26, bundleFile: "26 property-1.0.0.zip", proposedId: "property", label: "Property", detectedTitle: "Property", shopCategory: "Real Estate & Property", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "makaan", notes: "Real estate agency variant." },
  { num: 27, bundleFile: "27 proman-1.0.0.zip", proposedId: "proman", label: "ProMan Portfolio", detectedTitle: "ProMan - Personal Portfolio", shopCategory: "Professional & Consulting", status: "service-landing", storefrontFit: "corporate", notes: "Freelancer portfolio — optional digital products." },
  { num: 28, bundleFile: "28 productly-v1.0.0.zip", proposedId: "productly", label: "Productly", detectedTitle: "Productly | Design Agency", shopCategory: "Professional & Consulting", status: "service-landing", storefrontFit: "corporate", notes: "Design agency landing." },
  { num: 29, bundleFile: "29 prixima-1.0.0.zip", proposedId: "prixima", label: "Prixima", detectedTitle: "Prixima BS5 Template", shopCategory: "Professional & Consulting", status: "service-landing", storefrontFit: "corporate", notes: "Business/consulting multipurpose." },
  { num: 30, bundleFile: "30 photozone-1.0.0 (1).zip", proposedId: "photozone", label: "Photozone", detectedTitle: "Photozone - Photo Studio", shopCategory: "Photography & Creative", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "studio", notes: "Studio sessions + print products." },
  { num: 31, bundleFile: "31 painter-1.0.0.zip", proposedId: "painter", label: "Painter", detectedTitle: "PAINTER - Painting Company", shopCategory: "Home Services & Trades", status: "queued-storefront", storefrontFit: "service-booking", notes: "Painting contractor quotes." },
  { num: 32, bundleFile: "32 orthoc.zip", proposedId: "orthoc", label: "Orthoc", detectedTitle: "Orthoc", shopCategory: "Healthcare & Clinics", status: "queued-storefront", storefrontFit: "service-booking", notes: "Orthopedic clinic appointments." },
  { num: 33, bundleFile: "33 nomad-force-1.0.0.zip", proposedId: "nomad-force", label: "Nomad Force", detectedTitle: "Nomad Force Bootstrap 5", shopCategory: "General", status: "content-media", storefrontFit: "content", notes: "News/blog layout." },
  { num: 34, bundleFile: "34 PodTalk-1.0.0.zip", proposedId: "podtalk", label: "PodTalk", detectedTitle: "Pod Talk", shopCategory: "General", status: "content-media", storefrontFit: "content", notes: "Podcast/media — merch add-on possible." },
  { num: 35, bundleFile: "35 multishop-1.0.0.zip", proposedId: "multishop", label: "MultiShop", detectedTitle: "MultiShop - Online Shop", shopCategory: "Retail & General Merchandise", status: "variant-of-integrated", storefrontFit: "ecommerce", similarIntegratedId: "zay", notes: "Multi-category retail — zay/electro family." },
  { num: 36, bundleFile: "36 motto-1.0.0.zip", proposedId: "motto", label: "Motto Moto", detectedTitle: "moto", shopCategory: "Auto Shop & Services", status: "integrated", storefrontFit: "ecommerce", notes: "Motorcycle / moto gear shop.", portPriority: 3 },
  { num: 37, bundleFile: "37 montana-master.zip", proposedId: "montana", label: "Montana", detectedTitle: "Montana", shopCategory: "Events & Entertainment", status: "queued-storefront", storefrontFit: "service-booking", notes: "Events, venues, tickets." },
  { num: 38, bundleFile: "38 meyawo-1.0.0.zip", proposedId: "meyawo", label: "Meyawo", detectedTitle: "Meyawo Landing page", shopCategory: "Professional & Consulting", status: "service-landing", storefrontFit: "corporate", notes: "Generic startup landing." },
  { num: 39, bundleFile: "39 materio-1.0.0.zip", proposedId: "materio", label: "Materio Admin", detectedTitle: "Materio", shopCategory: "General", status: "admin-dashboard", storefrontFit: "admin", notes: "Admin dashboard kit." },
  { num: 40, bundleFile: "40 logistica-1.0.0.zip", proposedId: "logistica", label: "Logistica", detectedTitle: "Logistica - Shipping Company", shopCategory: "Logistics & Shipping", status: "queued-storefront", storefrontFit: "service-booking", notes: "Freight quotes + logistics services." },
  { num: 41, bundleFile: "41 landwind-1.0.0.zip", proposedId: "landwind", label: "Landwind", detectedTitle: "Landwind - Tailwind Landing", shopCategory: "Professional & Consulting", status: "non-storefront", storefrontFit: "corporate", notes: "Tailwind SaaS landing." },
  { num: 42, bundleFile: "42 klinik-1.0.0.zip", proposedId: "klinik", label: "Klinik", detectedTitle: "Klinik - Clinic Website", shopCategory: "Healthcare & Clinics", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "dentcare", notes: "General clinic — appointments + health products." },
  { num: 43, bundleFile: "43 klar-1.0.0.zip", proposedId: "klar", label: "Klar", detectedTitle: "Klar HTML Template", shopCategory: "Retail & General Merchandise", status: "queued-storefront", storefrontFit: "ecommerce", similarIntegratedId: "zay", notes: "Multipurpose Bootstrap shop." },
  { num: 44, bundleFile: "44 KindHeart-1.0.0.zip", proposedId: "kindheart", label: "Kind Heart Charity", detectedTitle: "Kind Heart Charity", shopCategory: "General", status: "service-landing", storefrontFit: "corporate", notes: "Nonprofit donations — not standard commerce." },
  { num: 45, bundleFile: "45 kidkinder-1.0.0.zip", proposedId: "kidkinder", label: "KidKinder", detectedTitle: "KidKinder - Kindergarten", shopCategory: "Childcare & Education", status: "queued-storefront", storefrontFit: "service-booking", notes: "Enrollment, tuition, school supplies." },
  { num: 46, bundleFile: "46 kider-1.0.0.zip", proposedId: "kider", label: "Kider Preschool", detectedTitle: "Kider - Preschool", shopCategory: "Childcare & Education", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "kidkinder", notes: "Preschool variant." },
  { num: 47, bundleFile: "47 keto-1.0.0.zip", proposedId: "keto", label: "Keto Restaurant", detectedTitle: "keto", shopCategory: "Food & Beverage", status: "variant-of-integrated", storefrontFit: "ecommerce", similarIntegratedId: "sarab", notes: "Healthy/keto food menu shop." },
  { num: 48, bundleFile: "48 jobentry-1.0.0.zip", proposedId: "jobentry", label: "JobEntry", detectedTitle: "JobEntry - Job Portal", shopCategory: "Professional & Consulting", status: "non-storefront", storefrontFit: "corporate", notes: "Job board — outside core commerce scope." },
  { num: 49, bundleFile: "49 insure-1.0.0.zip", proposedId: "insure", label: "Insure", detectedTitle: "Insure - Insurance HTML", shopCategory: "Insurance & Financial Services", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "mono-market", notes: "Insurance quotes + policy sales — maps to mono-market until dedicated port." },
  { num: 50, bundleFile: "50 Indsutrio-1.0.0.zip", proposedId: "industro", label: "Industro", detectedTitle: "Industro - Industrial HTML", shopCategory: "Industrial & Manufacturing", status: "queued-storefront", storefrontFit: "ecommerce", notes: "B2B industrial equipment catalog." },
  { num: 51, bundleFile: "51 hotelier-1.0.0.zip", proposedId: "hotelier", label: "Hotelier", detectedTitle: "Hotelier - Hotel HTML", shopCategory: "Hotels & Resorts", status: "variant-of-integrated", storefrontFit: "service-booking", similarIntegratedId: "mellow", notes: "Hotel booking variant." },
  { num: 52, bundleFile: "52 haircut-1.0.0.zip", proposedId: "haircut", label: "HairCut Salon", detectedTitle: "HairCut - Hair Salon HTML", shopCategory: "Barber & Hair Salons", status: "queued-storefront", storefrontFit: "service-booking", notes: "Barber/salon appointments + grooming products." },
  { num: 53, bundleFile: "53 GrowMark-1.0.0.zip", proposedId: "growmark", label: "GrowMark", detectedTitle: "GrowMark - Digital Marketing", shopCategory: "Professional & Consulting", status: "service-landing", storefrontFit: "corporate", notes: "Digital marketing agency." },
  { num: 54, bundleFile: "54 greenhost-1.0.0.zip", proposedId: "greenhost", label: "GreenHost", detectedTitle: "GreenHost - Web Hosting", shopCategory: "Professional & Consulting", status: "non-storefront", storefrontFit: "corporate", notes: "Hosting plans — digital subscriptions." },
  { num: 55, bundleFile: "55 grad-school-1.0.0.zip", proposedId: "grad-school", label: "Grad School", detectedTitle: "Grad School HTML5", shopCategory: "Education & Training", status: "queued-storefront", storefrontFit: "service-booking", notes: "School/university programs." },
  { num: 56, bundleFile: "56 gohub-1.0.0.zip", proposedId: "gohub", label: "GoHub Travel", detectedTitle: "GoHub | Free Traveling", shopCategory: "Travel & Tours", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "wooxtravel", notes: "Travel blog + tour packages." },
  { num: 57, bundleFile: "57 gardener-1.0.0.zip", proposedId: "gardener", label: "Gardener", detectedTitle: "Gardener - Gardening Website", shopCategory: "Landscaping & Gardening", status: "queued-storefront", storefrontFit: "service-booking", notes: "Landscaping services + plants/tools." },
  { num: 58, bundleFile: "58 fruitkha-1.0.0.zip", proposedId: "fruitkha", label: "Fruitkha", detectedTitle: "Fruitkha Shop Template", shopCategory: "Organic & Farm Produce", status: "variant-of-integrated", storefrontFit: "ecommerce", similarIntegratedId: "fruitables", notes: "Bootstrap produce shop variant." },
  { num: 59, bundleFile: "59 fotogency-v1.0.0.zip", proposedId: "fotogency", label: "Fotogency", detectedTitle: "Fotogency | Photography Agency", shopCategory: "Photography & Creative", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "photozone", notes: "Agency-style photo services." },
  { num: 60, bundleFile: "60 foody2-1.0.0.zip", proposedId: "foody2", label: "Foody Organic", detectedTitle: "Foody - Organic Food Website", shopCategory: "Organic & Farm Produce", status: "variant-of-integrated", storefrontFit: "ecommerce", similarIntegratedId: "organic", notes: "Organic grocery variant." },
  { num: 61, bundleFile: "61 FitApp-fitapp.zip", proposedId: "fitapp", label: "FitApp", detectedTitle: "FitApp - Mobile App HTML", shopCategory: "Fitness & Wellness", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "training-studio", notes: "Fitness app promo + supplement shop." },
  { num: 62, bundleFile: "62 finanza-1.0.0.zip", proposedId: "finanza", label: "Finanza", detectedTitle: "Finanza - Financial Services", shopCategory: "Insurance & Financial Services", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "mono-market", notes: "Financial advisory services — mono-market until insure port." },
  { num: 63, bundleFile: "63 FestavaLive-1.0.0.zip", proposedId: "festavalive", label: "Festava Live", detectedTitle: "Festava Live - Bootstrap 5", shopCategory: "Events & Entertainment", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "montana", notes: "Festival tickets + merch." },
  { num: 64, bundleFile: "64 feane-1.0.0 (3).zip", proposedId: "feane", label: "Feane", detectedTitle: "Feane", shopCategory: "Food & Beverage", status: "variant-of-integrated", storefrontFit: "ecommerce", similarIntegratedId: "sarab", notes: "Fast-food delivery style — popular restaurant template." },
  { num: 65, bundleFile: "65 faster-1.0.0.zip", proposedId: "faster", label: "Faster Logistics", detectedTitle: "FASTER - Logistics Company", shopCategory: "Logistics & Shipping", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "logistica", notes: "Courier/logistics variant." },
  { num: 66, bundleFile: "66 farmfresh-1.0.0.zip", proposedId: "farmfresh", label: "FarmFresh", detectedTitle: "FarmFresh - Organic Farm", shopCategory: "Organic & Farm Produce", status: "variant-of-integrated", storefrontFit: "ecommerce", similarIntegratedId: "organic", notes: "Farm storefront variant." },
  { num: 67, bundleFile: "67 ensurance-v1.0.0.zip", proposedId: "ensurance", label: "Ensurance", detectedTitle: "Ensurance | Landing & Corporate", shopCategory: "Insurance & Financial Services", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "mono-market", notes: "Insurance corporate landing — mono-market until insure port." },
  { num: 68, bundleFile: "68 elearning-1.0.0.zip", proposedId: "elearning", label: "eLearning", detectedTitle: "eLEARNING - eLearning HTML", shopCategory: "Education & Training", status: "queued-storefront", storefrontFit: "service-booking", notes: "Online courses + digital products." },
  { num: 69, bundleFile: "69 eduwell-1.0.0.zip", proposedId: "eduwell", label: "EduWell", detectedTitle: "EduWell - Education HTML5", shopCategory: "Education & Training", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "elearning", notes: "Education institution variant." },
  { num: 70, bundleFile: "70 eduprix-v1.0.0.zip", proposedId: "eduprix", label: "Eduprix", detectedTitle: "Eduprix | Business Template", shopCategory: "Education & Training", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "eduwell", notes: "Training center / edupreneur." },
  { num: 71, bundleFile: "71 edu-meeting.zip", proposedId: "edu-meeting", label: "Edu Meeting", detectedTitle: "Education Meeting HTML5", shopCategory: "Education & Training", status: "queued-storefront", storefrontFit: "service-booking", notes: "Conference / seminar registration." },
  { num: 72, bundleFile: "72 drivin-1.0.0.zip", proposedId: "drivin", label: "Drivin School", detectedTitle: "Drivin - Driving School", shopCategory: "Auto Shop & Services", status: "queued-storefront", storefrontFit: "service-booking", notes: "Driving lessons + packages." },
  { num: 73, bundleFile: "73 digital-1-1.0.0.zip", proposedId: "digital", label: "DGital Agency", detectedTitle: "DGital - Digital Agency", shopCategory: "Professional & Consulting", status: "service-landing", storefrontFit: "corporate", notes: "Digital agency portfolio." },
  { num: 74, bundleFile: "74 dgcom-1.0.0.zip", proposedId: "dgcom", label: "DGcom", detectedTitle: "DGcom - Web Design Agency", shopCategory: "Professional & Consulting", status: "service-landing", storefrontFit: "corporate", similarIntegratedId: "digital", notes: "Web design agency variant." },
  { num: 75, bundleFile: "75 dentcare-1.0.0.zip", proposedId: "dentcare", label: "DentCare", detectedTitle: "DentCare - Dental Clinic", shopCategory: "Healthcare & Clinics", status: "queued-storefront", storefrontFit: "service-booking", notes: "Dental appointments + oral care products." },
  { num: 76, bundleFile: "76 dashmin-1.0.0.zip", proposedId: "dashmin", label: "Dashmin Admin", detectedTitle: "Dashmin", shopCategory: "General", status: "admin-dashboard", storefrontFit: "admin", notes: "Admin dashboard reference." },
  { num: 77, bundleFile: "77 darkpan-1.0.0.zip", proposedId: "darkpan", label: "DarkPan Admin", detectedTitle: "DarkPan", shopCategory: "General", status: "admin-dashboard", storefrontFit: "admin", notes: "Dark admin dashboard." },
  { num: 78, bundleFile: "78 dairy-website-template.zip", proposedId: "milky", label: "Milky Dairy", detectedTitle: "Milky - Dairy Website", shopCategory: "Organic & Farm Produce", status: "queued-storefront", storefrontFit: "ecommerce", similarIntegratedId: "organic", notes: "Dairy farm products — farm vertical." },
  { num: 79, bundleFile: "79 Cycle-1.0.0.zip", proposedId: "cycle", label: "Cycle", detectedTitle: "Cycle", shopCategory: "Camping & Adventures", status: "queued-storefront", storefrontFit: "ecommerce", notes: "Cycling gear / outdoor sports retail." },
  { num: 80, bundleFile: "80 cyborg-1.0.0.zip", proposedId: "cyborg", label: "Cyborg Gaming", detectedTitle: "Cyborg - Awesome HTML5", shopCategory: "Electronics", status: "queued-storefront", storefrontFit: "ecommerce", similarIntegratedId: "ministore", notes: "Gaming/esports gear shop." },
  { num: 81, bundleFile: "81 CryptoCoin-1.0.0.zip", proposedId: "cryptocoin", label: "CryptoCoin", detectedTitle: "CryptoCoin - Cryptocurrency", shopCategory: "Insurance & Financial Services", status: "non-storefront", storefrontFit: "corporate", notes: "Crypto fintech — specialized compliance." },
  { num: 82, bundleFile: "82 corso-1.0.0.zip", proposedId: "corso", label: "Corso Courses", detectedTitle: "Corso Training Course Landing", shopCategory: "Education & Training", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "elearning", notes: "Single-course funnel style." },
  { num: 83, bundleFile: "83 connect-plus-1.0.0.zip", proposedId: "connect-plus", label: "Connect Plus", detectedTitle: "Connect Plus", shopCategory: "Retail & General Merchandise", status: "queued-storefront", storefrontFit: "ecommerce", similarIntegratedId: "zay", notes: "Multipurpose commerce." },
  { num: 84, bundleFile: "84 chariteam-1.0.0.zip", proposedId: "chariteam", label: "ChariTeam", detectedTitle: "ChariTeam - Nonprofit", shopCategory: "General", status: "service-landing", storefrontFit: "corporate", notes: "Charity fundraising." },
  { num: 85, bundleFile: "85 celestialAdmin-free-admin-template-1.0.0.zip", proposedId: "celestial-admin", label: "Celestial Admin", detectedTitle: "Celestial Admin", shopCategory: "General", status: "admin-dashboard", storefrontFit: "admin", notes: "Admin dashboard reference." },
  { num: 86, bundleFile: "86 Casinal-1.0.0.zip", proposedId: "casinal", label: "Casinal", detectedTitle: "Casinal", shopCategory: "Events & Entertainment", status: "queued-storefront", storefrontFit: "service-booking", notes: "Casino/entertainment venue — verify license on extract." },
  { num: 87, bundleFile: "87 carserv-1.0.0.zip", proposedId: "carserv", label: "CarServ", detectedTitle: "CarServ - Car Repair HTML", shopCategory: "Auto Shop & Services", status: "integrated", storefrontFit: "service-booking", notes: "Auto repair booking + parts.", portPriority: 2 },
  { num: 88, bundleFile: "88 Capiclean-1.0.0.zip", proposedId: "capiclean", label: "Capiclean", detectedTitle: "Capiclean", shopCategory: "Cleaning & Janitorial", status: "queued-storefront", storefrontFit: "service-booking", notes: "Cleaning services quotes." },
  { num: 89, bundleFile: "89 cakezone-1.0.0.zip", proposedId: "cakezone", label: "CakeZone", detectedTitle: "CakeZone - Cake Shop", shopCategory: "Catering", status: "queued-storefront", storefrontFit: "ecommerce", similarIntegratedId: "simply-sweet", notes: "Cake/bakery orders — pairs with Simply Sweet pattern." },
  { num: 90, bundleFile: "90 Breeze-Free-Bootstrap-Admin-Template-1.0.0.zip", proposedId: "breeze-admin", label: "Breeze Admin", detectedTitle: "Breeze Admin", shopCategory: "General", status: "admin-dashboard", storefrontFit: "admin", notes: "Admin dashboard reference." },
  { num: 91, bundleFile: "91 boldo-1.0.0.zip", proposedId: "boldo", label: "Boldo Agency", detectedTitle: "Boldo Agency Template", shopCategory: "Professional & Consulting", status: "service-landing", storefrontFit: "corporate", notes: "Creative agency landing." },
  { num: 92, bundleFile: "92 biznews-1.0.0.zip", proposedId: "biznews", label: "BizNews", detectedTitle: "BizNews - Free News Website", shopCategory: "General", status: "content-media", storefrontFit: "content", notes: "News publisher — not primary commerce." },
  { num: 93, bundleFile: "93 bizconsult-1.0.0.zip", proposedId: "bizconsult", label: "BizConsult", detectedTitle: "BizConsult - Consulting HTML", shopCategory: "Professional & Consulting", status: "service-landing", storefrontFit: "corporate", notes: "Business consulting services." },
  { num: 94, bundleFile: "94 baker-1.0.0.zip", proposedId: "baker", label: "Baker", detectedTitle: "Baker - Bakery Website", shopCategory: "Catering", status: "queued-storefront", storefrontFit: "ecommerce", similarIntegratedId: "cakezone", notes: "Bakery bread/pastry orders." },
  { num: 95, bundleFile: "95 a-world-1.0.0.zip", proposedId: "a-world", label: "A World", detectedTitle: "A World", shopCategory: "General", status: "service-landing", storefrontFit: "corporate", notes: "Multipurpose charity/world theme." },
  { num: 96, bundleFile: "96 arkitektur-1.0.0.zip", proposedId: "arkitektur", label: "Arkitektur", detectedTitle: "Arkitektur - Architecture HTML", shopCategory: "Construction & Renovation", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "webuild", notes: "Architecture studio portfolio." },
  { num: 97, bundleFile: "97 archiark-main.zip", proposedId: "archiark", label: "Archiark", detectedTitle: "Archiark", shopCategory: "Construction & Renovation", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "arkitektur", notes: "Architecture variant." },
  { num: 98, bundleFile: "98 append-1.0.0.zip", proposedId: "append", label: "Append", detectedTitle: "Append Free HTML Template", shopCategory: "Professional & Consulting", status: "service-landing", storefrontFit: "corporate", notes: "Generic Untree landing." },
  { num: 99, bundleFile: "99 apex-1.0.0.zip", proposedId: "apex", label: "Apex Home Repair", detectedTitle: "Apex - Home Repair Website", shopCategory: "Home Services & Trades", status: "queued-storefront", storefrontFit: "service-booking", similarIntegratedId: "aircon", notes: "Handyman/home repair services." },
  { num: 100, bundleFile: "100 aircon-1.0.0.zip", proposedId: "aircon", label: "AirCon", detectedTitle: "AirCon - AC Repair Website", shopCategory: "HVAC & Air Conditioning", status: "integrated", storefrontFit: "service-booking", notes: "AC install/repair — high-priority PH vertical.", portPriority: 1 },
];

export function getBundleCatalogEntry(proposedId: string): BundleTemplateCatalogEntry | undefined {
  return BUNDLE_2023_CATALOG.find((e) => e.proposedId === proposedId);
}

export function listBundleByCategory(category: ShopBusinessCategory): BundleTemplateCatalogEntry[] {
  return BUNDLE_2023_CATALOG.filter((e) => e.shopCategory === category);
}

export function listBundleByStatus(status: BundleTemplateStatus): BundleTemplateCatalogEntry[] {
  return BUNDLE_2023_CATALOG.filter((e) => e.status === status);
}

/** Phase 4 priority HTML→React port queue (lowest portPriority first). */
export function listPriorityPortQueue(): BundleTemplateCatalogEntry[] {
  return BUNDLE_2023_CATALOG.filter((e) => typeof e.portPriority === "number").sort(
    (a, b) => (a.portPriority ?? 99) - (b.portPriority ?? 99)
  );
}

export const BUNDLE_2023_STATS = {
  total: BUNDLE_2023_CATALOG.length,
  integrated: BUNDLE_2023_CATALOG.filter((e) => e.status === "integrated").length,
  variantOfIntegrated: BUNDLE_2023_CATALOG.filter((e) => e.status === "variant-of-integrated").length,
  queuedStorefront: BUNDLE_2023_CATALOG.filter((e) => e.status === "queued-storefront").length,
  serviceLanding: BUNDLE_2023_CATALOG.filter((e) => e.status === "service-landing").length,
  adminDashboard: BUNDLE_2023_CATALOG.filter((e) => e.status === "admin-dashboard").length,
  contentMedia: BUNDLE_2023_CATALOG.filter((e) => e.status === "content-media").length,
  nonStorefront: BUNDLE_2023_CATALOG.filter((e) => e.status === "non-storefront").length,
} as const;
