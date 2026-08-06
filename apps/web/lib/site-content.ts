export const company = {
  name: "Guma One Technologies",
  product: "Guma One",
  email: "hello@gumacommerce.ph",
  support: "support@gumacommerce.ph",
  privacy: "privacy@gumacommerce.ph",
  /** Placeholder phone — replace with the real business line when available. */
  phone: "",
  address: "Metro Manila, Philippines",
  /** Explicit pending state — do not invent SEC/TIN numbers. */
  registry: "SEC & BIR registration pending — legal entity details will be published here when issued.",
};

export const footerLinks = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Demo shop", href: "/demo" },
    { label: "Model store", href: "/model" },
  ],
  sellers: [
    { label: "Seller login", href: `${process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001"}/login` },
    { label: "Start free", href: `${process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001"}/signup` },
    { label: "Seller guide", href: "/help/sellers" },
    { label: "Help center", href: "/help" },
    { label: "FAQs", href: "/faq" },
    { label: "System status", href: "/status" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Refunds", href: "/refunds" },
    { label: "Data privacy (DPA)", href: "/privacy#dpa" },
  ],
};

export const faqCategories = [
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      {
        q: "What is Guma One?",
        a: "Guma One is a social commerce platform for Philippine sellers. It turns Facebook, TikTok, and Instagram posts into a branded mobile storefront with guest checkout (GCash/Maya instructions or COD), seller tools, and optional courier booking — so buyers order from a shop link instead of burying requests in Messenger chats.",
      },
      {
        q: "Who is Guma One for?",
        a: "Home-based sellers, food creators, fashion resellers, beauty brands, and any small business selling through social media in the Philippines. If you currently take orders via PM, comment, or chat, Guma One is built for you.",
      },
      {
        q: "How long does setup take?",
        a: "Most sellers launch in under 30 minutes. Create your account, add products, set your GCash/Maya receiving details (or COD), and paste your Order Now link in your bio and posts. AI helpers can enhance descriptions later — listing stays manual-first.",
      },
      {
        q: "Do I need a website or coding skills?",
        a: "No. Guma One gives you a ready-made mobile storefront at yourname.gumacommerce.ph. No developers, no Shopify setup, no technical knowledge required.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments & pricing",
    items: [
      {
        q: "What payment methods can my customers use?",
        a: "Soft launch default: buyers pay you directly via GCash, Maya, or bank transfer (you confirm in the seller inbox), plus Cash on Delivery. Card/QRPh via PayMongo is available when your shop and environment have live payment keys enabled.",
      },
      {
        q: "How much does Guma One cost?",
        a: "Start free on the Free plan. Pro is ₱499/month for GUMA Workspace, agents, and higher AI limits. Advance is ₱999/month for advanced campaigns and priority support. A small per-order platform fee may apply on paid gateway transactions when PayMongo is enabled.",
      },
      {
        q: "When do I receive my money?",
        a: "With manual e-wallet checkout, funds go straight to your GCash/Maya/bank account when the buyer pays you — you confirm payment in the seller console. When PayMongo gateway mode is enabled with live keys, settlement follows the partner payout schedule (typically T+1 to T+2).",
      },
      {
        q: "Is there a contract or lock-in period?",
        a: "No lock-in. Cancel anytime. Your data and customer list remain yours.",
      },
    ],
  },
  {
    id: "delivery",
    title: "Orders & delivery",
    items: [
      {
        q: "How does delivery work?",
        a: "At checkout, buyers can see a delivery fee (seller flat rate and/or live courier quotes when Lalamove/Grab credentials are configured). After payment, you Book a courier or Assign a rider (Angkas, Move It, or your own) from the order screen — auto-dispatch on payment is not the v1 story.",
      },
      {
        q: "Can customers order without creating an account?",
        a: "Yes. Guest checkout is the default — name, mobile number, and address only. Faster checkout means higher conversion on mobile.",
      },
      {
        q: "Do you support pickup?",
        a: "Yes. Sellers can enable pickup at their store location alongside delivery options.",
      },
    ],
  },
  {
    id: "ai",
    title: "AI & social media",
    items: [
      {
        q: "What does the AI Content Studio do?",
        a: "Generate TikTok scripts, Instagram/Facebook captions, product descriptions, and 7-day marketing campaigns in English, Filipino, or Taglish — with your Order Now link already embedded.",
      },
      {
        q: "How do Order Now links work on social media?",
        a: "Every post, reel, or story gets a unique link. When customers tap it, they land on your branded storefront (not Messenger). UTM tracking shows which platform drives the most sales.",
      },
      {
        q: "Does Guma One work with Facebook Shops and TikTok Shop?",
        a: "Yes. Guma One aligns with Meta's website-checkout model and supports TikTok link-in-bio ordering. Your Guma One storefront is the checkout destination.",
      },
    ],
  },
  {
    id: "trust",
    title: "Trust & compliance",
    items: [
      {
        q: "Is Guma One compliant with Philippine data privacy laws?",
        a: "Yes. We comply with the Data Privacy Act of 2012 (RA 10173), NPC issuances, and the Internet Transactions Act (RA 11967). See our Privacy Policy for full details.",
      },
      {
        q: "Is my customer data secure?",
        a: "All data is encrypted in transit (TLS) and at rest. We use licensed payment gateways — we never store full card numbers. Access is restricted and audited.",
      },
      {
        q: "Where is data stored?",
        a: "Production data is hosted on secure cloud infrastructure (PostgreSQL on Neon, deployed via Vercel) with Asia-Pacific region options for lower latency.",
      },
    ],
  },
];
