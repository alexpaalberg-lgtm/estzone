import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, numeric, boolean, timestamp, json, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users/Customers (Updated for Replit Auth + Email/Password)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  profileImageUrl: varchar("profile_image_url"),
  authProvider: varchar("auth_provider").default('replit'),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;

// Categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nameEn: text("name_en").notNull(),
  nameEt: text("name_et").notNull(),
  slug: text("slug").notNull().unique(),
  descriptionEn: text("description_en"),
  descriptionEt: text("description_et"),
  parentId: varchar("parent_id"),
  sortOrder: integer("sort_order").default(0),
});

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  nameEn: text("name_en").notNull(),
  nameEt: text("name_et").notNull(),
  descriptionEn: text("description_en"),
  descriptionEt: text("description_et"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  sku: text("sku").notNull().unique(),
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  images: text("images").array(),
  videoUrl: text("video_url"),
  isNew: boolean("is_new").default(false),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  metaKeywords: text("meta_keywords"),
  discountPercent: integer("discount_percent"),
  discountStartDate: timestamp("discount_start_date"),
  discountEndDate: timestamp("discount_end_date"),
  deliveryDaysMin: integer("delivery_days_min").default(2),
  deliveryDaysMax: integer("delivery_days_max").default(4),
  stockStatus: text("stock_status").default('in_stock'),
  // GOE Supplier Integration
  goePartNo: text("goe_part_no"), // GOE article number (e.g., NS000491)
  goePrice: decimal("goe_price", { precision: 10, scale: 2 }), // GOE wholesale price in EUR
  goeStock: integer("goe_stock").default(0), // GOE available stock
  ownStock: integer("own_stock").default(0), // Our own warehouse stock
  ean: text("ean"), // EAN/barcode
  supplierSource: text("supplier_source"), // 'goe', 'other', null for manual
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wishlists (must be defined after products for foreign key reference)
export const wishlists = pgTable("wishlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  notifyOnSale: boolean("notify_on_sale").default(true),
  notifyOnRestock: boolean("notify_on_restock").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recurring Orders (must be defined after products for foreign key reference)
export const recurringOrders = pgTable("recurring_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  frequencyDays: integer("frequency_days").notNull().default(30),
  nextOrderDate: timestamp("next_order_date").notNull(),
  isActive: boolean("is_active").default(true),
  lastOrderId: varchar("last_order_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Addresses
export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  street: text("street").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default('Estonia'),
  phone: text("phone"),
  isDefault: boolean("is_default").default(false),
});

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default('pending'), // pending, paid, processing, shipped, delivered, cancelled
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default('0'),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default('EUR'), // EUR or USD
  
  // Shipping info
  shippingMethod: text("shipping_method").notNull(), // omniva, dpd
  shippingFirstName: text("shipping_first_name").notNull(),
  shippingLastName: text("shipping_last_name").notNull(),
  shippingStreet: text("shipping_street").notNull(),
  shippingCity: text("shipping_city").notNull(),
  shippingPostalCode: text("shipping_postal_code").notNull(),
  shippingCountry: text("shipping_country").notNull(),
  shippingPhone: text("shipping_phone"),
  trackingNumber: text("tracking_number"),
  
  // Payment info
  paymentMethod: text("payment_method").notNull(), // stripe, paypal, paysera, montonio
  paymentStatus: text("payment_status").notNull().default('pending'), // pending, completed, failed
  paymentId: text("payment_id"),
  
  // Customer info (for guest checkout)
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name"),
  
  // Discount/Coupon info
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0'),
  couponCode: text("coupon_code"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Order Items
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: varchar("product_id").notNull().references(() => products.id),
  productNameEn: text("product_name_en").notNull(),
  productNameEt: text("product_name_et").notNull(),
  sku: text("sku").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
});

// Blog Posts
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  titleEn: text("title_en").notNull(),
  titleEt: text("title_et").notNull(),
  slug: text("slug").notNull().unique(),
  contentEn: text("content_en").notNull(),
  contentEt: text("content_et").notNull(),
  excerptEn: text("excerpt_en"),
  excerptEt: text("excerpt_et"),
  featuredImage: text("featured_image"),
  categoryTag: text("category_tag"),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Newsletter Subscribers
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  isActive: boolean("is_active").default(true),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
});

