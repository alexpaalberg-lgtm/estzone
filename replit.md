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
- **Points Earning**: 10 points per €1 spent (base rate)
- **Points Redemption**: 100 points = €1 discount
- **VIP Tiers**: Bronze (€0+), Silver (€500+, 5% discount, 1.25x points), Gold (€1500+, 10% discount, 1.5x points)
- **LoyaltyCard Component**: Displays current tier, points balance, progress to next tier
- **Frequently Bought Together**: Tracks products purchased together for recommendations
- Database tables: vip_tiers, user_loyalty, loyalty_transactions, frequently_bought_together

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