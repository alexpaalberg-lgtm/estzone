# EstZone Premium Gaming E-Commerce

## Overview

EstZone is a bilingual (English/Estonian) e-commerce platform for premium gaming products including consoles, VR headsets, controllers, and accessories. The application features a modern storefront with product catalog, shopping cart, checkout process, blog functionality, and AI-powered customer support chat.

**Key Features:**
- Bilingual product catalog with category-based browsing
- Shopping cart and multi-step checkout flow
- Payment integration support (Stripe and Paysera)
- Shipping integration support (Omniva and DPD)
- Blog/content management
- AI chatbot for customer support
- Product search and filtering
- Newsletter subscription

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 18 with TypeScript using Vite as the build tool

**Routing:** Wouter for client-side routing with path-based navigation

**UI Component System:** Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. The design follows a "new-york" style variant with a dark theme featuring gold accents (primary color: hsl(43 90% 55%)).

**State Management:**
- React Context API for global state (Language, Cart)
- TanStack Query (React Query) for server state and data fetching
- Local component state with React hooks

**Styling Approach:**
- Tailwind CSS with custom design tokens
- CSS variables for theming
- Custom utility classes for hover/active states (hover-elevate, active-elevate-2)
- Typography: Montserrat (headings), Inter (UI elements)

**Internationalization:**
- Custom context-based i18n system supporting English and Estonian
- Translation keys stored in `/client/src/lib/i18n.ts`
- Language detection for AI chat based on keyword matching

### Backend Architecture

**Runtime:** Node.js with Express framework

**API Design:** RESTful JSON API with resource-based endpoints under `/api/*` namespace

**Database Access:**
- Drizzle ORM for type-safe database queries
- Schema-first approach with TypeScript types generated from Drizzle schema
- Neon serverless PostgreSQL as the database provider

**Key Routes:**
- `/api/categories` - Category listing and retrieval
- `/api/products` - Product catalog with filtering (categoryId, featured, search)
- `/api/orders` - Order creation and management
- `/api/blog` - Blog post listing and retrieval
- `/api/chat` - AI-powered customer support (streaming responses)
- `/api/newsletter` - Newsletter subscription management

**Session Management:** Express sessions with PostgreSQL storage via connect-pg-simple

**File Uploads:** Product CSV import/export functionality for bulk operations

### Data Storage

**Database:** PostgreSQL (via Neon serverless)

**Schema Design:**
- Users/customers table with email-based identification
- Categories with bilingual support (nameEn, nameEt) and hierarchical structure via parentId
- Products linked to categories with bilingual descriptions, pricing (including sale prices), SKU management, stock tracking, and multi-image support
- Orders with comprehensive tracking (orderNumber, status, shipping/billing addresses, payment method)
- OrderItems as line items referencing products with pricing snapshot
- Addresses for customer shipping/billing information
- Blog posts with bilingual content and slug-based routing
- Newsletter subscribers
- Support sessions and messages for chat history

**Key Schema Patterns:**
- UUID primary keys using `gen_random_uuid()`
- Bilingual fields consistently suffixed with En/Et
- Soft deletion support via isActive flags
- Timestamp tracking (createdAt, updatedAt)
- JSON columns for flexible metadata storage

### Authentication & Authorization

**Current Implementation:** Minimal authentication - session-based user tracking without password authentication

**Planned:** The structure supports future implementation of proper user authentication with email/password or OAuth providers

### External Service Integrations

**AI/Chat:** OpenAI GPT-5 API for customer support chatbot with streaming responses and language detection

**Payment Processors:**
- Stripe integration via `@stripe/stripe-js` and `@stripe/react-stripe-js`
- Paysera payment gateway support (stub implementation for Estonian market)

**Shipping Providers:**
- Omniva parcel terminals and courier (Estonian/Baltic shipping)
- DPD pickup points and home delivery

**Email Service:** Placeholder email service (MockEmailService) ready for SendGrid or Resend integration for order confirmations and newsletter management

### Build & Deployment

**Development:** Vite dev server with HMR, proxy middleware for API requests, and Replit-specific plugins (cartographer, dev banner, runtime error overlay)

**Production Build:**
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles Express server to `dist/index.js` as ESM
- Database migrations: Drizzle Kit for schema changes

**Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - For AI chat functionality
- Payment provider credentials (Stripe, Paysera)

### External Dependencies

**Core Framework:**
- React 18 with TypeScript
- Express.js for API server
- Vite for development and build tooling

**Database & ORM:**
- Drizzle ORM with drizzle-kit for migrations
- @neondatabase/serverless for PostgreSQL connection pooling
- Neon serverless PostgreSQL database

**UI Libraries:**
- Radix UI component primitives (@radix-ui/react-*)
- Tailwind CSS for styling
- Lucide React for icons
- react-icons for brand icons (payment methods)

**State & Data Management:**
- TanStack React Query for server state
- React Hook Form with Zod validation
- Wouter for routing

**Payment Processing:**
- Stripe (@stripe/stripe-js, @stripe/react-stripe-js)
- Paysera (custom integration)

**AI & Chat:**
- OpenAI SDK for GPT-5 API access
- Streaming chat responses with Server-Sent Events pattern

**Utilities:**
- date-fns for date formatting
- clsx and tailwind-merge for className handling
- zod for runtime type validation
- nanoid for ID generation

**Development Tools:**
- TypeScript for type safety
- ESBuild for server bundling
- PostCSS with Autoprefixer
- Replit-specific Vite plugins for development experience