// AI Support Chat Sessions
export const supportSessions = pgTable("support_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  language: text("language").notNull().default('en'), // 'en' or 'et'
  languageConfidence: decimal("language_confidence", { precision: 3, scale: 2 }).default('0'), // 0-1
  sessionTopic: text("session_topic"), // Auto-detected topic summary
  assistantModel: text("assistant_model").default('gpt-5'), // OpenAI model used
  metadata: json("metadata"), // For storing persona name and other session data
  isActive: boolean("is_active").default(true),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AI Support Chat Messages
export const supportMessages = pgTable("support_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => supportSessions.id, { onDelete: 'cascade' }),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  metadata: json("metadata"), // For storing product IDs, order numbers, etc that were referenced
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Return/Refund Requests
export const returnRequests = pgTable("return_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  orderNumber: text("order_number").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name"),
  reason: text("reason").notNull(), // 'defective', 'wrong_item', 'changed_mind', 'not_as_described', 'other'
  description: text("description"),
  status: text("status").notNull().default('pending'), // 'pending', 'approved', 'rejected', 'completed', 'refunded'
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  refundMethod: text("refund_method"), // 'original_payment', 'store_credit', 'bank_transfer'
  replacementOrderId: varchar("replacement_order_id"),
  processedBy: text("processed_by"), // 'ai_assistant' or admin email
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Stock Alerts (for low stock notifications)
export const stockAlerts = pgTable("stock_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  alertType: text("alert_type").notNull(), // 'low_stock', 'out_of_stock', 'restock_needed'
  currentStock: integer("current_stock").notNull(),
  threshold: integer("threshold").notNull(),
  isResolved: boolean("is_resolved").default(false),
  supplierNotified: boolean("supplier_notified").default(false),
  supplierNotifiedAt: timestamp("supplier_notified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Supplier Messages (for automated restock requests)
export const supplierMessages = pgTable("supplier_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierEmail: text("supplier_email").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  productIds: text("product_ids").array(),
  messageType: text("message_type").notNull(), // 'restock_request', 'inquiry', 'order_confirmation'
  status: text("status").notNull().default('pending'), // 'pending', 'sent', 'failed'
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Saved Carts (for sharing cart links)
export const savedCarts = pgTable("saved_carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shareCode: text("share_code").notNull().unique(),
  items: json("items").notNull(), // Array of {productId, quantity, price}
  customerEmail: text("customer_email"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Coupons (discount codes)
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  descriptionEn: text("description_en"),
  descriptionEt: text("description_et"),
  discountPercent: integer("discount_percent").notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  isActive: boolean("is_active").default(true),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Coupon Usage (track who used which coupon)
export const couponUsage = pgTable("coupon_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  couponId: varchar("coupon_id").notNull().references(() => coupons.id, { onDelete: 'cascade' }),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  customerEmail: text("customer_email").notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

// AI Reports (daily AI-generated business reports)
export const aiReports = pgTable("ai_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull().unique(), // YYYY-MM-DD format
  reportData: json("report_data").notNull(), // Full report JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  createdAt: true,
});
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type Wishlist = typeof wishlists.$inferSelect;

export const insertRecurringOrderSchema = createInsertSchema(recurringOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRecurringOrder = z.infer<typeof insertRecurringOrderSchema>;
export type RecurringOrder = typeof recurringOrders.$inferSelect;

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.string().or(z.number()),
  salePrice: z.string().or(z.number()).optional(),
  videoUrl: z.string().optional(),
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const insertAddressSchema = createInsertSchema(addresses).omit({
  id: true,
});
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addresses.$inferSelect;

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  subtotal: z.string().or(z.number()),
  shippingCost: z.string().or(z.number()),
  tax: z.string().or(z.number()).optional(),
  total: z.string().or(z.number()),
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
}).extend({
  price: z.string().or(z.number()),
  subtotal: z.string().or(z.number()),
});
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  subscribedAt: true,
});
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

export const insertSupportSessionSchema = createInsertSchema(supportSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSupportSession = z.infer<typeof insertSupportSessionSchema>;
export type SupportSession = typeof supportSessions.$inferSelect;

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type SupportMessage = typeof supportMessages.$inferSelect;

export const insertReturnRequestSchema = createInsertSchema(returnRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertReturnRequest = z.infer<typeof insertReturnRequestSchema>;
export type ReturnRequest = typeof returnRequests.$inferSelect;

export const insertStockAlertSchema = createInsertSchema(stockAlerts).omit({
  id: true,
  createdAt: true,
});
export type InsertStockAlert = z.infer<typeof insertStockAlertSchema>;
export type StockAlert = typeof stockAlerts.$inferSelect;

export const insertSupplierMessageSchema = createInsertSchema(supplierMessages).omit({
  id: true,
  createdAt: true,
});
export type InsertSupplierMessage = z.infer<typeof insertSupplierMessageSchema>;
export type SupplierMessage = typeof supplierMessages.$inferSelect;

export const insertSavedCartSchema = createInsertSchema(savedCarts).omit({
  id: true,
  createdAt: true,
});
export type InsertSavedCart = z.infer<typeof insertSavedCartSchema>;
export type SavedCart = typeof savedCarts.$inferSelect;

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  usedCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  minOrderAmount: z.string().or(z.number()).optional(),
  discountPercent: z.number().min(1).max(100),
});
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;

export const insertCouponUsageSchema = createInsertSchema(couponUsage).omit({
  id: true,
  usedAt: true,
}).extend({
  discountAmount: z.string().or(z.number()),
});
export type InsertCouponUsage = z.infer<typeof insertCouponUsageSchema>;
export type CouponUsage = typeof couponUsage.$inferSelect;

// Product Reviews
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  comment: text("comment"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  isApproved: boolean("is_approved").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
}).extend({
  rating: z.number().min(1).max(5),
});

// Separate schema for updates that allows isApproved
export const updateReviewSchema = z.object({
  isApproved: z.boolean().optional(),
  title: z.string().optional(),
  comment: z.string().optional(),
});
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Gift Cards
export const giftCards = pgTable("gift_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 20 }).notNull().unique(),
  initialValue: decimal("initial_value", { precision: 10, scale: 2 }).notNull(),
  currentBalance: decimal("current_balance", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default('EUR'),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdByAdminId: varchar("created_by_admin_id"),
  usedByUserId: varchar("used_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGiftCardSchema = createInsertSchema(giftCards).omit({
  id: true,
  currentBalance: true,
  createdAt: true,
});
export type InsertGiftCard = z.infer<typeof insertGiftCardSchema>;
export type GiftCard = typeof giftCards.$inferSelect;

// Gift Card Transactions
export const giftCardTransactions = pgTable("gift_card_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  giftCardId: varchar("gift_card_id").notNull().references(() => giftCards.id),
  orderId: varchar("order_id").references(() => orders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  transactionType: text("transaction_type").notNull(), // 'use' or 'refund'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGiftCardTransactionSchema = createInsertSchema(giftCardTransactions).omit({
  id: true,
  createdAt: true,
});
export type InsertGiftCardTransaction = z.infer<typeof insertGiftCardTransactionSchema>;
export type GiftCardTransaction = typeof giftCardTransactions.$inferSelect;

// ============================================
// LOYALTY & VIP SYSTEM
// ============================================

// VIP Tiers configuration
export const vipTiers = pgTable("vip_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 50 }).notNull().unique(), // bronze, silver, gold
  nameEn: varchar("name_en", { length: 100 }).notNull(),
  nameEt: varchar("name_et", { length: 100 }).notNull(),
  minSpend: decimal("min_spend", { precision: 10, scale: 2 }).notNull(), // Minimum total spend to reach tier
  discountPercent: integer("discount_percent").notNull().default(0), // Permanent discount for this tier
  pointsMultiplier: decimal("points_multiplier", { precision: 3, scale: 2 }).notNull().default('1.00'), // Points earning multiplier
  color: varchar("color", { length: 20 }).default('#CD7F32'), // Display color (bronze, silver, gold hex)
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
});

export const insertVipTierSchema = createInsertSchema(vipTiers).omit({
  id: true,
});
export type InsertVipTier = z.infer<typeof insertVipTierSchema>;
export type VipTier = typeof vipTiers.$inferSelect;

// User Loyalty tracking
export const userLoyalty = pgTable("user_loyalty", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  currentPoints: integer("current_points").notNull().default(0),
  lifetimePoints: integer("lifetime_points").notNull().default(0), // Total points ever earned
  totalSpend: decimal("total_spend", { precision: 10, scale: 2 }).notNull().default('0.00'),
  currentTierId: varchar("current_tier_id").references(() => vipTiers.id),
  tierUpdatedAt: timestamp("tier_updated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserLoyaltySchema = createInsertSchema(userLoyalty).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUserLoyalty = z.infer<typeof insertUserLoyaltySchema>;
export type UserLoyalty = typeof userLoyalty.$inferSelect;

// Loyalty Points Transactions (earn/spend history)
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  orderId: varchar("order_id").references(() => orders.id),
  points: integer("points").notNull(), // Positive for earned, negative for spent
  type: varchar("type", { length: 20 }).notNull(), // 'earned', 'redeemed', 'expired', 'bonus', 'adjustment'
  description: text("description"),
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  expiresAt: timestamp("expires_at"), // Points expire 6 months after earning
  isExpired: boolean("is_expired").default(false), // Flag when points have been expired
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({
  id: true,
  createdAt: true,
});
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;

// Frequently Bought Together (for product recommendations)
export const frequentlyBoughtTogether = pgTable("frequently_bought_together", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  relatedProductId: varchar("related_product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  purchaseCount: integer("purchase_count").notNull().default(1), // How many times bought together
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFrequentlyBoughtTogetherSchema = createInsertSchema(frequentlyBoughtTogether).omit({
  id: true,
  updatedAt: true,
});
export type InsertFrequentlyBoughtTogether = z.infer<typeof insertFrequentlyBoughtTogetherSchema>;
export type FrequentlyBoughtTogether = typeof frequentlyBoughtTogether.$inferSelect;

// Payment Transactions - Unified view of all payment gateway activities
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  externalId: varchar("external_id"), // Stripe charge ID, PayPal transaction ID, etc.
  gateway: varchar("gateway", { length: 20 }).notNull(), // 'stripe', 'paypal', 'montonio', 'paysera'
  type: varchar("type", { length: 20 }).notNull(), // 'payment', 'refund', 'payout', 'fee', 'chargeback'
  status: varchar("status", { length: 20 }).notNull(), // 'pending', 'completed', 'failed', 'cancelled'
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(), // Original amount
  currency: varchar("currency", { length: 3 }).notNull().default('EUR'),
  amountEur: numeric("amount_eur", { precision: 10, scale: 2 }).notNull(), // Normalized to EUR
  fee: numeric("fee", { precision: 10, scale: 2 }).default('0.00'), // Gateway fee
  netAmount: numeric("net_amount", { precision: 10, scale: 2 }), // Amount after fees
  vatAmount: numeric("vat_amount", { precision: 10, scale: 2 }).default('0.00'), // VAT collected
  exchangeRate: numeric("exchange_rate", { precision: 10, scale: 6 }).default('1.000000'),
  customerEmail: varchar("customer_email"),
  customerName: varchar("customer_name"),
  description: text("description"),
  metadata: jsonb("metadata"), // Additional gateway-specific data
  processedAt: timestamp("processed_at"), // When gateway processed it
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
});
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;

// Daily Financial Summaries - Cached rollups for faster dashboard loading
export const financialDailySummaries = pgTable("financial_daily_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  gateway: varchar("gateway", { length: 20 }).notNull(), // 'stripe', 'paypal', 'montonio', 'paysera', 'all'
  totalRevenue: numeric("total_revenue", { precision: 12, scale: 2 }).notNull().default('0.00'),
  totalRefunds: numeric("total_refunds", { precision: 12, scale: 2 }).notNull().default('0.00'),
  totalFees: numeric("total_fees", { precision: 12, scale: 2 }).notNull().default('0.00'),
  netRevenue: numeric("net_revenue", { precision: 12, scale: 2 }).notNull().default('0.00'),
  totalVat: numeric("total_vat", { precision: 12, scale: 2 }).notNull().default('0.00'),
  transactionCount: integer("transaction_count").notNull().default(0),
  orderCount: integer("order_count").notNull().default(0),
  averageOrderValue: numeric("average_order_value", { precision: 10, scale: 2 }).default('0.00'),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFinancialDailySummarySchema = createInsertSchema(financialDailySummaries).omit({
  id: true,
  updatedAt: true,
});
export type InsertFinancialDailySummary = z.infer<typeof insertFinancialDailySummarySchema>;
export type FinancialDailySummary = typeof financialDailySummaries.$inferSelect;

// ============================================
// SEASONAL THEMES SYSTEM
// ============================================

// Seasonal Themes - Automatic decoration and discount activation by date
export const seasonalThemes = pgTable("seasonal_themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(), // Internal name: "Christmas 2025", "Black Friday"
  nameEn: varchar("name_en", { length: 100 }).notNull(), // Display name in English
  nameEt: varchar("name_et", { length: 100 }).notNull(), // Display name in Estonian
  startDate: timestamp("start_date").notNull(), // When theme activates
  endDate: timestamp("end_date").notNull(), // When theme deactivates
  decorationType: varchar("decoration_type", { length: 50 }).notNull().default('christmas'), // 'christmas', 'halloween', 'easter', 'valentine', 'blackfriday', 'summer'
  primaryColor: varchar("primary_color", { length: 20 }).default('#DC2626'), // Theme accent color
  secondaryColor: varchar("secondary_color", { length: 20 }).default('#15803D'), // Secondary color
  showSnowflakes: boolean("show_snowflakes").default(false), // Falling snowflakes effect
  showConfetti: boolean("show_confetti").default(false), // Confetti celebration effect
  bannerTextEn: text("banner_text_en"), // Top banner message in English
  bannerTextEt: text("banner_text_et"), // Top banner message in Estonian
  bannerBgColor: varchar("banner_bg_color", { length: 20 }).default('#DC2626'),
  discountPercent: integer("discount_percent").default(0), // Store-wide discount during theme
  discountCategories: text("discount_categories").array(), // Specific category IDs to discount, null = all
  logoOverride: varchar("logo_override"), // Optional themed logo URL
  faviconOverride: varchar("favicon_override"), // Optional themed favicon
  isActive: boolean("is_active").default(true), // Can manually disable
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSeasonalThemeSchema = createInsertSchema(seasonalThemes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSeasonalTheme = z.infer<typeof insertSeasonalThemeSchema>;
export type SeasonalTheme = typeof seasonalThemes.$inferSelect;

// ============================================
// PUSH NOTIFICATIONS SYSTEM
// ============================================

// Push Subscriptions - Store user push notification subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Null for anonymous subscribers
  endpoint: text("endpoint").notNull().unique(), // Push service endpoint URL
  p256dh: text("p256dh").notNull(), // Public key for encryption
  auth: text("auth").notNull(), // Auth secret
  userAgent: text("user_agent"), // Browser/device info
  notifyNewProducts: boolean("notify_new_products").default(true),
  notifyPriceDrops: boolean("notify_price_drops").default(true),
  notifyWishlist: boolean("notify_wishlist").default(true),
  notifyOrders: boolean("notify_orders").default(true),
  notifyPromotions: boolean("notify_promotions").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Notification History - Track sent notifications
export const notificationHistory = pgTable("notification_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  url: varchar("url", { length: 500 }),
  type: varchar("type", { length: 50 }).notNull().default('general'), // 'new_product', 'price_drop', 'order_update', 'promotion', 'general'
  targetType: varchar("target_type", { length: 50 }).notNull().default('all'), // 'all', 'user', 'subscribers'
  targetUserId: varchar("target_user_id").references(() => users.id), // Specific user if targeted
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  sentBy: varchar("sent_by"), // Admin who sent it
});

export const insertNotificationHistorySchema = createInsertSchema(notificationHistory).omit({
  id: true,
  sentAt: true,
});
export type InsertNotificationHistory = z.infer<typeof insertNotificationHistorySchema>;
export type NotificationHistory = typeof notificationHistory.$inferSelect;

// ============================================
// PAGE VIEWS / TRAFFIC ANALYTICS
// ============================================

// Page Views - Track all website visits (100% accurate, server-side)
export const pageViews = pgTable("page_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id"), // Anonymous session tracking
  userId: varchar("user_id").references(() => users.id), // Logged in user (optional)
  path: text("path").notNull(), // URL path visited
  referrer: text("referrer"), // Where they came from
  userAgent: text("user_agent"), // Browser/device info
  ip: varchar("ip", { length: 45 }), // IPv4 or IPv6 (anonymized last octet)
  country: varchar("country", { length: 2 }), // Country code (EE, FI, etc)
  device: varchar("device", { length: 20 }), // 'mobile', 'tablet', 'desktop'
  browser: varchar("browser", { length: 50 }), // Browser name
  productId: varchar("product_id").references(() => products.id), // If viewing product page
  categoryId: varchar("category_id").references(() => categories.id), // If viewing category page
  duration: integer("duration"), // Time on page in seconds (updated on next pageview)
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_page_views_created_at").on(table.createdAt),
  index("idx_page_views_path").on(table.path),
  index("idx_page_views_session").on(table.sessionId),
  index("idx_page_views_device").on(table.device),
  index("idx_page_views_browser").on(table.browser),
  index("idx_page_views_product").on(table.productId),
  index("idx_page_views_category").on(table.categoryId),
]);

export const insertPageViewSchema = createInsertSchema(pageViews).omit({
  id: true,
  createdAt: true,
});
export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type PageView = typeof pageViews.$inferSelect;

// ============================================
// GOE SUPPLIER INTEGRATION
// ============================================

// GOE Import History - Track all imports from GOE stock files
export const goeImports = pgTable("goe_imports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name").notNull(),
  importType: text("import_type").notNull().default('full'), // 'full', 'stock_update', 'price_update'
  totalRows: integer("total_rows").default(0),
  newProducts: integer("new_products").default(0),
  updatedProducts: integer("updated_products").default(0),
  skippedProducts: integer("skipped_products").default(0),
  errors: text("errors").array(),
  status: text("status").notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  importedBy: varchar("imported_by"), // Admin user ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertGoeImportSchema = createInsertSchema(goeImports).omit({
  id: true,
  createdAt: true,
});
export type InsertGoeImport = z.infer<typeof insertGoeImportSchema>;
export type GoeImport = typeof goeImports.$inferSelect;

// GOE Category Mapping - Map GOE format codes to EstZone categories
export const goeCategoryMappings = pgTable("goe_category_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  goeFormat: text("goe_format").notNull().unique(), // GOE format code (NS, NSG, MER, ACC, etc.)
  categoryId: varchar("category_id").references(() => categories.id),
  defaultMarkup: decimal("default_markup", { precision: 5, scale: 2 }).default('2.0'), // Price multiplier (2.0 = 100% markup)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGoeCategoryMappingSchema = createInsertSchema(goeCategoryMappings).omit({
  id: true,
  createdAt: true,
});
export type InsertGoeCategoryMapping = z.infer<typeof insertGoeCategoryMappingSchema>;
export type GoeCategoryMapping = typeof goeCategoryMappings.$inferSelect;
