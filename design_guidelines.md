# EstZone Premium Gaming E-Commerce - Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based E-commerce  
**Primary References:** Razer.com, Apple Store, high-end gaming retailers  
**Design Principles:** 
- Luxury through restraint and precision
- Product-hero photography dominates
- Sophisticated spatial hierarchy
- Seamless bilingual experience

## Typography

**Primary Typeface:** Montserrat (via Google Fonts)
- H1: 700 weight, tracking-tight, uppercase for hero statements
- H2: 700 weight, for category headers and product names  
- H3: 600 weight, for section titles
- Body: 400 weight, line-height relaxed for readability
- Accent: 500 weight for CTAs, prices, badges

**Secondary Typeface:** Inter (via Google Fonts)
- UI elements, form labels, navigation
- 400 weight for body, 500 for emphasis

## Layout System

**Spacing Primitives:** Tailwind units of 4, 6, 8, 12, 16, 20, 24  
- Section padding: py-16 to py-24 desktop, py-12 mobile
- Card padding: p-6 to p-8
- Component gaps: gap-6 for grids, gap-8 for section spacing
- Button padding: px-8 py-4 for primary CTAs

**Grid Strategy:**
- Product grids: 4 columns (lg), 3 columns (md), 2 columns (sm), 1 column (base)
- Max-width containers: max-w-7xl for main content, max-w-4xl for centered forms
- Asymmetric layouts for visual interest in promotional sections

## Component Library

### Navigation Header
- Sticky, backdrop-blur with subtle border-bottom
- Three-tier structure: Top bar (language switch, account), Main nav (logo left, categories center, search/cart right), Category mega-menu
- Logo: Prominent, proportional sizing (h-12 desktop, h-10 mobile)
- Icons: Heroicons (outline style), 24px minimum touch target
- Mobile: Full-screen overlay menu with category expansion

### Hero Section  
- Full-width, 85vh height on desktop, 70vh mobile
- High-impact product photography with dramatic lighting
- Content zone: max-w-2xl, positioned left-third of viewport
- Typography hierarchy: Overline tag, massive headline (text-6xl to text-7xl), supporting paragraph, dual-CTA layout
- CTAs: Primary button with backdrop-blur-md, secondary button outline
- Carousel: 3 hero slides with dot navigation, auto-rotate 6s intervals

### Product Grid
- Cards with hover elevation: translate-y-[-4px] transition
- Image container: aspect-square, object-cover with subtle border
- Quick-view overlay on hover with magnifying glass icon
- Product info stack: Name (font-semibold, text-lg), price (text-2xl, font-bold), stock badge
- Badge positioning: Absolute top-right (8px offset) for "New" or sale percentages
- Add to Cart: Full-width primary button, Wishlist: Icon-only top-left overlay

### Product Detail Page
- Two-column split: 58% image gallery, 42% product details
- Image gallery: Main image with 4-image thumbnail strip below, lightbox zoom on click
- Details sidebar: Breadcrumb nav, product name (text-4xl), star rating, price (text-5xl), stock status with icon
- Quantity selector: Custom increment/decrement buttons
- Large Add to Cart (h-14, full-width), secondary Wishlist button below
- Tabs: Description, Specifications (table layout), Reviews (5-star breakdown + list)
- Related products: horizontal scroll carousel, 5 items visible

### Shopping Cart
- Slide-in drawer from right, w-[480px] max-width, full-height
- Item rows: Thumbnail (80px square), details flex-column, quantity controls, remove icon
- Sticky footer: Subtotal breakdown, shipping estimate, checkout CTA (h-14)
- Empty state: Illustration placeholder, "Start Shopping" CTA, recommended products grid

### Checkout Flow  
- Multi-step: Progress stepper (Shipping → Payment → Review)
- Single-column form: max-w-2xl centered, grouped field sections
- Shipping methods: Radio cards with provider logos (Omniva/DPD), delivery time, cost
- Payment: Large card-style selection (Stripe/Paysera logos, 140px height each)
- Order summary: Sticky sidebar on desktop (w-96), collapses to accordion mobile
- Trust indicators: Security badge, encrypted notice near payment

