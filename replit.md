# EstZone Premium Gaming E-Commerce

## Overview

EstZone is a bilingual (English/Estonian) e-commerce platform specializing in premium gaming products, including consoles, VR headsets, controllers, and accessories. It offers a modern storefront with a comprehensive product catalog, shopping cart, secure checkout, blog functionality, and an AI-powered customer support chat. The platform aims to provide a seamless shopping experience for gamers, supported by robust payment and shipping integrations.

## User Preferences

Preferred communication style: Simple, everyday language.

### IMPORTANT: Header is LOCKED
The Header component (client/src/components/Header.tsx) is now perfect and should NOT be modified. Both desktop and mobile versions are finalized after extensive work. Any future changes should avoid touching the header unless absolutely critical.

## Environment Variables Needed

### Email Service (Resend)
To enable order confirmation emails, add `RESEND_API_KEY` secret. Without it, emails are logged to console only.

### Payment Gateways
- `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLIC_KEY` - For Stripe payments (configured)
- `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` - For PayPal payments (not configured)
- `MONTONIO_ACCESS_KEY` and `MONTONIO_SECRET_KEY` - For Montonio Baltic payments ✅ CONFIGURED & WORKING

## Production Hosting (December 2024)

**IMPORTANT: Production is hosted on Replit, NOT Railway**

- **Production URL**: https://estzone.eu (also https://www.estzone.eu)
- **Replit App**: gamer-grove--alexpaalberg.replit.app
- **DNS Provider**: Zone.ee

**DNS Configuration (Zone.ee)**:
- A record: estzone.eu → 34.111.179.208 (Replit)
- CNAME: www.estzone.eu → estzone.eu
- TXT: estzone.eu → replit-verify=8c0b613d-60b6-4712-8289-c7ea8c4b8bb9
- MX, NS, email TXT records: Untouched (for email delivery)

**Montonio Status**: ✅ FULLY WORKING in production mode with all Estonian banks (SEB, Swedbank, LHV, Luminor, Coop, Citadele, Revolut, N26)

### Montonio Payment Integration (December 2024)
**UPDATED: Now uses Montonio Stargate API (POST /api/orders)**

Full Montonio integration is implemented with all available payment methods:
- **Bank Payments**: SEB, Swedbank, LHV, Coop Pank, Luminor (paymentInitiation)
- **Card Payments**: Visa, Mastercard, American Express, Revolut (cardPayments)
- **Digital Wallets**: Apple Pay, Google Pay
- **Buy Now Pay Later**: BNPL options (min €75)
- **Financing**: Hire purchase for larger purchases (hirePurchase)

**API Configuration**:
- Production: `https://stargate.montonio.com/api`
- Sandbox: `https://sandbox-stargate.montonio.com/api`
- Orders created via POST to `/api/orders` with JWT payload containing full order data
- Response returns `paymentUrl` for customer redirect

Payment method types mapped to Montonio API: montonio_bank → paymentInitiation, montonio_card → cardPayments, montonio_bnpl → bnpl, montonio_financing → hirePurchase

Files: server/montonio.ts (backend), client/src/pages/Checkout.tsx (UI), client/src/components/Footer.tsx (payment logos)

### Payment Flow & Email Confirmation (December 2024)
**IMPORTANT**: Order confirmation emails are only sent AFTER successful payment confirmation, not at order creation.

**Flow for External Payments (Montonio, Stripe, PayPal, Paysera)**:
1. Order is created with paymentStatus='pending' 
2. Customer is redirected to external payment provider
3. Payment provider webhook confirms payment
4. Order status updated to 'processing' or 'completed', paymentStatus='completed'
5. Confirmation email sent to customer

**Webhook Endpoints**:
- `/api/payments/montonio/webhook` - Montonio payment notifications (JWT signature verified)
- `/api/payments/stripe/webhook` - Stripe payment events (signature verified via rawBody)

**Security**:
- Stripe checkout uses server-side order validation (amounts from database, not client)
- Montonio uses JWT signature verification with replay attack protection
- External payments skip email on order creation; webhooks handle email after confirmation

Files: server/routes.ts (order creation, stripe endpoint), server/montonio.ts (montonio webhook), server/utils/payments.ts (stripe webhook)

## System Architecture

### Frontend Architecture

