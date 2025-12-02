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
- `MONTONIO_ACCESS_KEY` and `MONTONIO_SECRET_KEY` - For Montonio Baltic payments (not configured)

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

## Temporarily Hidden Products (Montonio Compliance)

**Date Hidden**: December 2, 2024
**Reason**: Montonio requested removal of digital content from store

The following 50 digital products are hidden (is_active = false) and can be restored by setting is_active = true for SKUs starting with 'DIG-':

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

- **Merge & Fan Products**: New category for merchandise and fan items
- **Seasonal Themes**: Christmas/holiday themes with special discounts (temporary visual changes)
- **Courier API Integration**: Automatic shipment creation via Omniva/DPD APIs (waiting for credentials)
- **Pre-order System**: For upcoming products (when needed)
- **Trade-in Program**: For used gaming equipment

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