### Category Landing Pages
- Hero banner: 50vh, category-specific imagery, centered headline + description
- Filter sidebar: 240px width, collapsible mobile, checkbox groups with counts
- Sort dropdown: Top-right above grid, clean select styling
- Pagination: Centered below grid, numbered + prev/next arrows

### Blog Section
- Grid layout: Featured post (2-column span), 3-column grid for recent posts  
- Post cards: Image (16:9 aspect), category pill, headline (text-xl font-bold), excerpt (2 lines), meta (read time, date)
- Single post: Hero image (full-width, 400px height), content (max-w-3xl centered, prose styling), social share sidebar

### Footer
- Five-column grid: Product Categories, Support, Company Info, Newsletter, Legal
- Newsletter: Heading, email input with inline submit button (h-12)
- Provider logos: Payment (Stripe, Paysera) and shipping (Omniva, DPD) in 2x2 grid
- Social icons: 40px circular buttons, gap-4 spacing
- Language toggle: EN/EST flags, 32px each, toggle interaction
- Bottom bar: Copyright, terms links

### Account Dashboard
- Sidebar navigation: 240px width, icon + label links
- Main sections: Orders table (status badges, tracking), Wishlist grid (mini product cards), Profile form, Saved addresses
- Order detail: Timeline visualization, item list, delivery tracking map integration

## Images

**Hero Banners:** 3 high-impact images
1. PS5 console in luxurious gaming setup with ambient lighting (1920x1080px)
2. Premium gaming headset close-up with dramatic shadows (1920x1080px)  
3. VR headset in use, immersive experience shot (1920x1080px)

**Product Photography:** High-resolution on seamless backgrounds, multiple angles per SKU (front, 45°, detail shots). Minimum 1500x1500px for zoom capability.

**Category Banners:** Dynamic product compositions with motion blur or action elements. 1600x800px, placed as full-width headers.

**Blog/News:** Gaming event coverage, product launch imagery, esports scenes. 1200x675px aspect ratio.

**Lifestyle Shots:** Gaming setups, unboxing moments, peripheral collections for promotional sections.

## Key Interactions

**Purposeful Animations Only:**
- Product card hover: Subtle lift with shadow expansion (300ms ease)
- Add to cart: Button scale pulse (150ms), success checkmark micro-animation
- Cart icon: Badge number pop (scale) when item added
- Image galleries: Crossfade transitions (400ms)
- Form validation: Shake animation on error fields

**Mobile Optimizations:**
- Sticky bottom bar: Home, Categories, Search, Cart icons (h-16)
- Touch-friendly product cards: Minimum 120px height
- Horizontal scroll product carousels with snap-scroll
- Single-column checkout with progress dots instead of stepper
- Collapsible filter panels with slide-down animation

## Accessibility

- Minimum contrast ratios throughout
- Focus indicators: 2px offset ring on all interactive elements
- Keyboard shortcuts: "/" for search, ESC for modals
- ARIA labels: Cart count, wishlist status, stock availability
- Form errors: Icon + text description
- Language switcher: Accessible name, lang attributes update

## Special Features

**Bilingual Implementation:**
- Language switcher: Top-right header, flag icons (32px) with labels
- Persistent selection via localStorage
- Content translation: All UI strings, product descriptions, URLs localized
- Currency display: EUR symbol, Estonian/English formatting

**Trust & Conversion Elements:**
- Free shipping threshold bar (e.g., "Add €25 more for free shipping")
- Stock scarcity: "Only 3 left" with pulsing dot indicator
- Review aggregation: Star rating visible on all product cards
- Secure checkout badges: Near payment section, 60px height
- Recently viewed: Bottom of pages, horizontal scroll carousel

**Premium Details:**
- Product comparison tool: Checkbox selection, side-by-side table view
- Size/spec guides: Modal overlays with detailed charts
- Gift wrapping option: Checkbox at cart with preview image
- Loyalty program indicator: Points display in account header
- Wishlist sharing: Generate shareable link functionality

This creates a sophisticated, conversion-optimized gaming e-commerce experience that balances luxury aesthetics with exceptional usability across both languages and all devices.