The frontend is built with React 18 and TypeScript, using Vite for fast development and builds. Wouter handles client-side routing. UI components are developed using Shadcn/ui, based on Radix UI primitives, and styled with Tailwind CSS, following a "new-york" style dark theme with gold accents (hsl(43 90% 55%)). State management utilizes React Context API for global state (Language, Cart) and TanStack Query for server state and data fetching. Internationalization supports English and Estonian via a custom context-based system.

### Backend Architecture

The backend runs on Node.js with the Express framework, providing a RESTful JSON API. Data access is managed by Drizzle ORM for type-safe queries against a Neon serverless PostgreSQL database. Key routes include product catalog, categories, orders, blog, AI chat, and newsletter management. Session management uses Express sessions with PostgreSQL storage. File uploads are supported for product CSV import/export.

### Data Storage

The primary database is PostgreSQL (Neon serverless). The schema includes tables for users, categories (bilingual), products (bilingual descriptions, pricing, SKU, stock, multi-image), orders, order items, addresses, blog posts, newsletter subscribers, and support chat history. Key patterns include UUID primary keys, bilingual fields (En/Et suffixes), soft deletion, timestamps, and JSON columns for metadata.

### Authentication & Authorization

The platform uses Replit Auth for user authentication via OpenID Connect, allowing users to sign in with their Replit accounts. Session management uses Express sessions with PostgreSQL storage for persistence. Key features include:
- User profile management (first name, last name, profile image)
- Wishlist functionality with price and stock alerts
- Recurring orders for subscription-like purchases
- Compact header icons for login, wishlist, and account access

### PWA & Push Notifications

The platform includes full Progressive Web App (PWA) support and push notifications:
- **PWA Features**: Install prompt, offline caching via service worker, home screen icons (192x192, 512x512)
- **Push Subscriptions**: Users can subscribe to notifications from the footer bell icon
- **Notification Preferences**: Toggle per-category settings (new products, sales, wishlist alerts, order updates)
- **Admin Push Panel**: Send targeted notifications to all subscribers from /admin/push-notifications
- **Notification History**: Track all sent notifications with timestamps, titles, and recipient counts
- **VAPID Keys**: Web Push protocol uses VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VITE_VAPID_PUBLIC_KEY environment secrets
- Database tables: push_subscriptions, notification_history

### Loyalty & VIP System

The platform includes a comprehensive loyalty points and VIP tier system:
- **Points Earning**: 10 points per €1 spent (base rate), multiplied by tier bonus
- **Points Redemption**: 100 points = €1 discount at checkout via slider interface
- **Points Expiration**: 6-month expiration with 30-day warning, daily automated cleanup
- **VIP Tiers**: Bronze (€0+), Silver (€500+, 5% discount, 1.25x points), Gold (€1500+, 10% discount, 1.5x points)
- **LoyaltyCard Component**: Displays current tier, points balance, progress to next tier, expiring points warnings
- **Frequently Bought Together**: Shows bundle recommendations on product detail pages with "Add All to Cart"
- **Admin Loyalty Panel**: Manage users, view/adjust points, see transaction history, tier distribution, customer leaderboard (admin-only)
- Database tables: vip_tiers, user_loyalty, loyalty_transactions, frequently_bought_together

### Unified Financial Dashboard

The admin panel includes a comprehensive financial tracking system across all payment gateways:
- **KPI Cards**: Total Revenue, Refunds, Net Revenue, VAT Collected (24%), Transactions, Average Order Value
- **Revenue Trends**: Stacked area chart showing daily revenue breakdown by gateway (Stripe, PayPal, Montonio, Paysera)
- **Gateway Analytics**: Pie chart, bar chart, and detailed table comparing gateway performance
- **Transaction List**: Filterable by gateway and transaction type (payment/refund/chargeback) with customer details
- **Sync Functionality**: Import existing orders into the unified payment_transactions table
- Database tables: payment_transactions (unified tracking across all gateways)
- Access: Admin-only via /admin/finance

### Automated Flash Sales System

The platform includes an automated rotating flash sales system managed by the automation scheduler:
- **Rotation Cycle**: Every 4 days, new products are automatically selected for flash sales
- **Schedule**: Runs daily at 2 AM to check for expired discounts and apply new rotations
- **Product Selection**: 10-15 random eligible products (active, in stock, price > €10)
- **Discount Range**: Random discounts of 15%, 20%, 25%, or 30% applied
- **Auto-Cleanup**: Expired discounts are automatically cleared every day
- **Tracking**: Flash sale reports saved to AI reports system (flash-sale-latest, flash-sale-{date})
- **Fields Used**: Products use salePrice, discountPercent, discountStartDate, discountEndDate columns
- Access: Automation panel at /admin/automation, can be triggered manually

