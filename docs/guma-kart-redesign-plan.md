# Guma Kart: Social Automated Checkout Flow (Philippines First)
## Product UX Architecture & Design Specification

---

## 1. Executive Summary & Flow Mechanics
Guma Kart transforms casual social selling into structured e-commerce transactions. By listening for intent keywords (e.g., "MINE") on social platforms like Facebook, TikTok, and Instagram, the platform eliminates manual DM coordination by instantly pushing localized, high-conversion checkout links backed by **BayanGo** logistics fulfillment.

```
[Customer Comments "MINE"]
         ⬇️ (Guma Kart Bot Automates)
[Instant Checkout Link Sent via Social DM]
         ⬇️ (Lightweight 1-Page Checkout Webview)
[GCash / Maya / COD Payment Choice]
         ⬇️ (Webhook Confirmation)
[BayanGo Waybill Auto-Generated & Dispatched]
```

---

## 2. Interface Component Blueprints

### A. The Merchant Setup Dashboard (In-App)
* **Component Type:** The Keyword Trigger Setup Card
* **Layout Structure:** Clean vertical forms with high-contrast inputs. Uses the prominent **BayanGo Orange** (`#FF6B00`) for destructive or high-priority execution states.
* **Fields Required:**
  * **Trigger Keyword:** Text input (Defaults to case-insensitive `MINE` or `BUY`)
  * **Product Title:** Text input (e.g., *Vintage Corduroy Jacket*)
  * **Retail Price:** Currency numerical input formatted in Philippine Peso (`₱`)
  * **Inventory Count:** Numerical counter
* **UX Safety Toggle:** A large sticky switch component labeled **"Activate Auto-DM Listener"**. Turning this on deploys the webhook webhook listener to the selected live video stream or post.

### B. The Social DM Experience (Messenger / IG / TikTok)
* **Bot Interaction Model:** Lightweight text injection with an un-missable visual block.
* **UI Micro-copy String:** 
  > *"Hey {Buyer Name}! ⚡ We've locked in your **{Product Title} (₱{Price})**. Tap below to securely enter your delivery details and choose your payment method before cart expiration!"*
* **Primary Visual Component:** Full-width interactive chat card featuring a bright blue or deep slate background containing a single high-contrast call-to-action (CTA): **"⚡ Secure Order via Guma Kart"**.

### C. The Localized One-Page Mobile Checkout (Webview)

| Form Section | UI Elements & Spacing | Localized Design Guardrails (Philippines) |
| :--- | :--- | :--- |
| **1. Order Review** | Top horizontal banner. Thumbnail image (left), product metadata + price (right). | Keep typography stark, bold, and highly distinct using fonts like *Inter* or *Plus Jakarta Sans*. |
| **2. Shipping Matrix** | Standard alphanumeric text boxes for Name and Phone Number. **Strict Dropdown Selectors for Address.** | **Critical:** Do not use Zip Code lookups as mandatory gates. Provide chained dropdown structures: *Region ➡️ Province ➡️ City/Municipality ➡️ Barangay*. This reduces delivery failure rates for BayanGo riders. |
| **3. Integrated Payment** | High-contrast radio button cards using official brand identifiers. | **GCash** (Vibrant Brand Blue), **Maya** (Dynamic Green), and **Cash on Delivery (COD)**. Display a clear warning micro-copy if COD incurs an extra handling fee. |
| **4. Final Execution** | Sticky bottom floating button bar. | Fixed label: **"Confirm Payment & Delivery via BayanGo"**. |

### D. Post-Purchase Fulfillment Screen
* **BayanGo Active Tracker Tracker:** Horizontal timeline block showing clear progression steps:
  `Order Locked ➡️ Packing ➡️ Handed to BayanGo Rider ➡️ Out for Delivery ➡️ Arrived`
* **Retention Utility:** Sticky secondary action button: **"Chat with Seller on Messenger"** to keep the core connection open if delivery inquiries surface.

---

## 3. Philippine Localization Design Directives

1. **Mobile Data Conservation Optimization:** The checkout webview must minimize complex external asset dependency. Many buyers navigate through low-tier mobile promos or limited free data allowances. Avoid videos, parallax animations, or heavy graphic assets.
2. **Mobile Number Over Email:** Make SMS/Mobile Phone the primary index and account identifier key. Most micro-merchants and buyers in the region communicate via mobile messaging channels rather than tracking email boxes.
3. **Transparent Delivery Fee Disclosures:** Clearly separate the product cost from the dynamic **BayanGo** shipping quote before the final CTA button to prevent abandoned checkouts at the payment stage.