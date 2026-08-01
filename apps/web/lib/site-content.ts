export const company = {
  name: "Guma One Technologies",
  product: "Guma One",
  email: "hello@gumacommerce.ph",
  support: "support@gumacommerce.ph",
  privacy: "privacy@gumacommerce.ph",
  phone: "+63 2 8123 4567",
  address: "Bonifacio Global City, Taguig City, Metro Manila, Philippines",
  registry: "SEC Registration No. [Pending] · BIR TIN [Pending]",
};

export const footerLinks = {
  product: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Demo shop", href: "/demo" },
    { label: "AI Content Studio", href: `${process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001"}/ai-studio` },
  ],
  company: [
    { label: "About us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
  ],
  support: [
    { label: "Help center", href: "/help" },
    { label: "FAQs", href: "/faq" },
    { label: "Seller guide", href: "/help/sellers" },
    { label: "Status", href: "/status" },
  ],
  legal: [
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of service", href: "/terms" },
    { label: "Refund policy", href: "/refunds" },
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
        a: "Guma One is an all-in-one social commerce platform built for Philippine sellers. It turns your Facebook, TikTok, and Instagram posts into a branded mobile storefront with GCash/Maya checkout, AI marketing tools, and Lalamove delivery — so you stop losing sales in Messenger chats.",
      },
      {
        q: "Who is Guma One for?",
        a: "Home-based sellers, food creators, fashion resellers, beauty brands, and any small business selling through social media in the Philippines. If you currently take orders via PM, comment, or chat, Guma One is built for you.",
      },
      {
        q: "How long does setup take?",
        a: "Most sellers launch in under 30 minutes. Create your account, add products (or let AI generate listings), connect payments, and paste your Order Now link in your bio and posts.",
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
        a: "GCash, Maya, QRPh, credit/debit cards, and Cash on Delivery (COD) — all optimized for Filipino buyers. You choose which methods to enable per shop.",
      },
      {
        q: "How much does Guma One cost?",
        a: "Start free on the Free plan. Pro is ₱499/month for GUMA Workspace, agents, and higher AI limits. Advance is ₱999/month for advanced campaigns and priority support. A small per-order platform fee applies on paid transactions.",
      },
      {
        q: "When do I receive my money?",
        a: "E-wallet and card payments are settled through our licensed payment partners (PayMongo/Xendit) according to their payout schedule — typically T+1 to T+2 business days to your linked bank account or e-wallet.",
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
        a: "Guma One integrates with Lalamove for instant quotes and rider booking. Customers see delivery fees at checkout. You can also enter manual rider details for Angkas, GrabExpress, or your own riders.",
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