## Temporarily Hidden Campaign Products (Montonio Compliance)

**Date Hidden**: December 2, 2024
**Reason**: Montonio requested removal of campaign products from store

The following 50 campaign products are hidden (is_active = false) and can be restored by setting is_active = true for SKUs starting with 'DIG-':

### Console Gift Cards (11 products)
- DIG-PSN-10, DIG-PSN-25, DIG-PSN-50, DIG-PSN-100 (PlayStation Store €10-€100)
- DIG-XBX-10, DIG-XBX-25, DIG-XBX-50, DIG-XBX-100 (Xbox €10-€100)
- DIG-NIN-15, DIG-NIN-25, DIG-NIN-50 (Nintendo eShop €15-€50)

### Subscriptions (12 products)
- DIG-PSP-E1M, DIG-PSP-E3M, DIG-PSP-E12M (PS Plus Essential 1/3/12 months)
- DIG-PSP-X12M, DIG-PSP-P12M (PS Plus Extra/Premium 12 months)
- DIG-XGP-C1M, DIG-XGP-C12M (Xbox Game Pass Core 1/12 months)
- DIG-XGP-U1M, DIG-XGP-U3M (Xbox Game Pass Ultimate 1/3 months)
- DIG-NSO-1M, DIG-NSO-12M, DIG-NSO-F12M (Nintendo Online 1/12 months + Family)

### In-Game Currency (19 products)
- DIG-VBK-1K, DIG-VBK-2.8K, DIG-VBK-5K, DIG-VBK-13.5K (Fortnite V-Bucks)
- DIG-FCP-1K, DIG-FCP-2.2K, DIG-FCP-4.6K (EA Sports FC Points)
- DIG-COD-1.1K, DIG-COD-2.4K, DIG-COD-5K (Call of Duty Points)
- DIG-RBX-800, DIG-RBX-2K, DIG-RBX-4.5K (Roblox Robux)
- DIG-GEN-330, DIG-GEN-1090, DIG-GEN-3880 (Genshin Impact Genesis Crystals)
- DIG-MNC-320, DIG-MNC-1720, DIG-MNC-3500 (Minecraft Minecoins)

### PC & Universal (8 products)
- DIG-STM-10, DIG-STM-20, DIG-STM-50, DIG-STM-100 (Steam Wallet €10-€100)
- DIG-BNT-20, DIG-BNT-50 (Battle.net Balance €20/€50)
- DIG-EAP-1M, DIG-EAP-12M (EA Play 1/12 months)

**To restore**: Run SQL: `UPDATE products SET is_active = true WHERE sku LIKE 'DIG-%';`

## Future Features (Deferred)

- **Courier API Integration**: Automatic shipment creation via Omniva/DPD APIs (waiting for credentials)
- **Pre-order System**: For upcoming products (when needed)
- **Trade-in Program**: For used gaming equipment
- **Affiliate Program**: Partner/influencer referral system

## Payment Gateway Status

- **Stripe**: ✓ Configured and working
- **PayPal**: Pending - needs `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`
- **Montonio**: Pending - needs `MONTONIO_ACCESS_KEY` and `MONTONIO_SECRET_KEY`

### UI/UX Decisions

The design follows a "new-york" style variant with a dark theme featuring gold accents. Typography uses Montserrat for headings and Inter for UI elements. Custom utility classes enhance hover and active states. Mobile UI is optimized with improved navigation and component sizing.

## External Dependencies

-   **AI/Chat:** OpenAI GPT-5 API for the customer support chatbot.
-   **Payment Processors:**
    -   Stripe (`@stripe/stripe-js`, `@stripe/react-stripe-js`) for card payments.
    -   PayPal (`@paypal/paypal-server-sdk`).
    -   Montonio JWT-based payment gateway for the Baltic market.
    -   Paysera (stub implementation).
-   **Shipping Providers:** Omniva and DPD for parcel terminals and home delivery.
-   **Email Service:** Resend for transactional emails (order confirmations, newsletter) with bilingual HTML templates.
-   **Database:** Neon serverless PostgreSQL.
-   **UI Libraries:** Radix UI, Shadcn/ui, Tailwind CSS, Lucide React, react-icons.
-   **State & Data Management:** TanStack React Query, React Hook Form, Zod.
-   **Routing:** Wouter.