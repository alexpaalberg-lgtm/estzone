# Gaming Console & Accessories E-Commerce Store - Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based with E-commerce Best Practices  
**Primary References:** Razer.com, premium gaming retailers, Shopify gaming stores  
**Aesthetic:** Premium gaming experience with black and gold color scheme (luxury tech aesthetic)

**Key Principles:**
- High-impact product presentation with large, detailed imagery
- Premium gaming aesthetic balancing sophistication with energy
- Clear conversion paths throughout the experience
- Mobile-first responsive design

## Core Design Elements

### Typography
- **Headings:** Bold, modern sans-serif (Montserrat Bold, Rajdhani Bold)  
  - H1: Bold, uppercase for hero/category titles
  - H2/H3: Strong weight for section headers and product names
- **Body:** Clean sans-serif (Inter, Open Sans) for readability
  - Regular weight for descriptions
  - Medium weight for CTAs and emphasis
- **Accent:** Consider tech-inspired font for special offers/badges

### Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16  
- Consistent padding: p-4/p-6 for cards, p-8/p-12 for sections
- Button spacing: px-6 py-3 for primary actions
- Grid gaps: gap-4 for tight grids, gap-6/gap-8 for product grids

**Container Strategy:**
- Max-width: max-w-7xl for main content
- Full-width hero and category banners
- Product grids: 4 columns desktop, 2 tablet, 1 mobile

### Component Library

**Navigation:**
- Sticky header with transparent-to-solid scroll transition
- Logo left, main nav center, cart/account/language right
- Mega-menu dropdown for product categories (Consoles, Controllers, Headsets, Accessories)
- Search bar prominent in header
- Mobile: Hamburger menu with slide-out drawer

**Hero Banner:**
- Full-width, 70vh minimum height
- High-quality gaming lifestyle imagery or console product shots
- Centered content with large headline, supporting text, dual CTAs
- Rotating carousel for multiple special offers (3-5 slides max)
- CTAs with blurred glass-morphism background for legibility
- Include promotional badge/timer for limited offers

**Product Grid:**
- Cards with hover lift effect (subtle shadow increase)
- Product image dominates (3:4 aspect ratio)
- Quick-view icon overlay on hover
- Product name, price, stock indicator
- Add to cart button (primary) and wishlist icon (secondary)
- "New Arrival" or "Sale" badges positioned top-right

**Product Detail Page:**
- Two-column: Image gallery left (60%), details right (40%)
- Gallery with main image + thumbnail strip below
- Zoom on hover/click for desktop, pinch-zoom mobile
- Breadcrumb navigation above
- Product name (large), price (prominent), stock status
- Quantity selector, Add to Cart (large primary button), Add to Wishlist
- Tabbed content below: Description, Specifications, Reviews
- Related products carousel at bottom

**Shopping Cart:**
- Slide-out drawer from right (overlay)
- Item rows with thumbnail, name, price, quantity controls, remove
- Subtotal, shipping estimate, total breakdown
- Dual CTAs: Continue Shopping (secondary), Checkout (primary)
- Empty state with suggested products

**Checkout Flow:**
- Multi-step with progress indicator (Shipping > Payment > Confirm)
- Single-column form layout, max-w-2xl centered
- Form sections with clear labels and validation
- Payment method selection: Stripe and Paysera logos as options
- Shipping method: Omniva/DPD with costs and delivery times
- Order summary sidebar (sticky on desktop)

**Customer Account:**
- Dashboard with sidebar navigation (Orders, Profile, Wishlist, Addresses)
- Order history table with status badges
- Order detail view with tracking information

**Blog Section:**
- Grid layout: Featured post (large card) + 3-column post grid
- Post cards with featured image, category tag, title, excerpt, read time
- Single post: Hero image, centered content (max-w-3xl), share buttons

**Footer:**
- Four-column grid: Categories, Support, Company, Newsletter
- Newsletter signup with email input + submit button
- Payment provider logos (Stripe, Paysera) and shipping badges (Omniva, DPD)
- Language switcher (EN/EST flags or text toggle)
- Social media icons

### Images

**Hero Banner:** Large, dramatic gaming console lifestyle images (e.g., PS5/Xbox setup in ambient lighting, gaming room with multiple screens). Multiple images for carousel rotation. Minimum 1920x1080px.

**Product Images:** High-resolution product photography on clean backgrounds. Multiple angles per product (front, back, side, in-use). Minimum 1200x1200px.

**Blog Headers:** Gaming news/review imagery, screenshots, or event photos. 1200x600px aspect ratio.

**Category Banners:** Featured console or accessory in dynamic composition. 1400x400px for desktop.

### Key Interactions

**Animations:** Minimal and purposeful only
- Hero slide transitions (fade or subtle slide)
- Product card hover lift (transform: translateY(-4px))
- Add to cart: Brief scale animation on button, item flies to cart icon
- Loading states: Skeleton screens for product grids

**Mobile Optimization:**
- Touch-friendly button sizes (min 44x44px)
- Swipeable product image galleries
- Sticky "Add to Cart" bar on product pages
- Simplified checkout form with smart field types
- Bottom navigation for key actions (Home, Cart, Account, Search)

### Accessibility
- High contrast text throughout
- Focus states on all interactive elements
- ARIA labels for icons and image content
- Keyboard navigation support
- Form validation with clear error messages
- Language switcher accessible via keyboard

### Special Features
- **Stock Indicators:** Visual badges (In Stock - green accent, Low Stock - amber accent, Out of Stock - muted)
- **Promotional Elements:** Countdown timers for limited offers, percentage-off badges
- **Trust Signals:** Security badges near checkout, customer review stars, free shipping threshold indicator
- **Bilingual Toggle:** Prominent EN/EST switcher in header, persists across sessions

This design creates a premium, trustworthy gaming e-commerce experience that showcases products beautifully while maintaining clear conversion paths and excellent usability across all devices.