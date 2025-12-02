import { db } from './db';
import * as schema from '@shared/schema';
import type {
  User, InsertUser, UpsertUser,
  Product, InsertProduct,
  Category, InsertCategory,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  Address, InsertAddress,
  BlogPost, InsertBlogPost,
  NewsletterSubscriber, InsertNewsletterSubscriber,
  SupportSession, InsertSupportSession,
  SupportMessage, InsertSupportMessage,
  ReturnRequest, InsertReturnRequest,
  StockAlert, InsertStockAlert,
  SupplierMessage, InsertSupplierMessage,
  SavedCart, InsertSavedCart,
  Wishlist, InsertWishlist,
  RecurringOrder, InsertRecurringOrder,
  Coupon, InsertCoupon,
  CouponUsage, InsertCouponUsage,
  Review, InsertReview,
  GiftCard, InsertGiftCard,
  GiftCardTransaction, InsertGiftCardTransaction,
  VipTier, InsertVipTier,
  UserLoyalty, InsertUserLoyalty,
  LoyaltyTransaction, InsertLoyaltyTransaction,
  FrequentlyBoughtTogether, InsertFrequentlyBoughtTogether,
  PaymentTransaction, InsertPaymentTransaction,
  SeasonalTheme, InsertSeasonalTheme,
} from '@shared/schema';
import { eq, desc, and, sql, inArray, gte, lte, or, isNull, gt, isNotNull } from 'drizzle-orm';

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithPassword(user: { email: string; passwordHash: string; firstName: string; lastName: string; phone?: string; authProvider: string; emailVerified: boolean }): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Wishlists
  getWishlistItems(userId: string): Promise<Wishlist[]>;
  addToWishlist(item: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;
  isInWishlist(userId: string, productId: string): Promise<boolean>;
  
  // Recurring Orders
  getRecurringOrders(userId: string): Promise<RecurringOrder[]>;
  createRecurringOrder(order: InsertRecurringOrder): Promise<RecurringOrder>;
  updateRecurringOrder(id: string, order: Partial<InsertRecurringOrder>): Promise<RecurringOrder | undefined>;
  deleteRecurringOrder(id: string): Promise<void>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;
  
  // Products
  getProducts(filters?: { categoryId?: string; featured?: boolean; search?: string; sort?: string }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getLowStockProducts(): Promise<Product[]>;
  searchProducts(query: string, limit?: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  updateProductStock(id: string, quantity: number): Promise<void>;
  importProducts(products: InsertProduct[]): Promise<void>;
  
  // Addresses
  getUserAddresses(userId: string): Promise<Address[]>;
  getAddress(id: string): Promise<Address | undefined>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: string, address: Partial<InsertAddress>): Promise<Address | undefined>;
  deleteAddress(id: string): Promise<void>;
  
  // Orders
  getOrders(filters?: { userId?: string; status?: string }): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: string, status: string, paymentStatus?: string): Promise<void>;
  updateOrderTracking(id: string, trackingNumber: string): Promise<void>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  
  // Blog
  getBlogPosts(published?: boolean): Promise<BlogPost[]>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  
  // Newsletter
  subscribeNewsletter(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  getNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;
  
  // AI Support Chat
  getSupportSession(id: string): Promise<SupportSession | undefined>;
  createSupportSession(session: InsertSupportSession): Promise<SupportSession>;
  updateSupportSession(id: string, session: Partial<InsertSupportSession>): Promise<void>;
  getSupportMessages(sessionId: string): Promise<SupportMessage[]>;
  createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage>;
  
  // Return Requests
  getReturnRequests(filters?: { status?: string; orderNumber?: string }): Promise<ReturnRequest[]>;
  getReturnRequest(id: string): Promise<ReturnRequest | undefined>;
  createReturnRequest(request: InsertReturnRequest): Promise<ReturnRequest>;
  updateReturnRequest(id: string, request: Partial<InsertReturnRequest>): Promise<ReturnRequest | undefined>;
  
  // Stock Alerts
  getStockAlerts(resolved?: boolean): Promise<StockAlert[]>;
  createStockAlert(alert: InsertStockAlert): Promise<StockAlert>;
  resolveStockAlert(id: string): Promise<void>;
  
  // Supplier Messages
  getSupplierMessages(status?: string): Promise<SupplierMessage[]>;
  createSupplierMessage(message: InsertSupplierMessage): Promise<SupplierMessage>;
  updateSupplierMessageStatus(id: string, status: string): Promise<void>;
  
  // Saved Carts
  getSavedCart(shareCode: string): Promise<SavedCart | undefined>;
  createSavedCart(cart: InsertSavedCart): Promise<SavedCart>;
  
  // Recommendations
  getRecommendationsForUser(userId: string, limit?: number): Promise<Product[]>;
  getRelatedProducts(productId: string, limit?: number): Promise<Product[]>;
  getPopularProducts(limit?: number): Promise<Product[]>;
  
  // Coupons
  getCoupons(): Promise<Coupon[]>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  getActiveCoupons(): Promise<Coupon[]>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: string, coupon: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: string): Promise<void>;
  getCouponUsage(couponId: string): Promise<CouponUsage[]>;
  recordCouponUsage(usage: InsertCouponUsage): Promise<CouponUsage>;
  incrementCouponUsage(couponId: string): Promise<void>;
  
  // AI Reports
  getAIReport(date: string): Promise<any | undefined>;
  saveAIReport(date: string, reportData: any): Promise<void>;
  
  // Reviews
  getProductReviews(productId: string): Promise<Review[]>;
  getUserReviews(userId: string): Promise<Review[]>;
  getAllReviews(): Promise<Review[]>;
  getReview(id: string): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, review: { isApproved?: boolean; title?: string; comment?: string }): Promise<Review | undefined>;
  deleteReview(id: string): Promise<void>;
  getProductAverageRating(productId: string): Promise<{ average: number; count: number }>;
  hasUserReviewedProduct(userId: string, productId: string): Promise<boolean>;
  
  // Gift Cards
  getGiftCards(): Promise<GiftCard[]>;
  getGiftCard(id: string): Promise<GiftCard | undefined>;
  getGiftCardByCode(code: string): Promise<GiftCard | undefined>;
  createGiftCard(card: InsertGiftCard): Promise<GiftCard>;
  updateGiftCardBalance(id: string, newBalance: number): Promise<void>;
  deactivateGiftCard(id: string): Promise<void>;
  getGiftCardTransactions(giftCardId: string): Promise<GiftCardTransaction[]>;
  createGiftCardTransaction(transaction: InsertGiftCardTransaction): Promise<GiftCardTransaction>;
  
  // VIP Tiers & Loyalty
  getVipTiers(): Promise<VipTier[]>;
  getVipTier(id: string): Promise<VipTier | undefined>;
  getVipTierByName(name: string): Promise<VipTier | undefined>;
  createVipTier(tier: InsertVipTier): Promise<VipTier>;
  updateVipTier(id: string, tier: Partial<InsertVipTier>): Promise<VipTier | undefined>;
  
  // User Loyalty
  getUserLoyalty(userId: string): Promise<UserLoyalty | undefined>;
  createUserLoyalty(loyalty: InsertUserLoyalty): Promise<UserLoyalty>;
  updateUserLoyalty(userId: string, loyalty: Partial<InsertUserLoyalty>): Promise<UserLoyalty | undefined>;
  addLoyaltyPoints(userId: string, points: number, type: string, description: string, orderId?: string): Promise<LoyaltyTransaction>;
  redeemLoyaltyPoints(userId: string, points: number, description: string): Promise<LoyaltyTransaction | undefined>;
  calculateAndUpdateTier(userId: string): Promise<VipTier | undefined>;
  
  // Loyalty Transactions
  getLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]>;
  getLoyaltyTransaction(id: string): Promise<LoyaltyTransaction | undefined>;
  expireOldPoints(): Promise<{ expiredCount: number; usersAffected: number }>;
  getExpiringPoints(userId: string, withinDays?: number): Promise<{ points: number; expiresAt: Date | null }[]>;
  getAllUsersLoyalty(): Promise<(UserLoyalty & { user?: User })[]>;
  
  // Frequently Bought Together
  getFrequentlyBoughtTogether(productId: string, limit?: number): Promise<Product[]>;
  updateFrequentlyBoughtTogether(productId: string, relatedProductId: string): Promise<void>;
  trackPurchasedTogether(productIds: string[]): Promise<void>;
  
  // Financial Tracking
  recordPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  getPaymentTransactions(filters?: { gateway?: string; type?: string; status?: string; startDate?: Date; endDate?: Date; limit?: number }): Promise<PaymentTransaction[]>;
  getFinancialOverview(startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    totalRefunds: number;
    totalFees: number;
    netRevenue: number;
    totalVat: number;
    transactionCount: number;
    orderCount: number;
    averageOrderValue: number;
    byGateway: { gateway: string; revenue: number; count: number }[];
    byStatus: { status: string; count: number }[];
  }>;
  getRevenueTrends(days: number): Promise<{ date: string; revenue: number; orders: number; gateway: string }[]>;
  syncOrderPayments(): Promise<{ synced: number; errors: number }>;
  
  // Seasonal Themes
  getSeasonalThemes(): Promise<SeasonalTheme[]>;
  getSeasonalTheme(id: string): Promise<SeasonalTheme | undefined>;
  getActiveSeasonalTheme(): Promise<SeasonalTheme | undefined>;
  createSeasonalTheme(theme: InsertSeasonalTheme): Promise<SeasonalTheme>;
  updateSeasonalTheme(id: string, theme: Partial<InsertSeasonalTheme>): Promise<SeasonalTheme | undefined>;
  deleteSeasonalTheme(id: string): Promise<void>;
}

export class DbStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(schema.users).values(user).returning();
    return created;
  }
  
  async createUserWithPassword(user: { email: string; passwordHash: string; firstName: string; lastName: string; phone?: string; authProvider: string; emailVerified: boolean }): Promise<User> {
    const [created] = await db.insert(schema.users).values({
      email: user.email,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      authProvider: user.authProvider,
      emailVerified: user.emailVerified,
    }).returning();
    return created;
  }
  
  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(schema.users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return updated;
  }
  
  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(schema.users)
      .values(userData)
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Wishlists
  async getWishlistItems(userId: string): Promise<Wishlist[]> {
    return db.select().from(schema.wishlists).where(eq(schema.wishlists.userId, userId));
  }
  
  async addToWishlist(item: InsertWishlist): Promise<Wishlist> {
    const [created] = await db.insert(schema.wishlists).values(item).returning();
    return created;
  }
  
  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await db.delete(schema.wishlists).where(
      and(eq(schema.wishlists.userId, userId), eq(schema.wishlists.productId, productId))
    );
  }
  
  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const [item] = await db.select().from(schema.wishlists).where(
      and(eq(schema.wishlists.userId, userId), eq(schema.wishlists.productId, productId))
    );
    return !!item;
  }
  
  // Recurring Orders
  async getRecurringOrders(userId: string): Promise<RecurringOrder[]> {
    return db.select().from(schema.recurringOrders).where(eq(schema.recurringOrders.userId, userId));
  }
  
  async createRecurringOrder(order: InsertRecurringOrder): Promise<RecurringOrder> {
    const [created] = await db.insert(schema.recurringOrders).values(order).returning();
    return created;
  }
  
  async updateRecurringOrder(id: string, order: Partial<InsertRecurringOrder>): Promise<RecurringOrder | undefined> {
    const [updated] = await db.update(schema.recurringOrders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(schema.recurringOrders.id, id))
      .returning();
    return updated;
  }
  
  async deleteRecurringOrder(id: string): Promise<void> {
    await db.delete(schema.recurringOrders).where(eq(schema.recurringOrders.id, id));
  }
  
  // Categories
  async getCategories(): Promise<Category[]> {
    return db.select().from(schema.categories).orderBy(schema.categories.sortOrder);
  }
  
  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(schema.categories).where(eq(schema.categories.id, id));
    return category;
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(schema.categories).where(eq(schema.categories.slug, slug));
    return category;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(schema.categories).values(category).returning();
    return created;
  }
  
  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(schema.categories)
      .set(category)
      .where(eq(schema.categories.id, id))
      .returning();
    return updated;
  }
  
  async deleteCategory(id: string): Promise<void> {
    await db.delete(schema.categories).where(eq(schema.categories.id, id));
  }
  
  // Products
  async getProducts(filters?: { categoryId?: string; featured?: boolean; search?: string; sort?: string }): Promise<Product[]> {
    const conditions = [eq(schema.products.isActive, true)];
    
    if (filters?.categoryId) {
      const childCategories = await db.select()
        .from(schema.categories)
        .where(eq(schema.categories.parentId, filters.categoryId));
      
      if (childCategories.length > 0) {
        const categoryIds = [filters.categoryId, ...childCategories.map(c => c.id)];
        conditions.push(inArray(schema.products.categoryId, categoryIds));
      } else {
        conditions.push(eq(schema.products.categoryId, filters.categoryId));
      }
    }
    if (filters?.featured) {
      conditions.push(eq(schema.products.isFeatured, true));
    }
    if (filters?.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      conditions.push(
        sql`(LOWER(${schema.products.nameEn}) LIKE ${searchTerm} OR LOWER(${schema.products.nameEt}) LIKE ${searchTerm} OR LOWER(${schema.products.sku}) LIKE ${searchTerm})`
      );
    }
    
    // For price sorting, use CTE (derived table) strategy with computed numeric price
    if (filters?.sort === 'price_asc' || filters?.sort === 'price_desc') {
      const pricedProducts = db.$with('priced_products').as(
        db.select({
          ...schema.products,
          priceNumeric: sql<number>`CAST(${schema.products.price} AS NUMERIC)`.as('price_numeric')
        })
        .from(schema.products)
        .where(and(...conditions))
      );
      
      const results = await db.with(pricedProducts)
        .select()
        .from(pricedProducts)
        .orderBy(filters.sort === 'price_asc' ? pricedProducts.priceNumeric : desc(pricedProducts.priceNumeric));
      
      return results.map(({ priceNumeric, ...product }) => product as Product);
    }
    
    // Standard sorting for non-price fields
    switch (filters?.sort) {
      case 'name_az':
        return db.select().from(schema.products)
          .where(and(...conditions))
          .orderBy(schema.products.nameEn);
      case 'name_za':
        return db.select().from(schema.products)
          .where(and(...conditions))
          .orderBy(desc(schema.products.nameEn));
      case 'oldest':
        return db.select().from(schema.products)
          .where(and(...conditions))
          .orderBy(schema.products.createdAt);
      case 'newest':
      default:
        return db.select().from(schema.products)
          .where(and(...conditions))
          .orderBy(desc(schema.products.createdAt));
    }
  }
  
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    return product;
  }
  
  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(schema.products).where(eq(schema.products.sku, sku));
    return product;
  }
  
  async getLowStockProducts(): Promise<Product[]> {
    return db.select().from(schema.products)
      .where(sql`${schema.products.stock} <= ${schema.products.lowStockThreshold}`)
      .orderBy(schema.products.stock);
  }
  
  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return db.select().from(schema.products)
      .where(and(
        eq(schema.products.isActive, true),
        sql`(LOWER(${schema.products.nameEn}) LIKE ${searchTerm} OR LOWER(${schema.products.nameEt}) LIKE ${searchTerm} OR LOWER(${schema.products.sku}) LIKE ${searchTerm})`
      ))
      .limit(limit)
      .orderBy(desc(schema.products.isFeatured), desc(schema.products.createdAt));
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const productData = {
      ...product,
      price: typeof product.price === 'number' ? product.price.toString() : product.price,
      salePrice: product.salePrice ? 
        (typeof product.salePrice === 'number' ? product.salePrice.toString() : product.salePrice) : 
        undefined,
    };
    const [created] = await db.insert(schema.products).values(productData as any).returning();
    return created;
  }
  
  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const productData: any = { ...product, updatedAt: new Date() };
    if (product.price !== undefined) {
      productData.price = typeof product.price === 'number' ? product.price.toString() : product.price;
    }
    if (product.salePrice !== undefined) {
      productData.salePrice = typeof product.salePrice === 'number' ? product.salePrice.toString() : product.salePrice;
    }
    const [updated] = await db.update(schema.products)
      .set(productData)
      .where(eq(schema.products.id, id))
      .returning();
    return updated;
  }
  
  async deleteProduct(id: string): Promise<void> {
    await db.delete(schema.products).where(eq(schema.products.id, id));
  }
  
  async updateProductStock(id: string, quantity: number): Promise<void> {
    await db.update(schema.products)
      .set({ stock: sql`${schema.products.stock} + ${quantity}` })
      .where(eq(schema.products.id, id));
  }
  
  async importProducts(products: InsertProduct[]): Promise<void> {
    const productsData = products.map(p => ({
      ...p,
      price: typeof p.price === 'number' ? p.price.toString() : p.price,
      salePrice: p.salePrice ? 
        (typeof p.salePrice === 'number' ? p.salePrice.toString() : p.salePrice) : 
        undefined,
    }));
    await db.insert(schema.products).values(productsData as any).onConflictDoNothing();
  }
  
  // Addresses
  async getUserAddresses(userId: string): Promise<Address[]> {
    return db.select().from(schema.addresses).where(eq(schema.addresses.userId, userId));
  }
  
  async getAddress(id: string): Promise<Address | undefined> {
    const [address] = await db.select().from(schema.addresses).where(eq(schema.addresses.id, id));
    return address;
  }
  
  async createAddress(address: InsertAddress): Promise<Address> {
    const [created] = await db.insert(schema.addresses).values(address).returning();
    return created;
  }
  
  async updateAddress(id: string, address: Partial<InsertAddress>): Promise<Address | undefined> {
    const [updated] = await db.update(schema.addresses)
      .set(address)
      .where(eq(schema.addresses.id, id))
      .returning();
    return updated;
  }
  
  async deleteAddress(id: string): Promise<void> {
    await db.delete(schema.addresses).where(eq(schema.addresses.id, id));
  }
  
  // Orders
  async getOrders(filters?: { userId?: string; status?: string }): Promise<Order[]> {
    const conditions = [];
    
    if (filters?.userId) {
      conditions.push(eq(schema.orders.userId, filters.userId));
    }
    if (filters?.status) {
      conditions.push(eq(schema.orders.status, filters.status));
    }
    
    if (conditions.length > 0) {
      return db.select().from(schema.orders)
        .where(and(...conditions))
        .orderBy(desc(schema.orders.createdAt));
    }
    
    return db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
  }
  
  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return order;
  }
  
  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, orderNumber));
    return order;
  }
  
  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const orderNumber = `EST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const orderData = {
      ...order,
      orderNumber,
      subtotal: typeof order.subtotal === 'number' ? order.subtotal.toString() : order.subtotal,
      shippingCost: typeof order.shippingCost === 'number' ? order.shippingCost.toString() : order.shippingCost,
      tax: order.tax ? (typeof order.tax === 'number' ? order.tax.toString() : order.tax) : '0',
      total: typeof order.total === 'number' ? order.total.toString() : order.total,
    };
    
    const [created] = await db.insert(schema.orders)
      .values(orderData as any)
      .returning();
    
    const itemsData = items.map(item => ({
      ...item,
      orderId: created.id,
      price: typeof item.price === 'number' ? item.price.toString() : item.price,
      subtotal: typeof item.subtotal === 'number' ? item.subtotal.toString() : item.subtotal,
    }));
    
    await db.insert(schema.orderItems).values(itemsData as any);
    
    // Update stock
    for (const item of items) {
      await this.updateProductStock(item.productId, -item.quantity);
    }
    
    return created;
  }
  
  async updateOrderStatus(id: string, status: string, paymentStatus?: string): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    await db.update(schema.orders).set(updateData).where(eq(schema.orders.id, id));
  }
  
  async updateOrderTracking(id: string, trackingNumber: string): Promise<void> {
    await db.update(schema.orders)
      .set({ trackingNumber, updatedAt: new Date() })
      .where(eq(schema.orders.id, id));
  }
  
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
  }
  
  // Blog
  async getBlogPosts(published?: boolean): Promise<BlogPost[]> {
    if (published !== undefined) {
      return db.select().from(schema.blogPosts)
        .where(eq(schema.blogPosts.isPublished, published))
        .orderBy(desc(schema.blogPosts.publishedAt));
    }
    
    return db.select().from(schema.blogPosts).orderBy(desc(schema.blogPosts.publishedAt));
  }
  
  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, id));
    return post;
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(schema.blogPosts).where(eq(schema.blogPosts.slug, slug));
    return post;
  }
  
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [created] = await db.insert(schema.blogPosts).values(post).returning();
    return created;
  }
  
  async updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [updated] = await db.update(schema.blogPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(schema.blogPosts.id, id))
      .returning();
    return updated;
  }
  
  // Newsletter
  async subscribeNewsletter(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const [created] = await db.insert(schema.newsletterSubscribers)
      .values(subscriber)
      .onConflictDoUpdate({
        target: schema.newsletterSubscribers.email,
        set: { isActive: true },
      })
      .returning();
    return created;
  }
  
  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return db.select().from(schema.newsletterSubscribers)
      .where(eq(schema.newsletterSubscribers.isActive, true));
  }
  
  // AI Support Chat
  async getSupportSession(id: string): Promise<SupportSession | undefined> {
    const [session] = await db.select().from(schema.supportSessions)
      .where(eq(schema.supportSessions.id, id));
    return session;
  }
  
  async createSupportSession(session: InsertSupportSession): Promise<SupportSession> {
    const [newSession] = await db.insert(schema.supportSessions)
      .values({
        ...session,
        languageConfidence: session.languageConfidence?.toString() || '0',
      })
      .returning();
    return newSession;
  }
  
  async updateSupportSession(id: string, session: Partial<InsertSupportSession>): Promise<void> {
    await db.update(schema.supportSessions)
      .set({
        ...session,
        languageConfidence: session.languageConfidence?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(schema.supportSessions.id, id));
  }
  
  async getSupportMessages(sessionId: string): Promise<SupportMessage[]> {
    return db.select().from(schema.supportMessages)
      .where(eq(schema.supportMessages.sessionId, sessionId))
      .orderBy(schema.supportMessages.createdAt);
  }
  
  async createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage> {
    const [newMessage] = await db.insert(schema.supportMessages)
      .values(message)
      .returning();
    return newMessage;
  }
  
  // Return Requests
  async getReturnRequests(filters?: { status?: string; orderNumber?: string }): Promise<ReturnRequest[]> {
    let query = db.select().from(schema.returnRequests);
    
    if (filters?.status) {
      query = query.where(eq(schema.returnRequests.status, filters.status)) as any;
    }
    if (filters?.orderNumber) {
      query = query.where(eq(schema.returnRequests.orderNumber, filters.orderNumber)) as any;
    }
    
    return query.orderBy(desc(schema.returnRequests.createdAt));
  }
  
  async getReturnRequest(id: string): Promise<ReturnRequest | undefined> {
    const [request] = await db.select().from(schema.returnRequests)
      .where(eq(schema.returnRequests.id, id));
    return request;
  }
  
  async createReturnRequest(request: InsertReturnRequest): Promise<ReturnRequest> {
    const [created] = await db.insert(schema.returnRequests)
      .values(request)
      .returning();
    return created;
  }
  
  async updateReturnRequest(id: string, request: Partial<InsertReturnRequest>): Promise<ReturnRequest | undefined> {
    const [updated] = await db.update(schema.returnRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(schema.returnRequests.id, id))
      .returning();
    return updated;
  }
  
  // Stock Alerts
  async getStockAlerts(resolved?: boolean): Promise<StockAlert[]> {
    if (resolved !== undefined) {
      return db.select().from(schema.stockAlerts)
        .where(eq(schema.stockAlerts.isResolved, resolved))
        .orderBy(desc(schema.stockAlerts.createdAt));
    }
    return db.select().from(schema.stockAlerts)
      .orderBy(desc(schema.stockAlerts.createdAt));
  }
  
  async createStockAlert(alert: InsertStockAlert): Promise<StockAlert> {
    const [created] = await db.insert(schema.stockAlerts)
      .values(alert)
      .returning();
    return created;
  }
  
  async resolveStockAlert(id: string): Promise<void> {
    await db.update(schema.stockAlerts)
      .set({ isResolved: true })
      .where(eq(schema.stockAlerts.id, id));
  }
  
  // Supplier Messages
  async getSupplierMessages(status?: string): Promise<SupplierMessage[]> {
    if (status) {
      return db.select().from(schema.supplierMessages)
        .where(eq(schema.supplierMessages.status, status))
        .orderBy(desc(schema.supplierMessages.createdAt));
    }
    return db.select().from(schema.supplierMessages)
      .orderBy(desc(schema.supplierMessages.createdAt));
  }
  
  async createSupplierMessage(message: InsertSupplierMessage): Promise<SupplierMessage> {
    const [created] = await db.insert(schema.supplierMessages)
      .values(message)
      .returning();
    return created;
  }
  
  async updateSupplierMessageStatus(id: string, status: string): Promise<void> {
    await db.update(schema.supplierMessages)
      .set({ status, sentAt: status === 'sent' ? new Date() : undefined })
      .where(eq(schema.supplierMessages.id, id));
  }
  
  // Saved Carts
  async getSavedCart(shareCode: string): Promise<SavedCart | undefined> {
    const [cart] = await db.select().from(schema.savedCarts)
      .where(eq(schema.savedCarts.shareCode, shareCode));
    return cart;
  }
  
  async createSavedCart(cart: InsertSavedCart): Promise<SavedCart> {
    const [created] = await db.insert(schema.savedCarts)
      .values(cart)
      .returning();
    return created;
  }
  
  // Recommendations - Based on wishlist categories and popular products
  async getRecommendationsForUser(userId: string, limit: number = 8): Promise<Product[]> {
    const wishlistItems = await this.getWishlistItems(userId);
    
    if (wishlistItems.length === 0) {
      return this.getPopularProducts(limit);
    }
    
    const wishlistProductIds = wishlistItems.map(w => w.productId);
    
    // Guard against empty wishlist product IDs
    if (wishlistProductIds.length === 0) {
      return this.getPopularProducts(limit);
    }
    
    const wishlistProducts = await db.select().from(schema.products)
      .where(inArray(schema.products.id, wishlistProductIds));
    
    const categoryIds = Array.from(new Set(wishlistProducts.map(p => p.categoryId).filter(Boolean)));
    
    // If no valid categories found, return popular products
    if (categoryIds.length === 0) {
      return this.getPopularProducts(limit);
    }
    
    // Build NOT IN clause safely
    const notInClause = wishlistProductIds.length > 0 
      ? sql`${schema.products.id} NOT IN (${sql.join(wishlistProductIds.map(id => sql`${id}`), sql`, `)})`
      : sql`1=1`;
    
    const recommendations = await db.select().from(schema.products)
      .where(
        and(
          inArray(schema.products.categoryId, categoryIds),
          notInClause,
          eq(schema.products.isActive, true),
          sql`${schema.products.stock} > 0`
        )
      )
      .orderBy(
        desc(schema.products.isFeatured),
        desc(schema.products.isNew)
      )
      .limit(limit);
    
    if (recommendations.length < limit) {
      const remainingLimit = limit - recommendations.length;
      const existingIds = [...wishlistProductIds, ...recommendations.map(r => r.id)];
      
      // Build NOT IN clause safely for additional products
      const additionalNotInClause = existingIds.length > 0
        ? sql`${schema.products.id} NOT IN (${sql.join(existingIds.map(id => sql`${id}`), sql`, `)})`
        : sql`1=1`;
      
      const additionalProducts = await db.select().from(schema.products)
        .where(
          and(
            additionalNotInClause,
            eq(schema.products.isActive, true),
            sql`${schema.products.stock} > 0`
          )
        )
        .orderBy(desc(schema.products.isFeatured))
        .limit(remainingLimit);
      
      return [...recommendations, ...additionalProducts];
    }
    
    return recommendations;
  }
  
  async getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    const product = await this.getProduct(productId);
    if (!product) return [];
    
    return db.select().from(schema.products)
      .where(
        and(
          eq(schema.products.categoryId, product.categoryId),
          sql`${schema.products.id} != ${productId}`,
          eq(schema.products.isActive, true),
          sql`${schema.products.stock} > 0`
        )
      )
      .orderBy(desc(schema.products.isFeatured), desc(schema.products.isNew))
      .limit(limit);
  }
  
  async getPopularProducts(limit: number = 8): Promise<Product[]> {
    return db.select().from(schema.products)
      .where(
        and(
          eq(schema.products.isActive, true),
          sql`${schema.products.stock} > 0`
        )
      )
      .orderBy(
        desc(schema.products.isFeatured),
        desc(schema.products.isNew),
        desc(schema.products.createdAt)
      )
      .limit(limit);
  }
  
  // Coupons
  async getCoupons(): Promise<Coupon[]> {
    return db.select().from(schema.coupons).orderBy(desc(schema.coupons.createdAt));
  }
  
  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const results = await db.select().from(schema.coupons)
      .where(eq(schema.coupons.code, code.toUpperCase()));
    return results[0];
  }
  
  async getActiveCoupons(): Promise<Coupon[]> {
    const now = new Date();
    return db.select().from(schema.coupons)
      .where(
        and(
          eq(schema.coupons.isActive, true),
          or(
            isNull(schema.coupons.startsAt),
            lte(schema.coupons.startsAt, now)
          ),
          or(
            isNull(schema.coupons.expiresAt),
            gte(schema.coupons.expiresAt, now)
          )
        )
      )
      .orderBy(desc(schema.coupons.discountPercent));
  }
  
  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [result] = await db.insert(schema.coupons).values({
      ...coupon,
      code: coupon.code.toUpperCase(),
    }).returning();
    return result;
  }
  
  async updateCoupon(id: string, coupon: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    const updateData: any = { ...coupon, updatedAt: new Date() };
    if (coupon.code) {
      updateData.code = coupon.code.toUpperCase();
    }
    const [result] = await db.update(schema.coupons)
      .set(updateData)
      .where(eq(schema.coupons.id, id))
      .returning();
    return result;
  }
  
  async deleteCoupon(id: string): Promise<void> {
    await db.delete(schema.coupons).where(eq(schema.coupons.id, id));
  }
  
  async getCouponUsage(couponId: string): Promise<CouponUsage[]> {
    return db.select().from(schema.couponUsage)
      .where(eq(schema.couponUsage.couponId, couponId))
      .orderBy(desc(schema.couponUsage.usedAt));
  }
  
  async recordCouponUsage(usage: InsertCouponUsage): Promise<CouponUsage> {
    const [result] = await db.insert(schema.couponUsage).values(usage).returning();
    await this.incrementCouponUsage(usage.couponId);
    return result;
  }
  
  async incrementCouponUsage(couponId: string): Promise<void> {
    await db.update(schema.coupons)
      .set({ 
        usedCount: sql`COALESCE(${schema.coupons.usedCount}, 0) + 1`,
        updatedAt: new Date()
      })
      .where(eq(schema.coupons.id, couponId));
  }
  
  // AI Reports
  async getAIReport(date: string): Promise<any | undefined> {
    const [report] = await db.select().from(schema.aiReports).where(eq(schema.aiReports.date, date));
    return report ? report.reportData : undefined;
  }
  
  async saveAIReport(date: string, reportData: any): Promise<void> {
    // Upsert - update if exists, insert if not
    const existing = await db.select().from(schema.aiReports).where(eq(schema.aiReports.date, date));
    if (existing.length > 0) {
      await db.update(schema.aiReports)
        .set({ reportData, updatedAt: new Date() })
        .where(eq(schema.aiReports.date, date));
    } else {
      await db.insert(schema.aiReports).values({ date, reportData });
    }
  }
  
  // Reviews
  async getProductReviews(productId: string): Promise<Review[]> {
    return db.select().from(schema.reviews)
      .where(and(
        eq(schema.reviews.productId, productId),
        eq(schema.reviews.isApproved, true)
      ))
      .orderBy(desc(schema.reviews.createdAt));
  }
  
  async getUserReviews(userId: string): Promise<Review[]> {
    return db.select().from(schema.reviews)
      .where(eq(schema.reviews.userId, userId))
      .orderBy(desc(schema.reviews.createdAt));
  }
  
  async getAllReviews(): Promise<Review[]> {
    return db.select().from(schema.reviews)
      .orderBy(desc(schema.reviews.createdAt));
  }
  
  async getReview(id: string): Promise<Review | undefined> {
    const [review] = await db.select().from(schema.reviews)
      .where(eq(schema.reviews.id, id));
    return review;
  }
  
  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(schema.reviews).values(review).returning();
    return created;
  }
  
  async updateReview(id: string, review: { isApproved?: boolean; title?: string; comment?: string }): Promise<Review | undefined> {
    const [updated] = await db.update(schema.reviews)
      .set(review)
      .where(eq(schema.reviews.id, id))
      .returning();
    return updated;
  }
  
  async deleteReview(id: string): Promise<void> {
    await db.delete(schema.reviews).where(eq(schema.reviews.id, id));
  }
  
  async getProductAverageRating(productId: string): Promise<{ average: number; count: number }> {
    const reviews = await db.select().from(schema.reviews)
      .where(and(
        eq(schema.reviews.productId, productId),
        eq(schema.reviews.isApproved, true)
      ));
    
    if (reviews.length === 0) {
      return { average: 0, count: 0 };
    }
    
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: Math.round((sum / reviews.length) * 10) / 10,
      count: reviews.length,
    };
  }
  
  async hasUserReviewedProduct(userId: string, productId: string): Promise<boolean> {
    const [existing] = await db.select().from(schema.reviews)
      .where(and(
        eq(schema.reviews.userId, userId),
        eq(schema.reviews.productId, productId)
      ));
    return !!existing;
  }
  
  // Gift Cards
  async getGiftCards(): Promise<GiftCard[]> {
    return db.select().from(schema.giftCards)
      .orderBy(desc(schema.giftCards.createdAt));
  }
  
  async getGiftCard(id: string): Promise<GiftCard | undefined> {
    const [card] = await db.select().from(schema.giftCards)
      .where(eq(schema.giftCards.id, id));
    return card;
  }
  
  async getGiftCardByCode(code: string): Promise<GiftCard | undefined> {
    const [card] = await db.select().from(schema.giftCards)
      .where(eq(schema.giftCards.code, code.toUpperCase()));
    return card;
  }
  
  async createGiftCard(card: InsertGiftCard): Promise<GiftCard> {
    const [created] = await db.insert(schema.giftCards).values({
      ...card,
      code: card.code.toUpperCase(),
      currentBalance: card.initialValue,
    }).returning();
    return created;
  }
  
  async updateGiftCardBalance(id: string, newBalance: number): Promise<void> {
    await db.update(schema.giftCards)
      .set({ currentBalance: newBalance.toFixed(2) })
      .where(eq(schema.giftCards.id, id));
  }
  
  async deactivateGiftCard(id: string): Promise<void> {
    await db.update(schema.giftCards)
      .set({ isActive: false })
      .where(eq(schema.giftCards.id, id));
  }
  
  async getGiftCardTransactions(giftCardId: string): Promise<GiftCardTransaction[]> {
    return db.select().from(schema.giftCardTransactions)
      .where(eq(schema.giftCardTransactions.giftCardId, giftCardId))
      .orderBy(desc(schema.giftCardTransactions.createdAt));
  }
  
  async createGiftCardTransaction(transaction: InsertGiftCardTransaction): Promise<GiftCardTransaction> {
    const [created] = await db.insert(schema.giftCardTransactions)
      .values(transaction)
      .returning();
    return created;
  }
  
  // VIP Tiers & Loyalty
  async getVipTiers(): Promise<VipTier[]> {
    return db.select().from(schema.vipTiers)
      .where(eq(schema.vipTiers.isActive, true))
      .orderBy(schema.vipTiers.sortOrder);
  }
  
  async getVipTier(id: string): Promise<VipTier | undefined> {
    const [tier] = await db.select().from(schema.vipTiers)
      .where(eq(schema.vipTiers.id, id));
    return tier;
  }
  
  async getVipTierByName(name: string): Promise<VipTier | undefined> {
    const [tier] = await db.select().from(schema.vipTiers)
      .where(eq(schema.vipTiers.name, name.toLowerCase()));
    return tier;
  }
  
  async createVipTier(tier: InsertVipTier): Promise<VipTier> {
    const [created] = await db.insert(schema.vipTiers).values(tier).returning();
    return created;
  }
  
  async updateVipTier(id: string, tier: Partial<InsertVipTier>): Promise<VipTier | undefined> {
    const [updated] = await db.update(schema.vipTiers)
      .set(tier)
      .where(eq(schema.vipTiers.id, id))
      .returning();
    return updated;
  }
  
  // User Loyalty
  async getUserLoyalty(userId: string): Promise<UserLoyalty | undefined> {
    const [loyalty] = await db.select().from(schema.userLoyalty)
      .where(eq(schema.userLoyalty.userId, userId));
    return loyalty;
  }
  
  async createUserLoyalty(loyalty: InsertUserLoyalty): Promise<UserLoyalty> {
    const [created] = await db.insert(schema.userLoyalty).values(loyalty).returning();
    return created;
  }
  
  async updateUserLoyalty(userId: string, loyalty: Partial<InsertUserLoyalty>): Promise<UserLoyalty | undefined> {
    const [updated] = await db.update(schema.userLoyalty)
      .set({ ...loyalty, updatedAt: new Date() })
      .where(eq(schema.userLoyalty.userId, userId))
      .returning();
    return updated;
  }
  
  async addLoyaltyPoints(userId: string, points: number, type: string, description: string, orderId?: string): Promise<LoyaltyTransaction> {
    // Get or create user loyalty record
    let userLoyalty = await this.getUserLoyalty(userId);
    
    if (!userLoyalty) {
      // Get default tier (bronze)
      const defaultTier = await this.getVipTierByName('bronze');
      userLoyalty = await this.createUserLoyalty({
        userId,
        currentPoints: 0,
        lifetimePoints: 0,
        totalSpend: '0.00',
        currentTierId: defaultTier?.id,
      });
    }
    
    const balanceBefore = userLoyalty.currentPoints;
    const balanceAfter = balanceBefore + points;
    
    // Set expiration date: 6 months from now for earned points
    const expiresAt = points > 0 ? new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) : null;
    
    // Create transaction record
    const [transaction] = await db.insert(schema.loyaltyTransactions).values({
      userId,
      orderId,
      points,
      type,
      description,
      balanceBefore,
      balanceAfter,
      expiresAt,
      isExpired: false,
    }).returning();
    
    // Update user loyalty
    await this.updateUserLoyalty(userId, {
      currentPoints: balanceAfter,
      lifetimePoints: userLoyalty.lifetimePoints + (points > 0 ? points : 0),
    });
    
    // Check if tier upgrade is needed
    await this.calculateAndUpdateTier(userId);
    
    return transaction;
  }
  
  async redeemLoyaltyPoints(userId: string, points: number, description: string): Promise<LoyaltyTransaction | undefined> {
    const userLoyalty = await this.getUserLoyalty(userId);
    
    if (!userLoyalty || userLoyalty.currentPoints < points) {
      return undefined; // Not enough points
    }
    
    const balanceBefore = userLoyalty.currentPoints;
    const balanceAfter = balanceBefore - points;
    
    // Create transaction record
    const [transaction] = await db.insert(schema.loyaltyTransactions).values({
      userId,
      points: -points, // Negative for redemption
      type: 'redeemed',
      description,
      balanceBefore,
      balanceAfter,
    }).returning();
    
    // Update user loyalty
    await this.updateUserLoyalty(userId, {
      currentPoints: balanceAfter,
    });
    
    return transaction;
  }
  
  async calculateAndUpdateTier(userId: string): Promise<VipTier | undefined> {
    const userLoyalty = await this.getUserLoyalty(userId);
    if (!userLoyalty) return undefined;
    
    const totalSpend = parseFloat(userLoyalty.totalSpend || '0');
    
    // Get all active tiers ordered by minSpend descending
    const tiers = await db.select().from(schema.vipTiers)
      .where(eq(schema.vipTiers.isActive, true))
      .orderBy(desc(schema.vipTiers.minSpend));
    
    // Find the highest tier the user qualifies for
    let newTier: VipTier | undefined;
    for (const tier of tiers) {
      if (totalSpend >= parseFloat(tier.minSpend)) {
        newTier = tier;
        break;
      }
    }
    
    // If no tier found, use the lowest tier
    if (!newTier && tiers.length > 0) {
      newTier = tiers[tiers.length - 1];
    }
    
    // Update user's tier if changed
    if (newTier && userLoyalty.currentTierId !== newTier.id) {
      await this.updateUserLoyalty(userId, {
        currentTierId: newTier.id,
        tierUpdatedAt: new Date(),
      });
    }
    
    return newTier;
  }
  
  // Loyalty Transactions
  async getLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]> {
    return db.select().from(schema.loyaltyTransactions)
      .where(eq(schema.loyaltyTransactions.userId, userId))
      .orderBy(desc(schema.loyaltyTransactions.createdAt));
  }
  
  async getLoyaltyTransaction(id: string): Promise<LoyaltyTransaction | undefined> {
    const [transaction] = await db.select().from(schema.loyaltyTransactions)
      .where(eq(schema.loyaltyTransactions.id, id));
    return transaction;
  }
  
  async expireOldPoints(): Promise<{ expiredCount: number; usersAffected: number }> {
    const now = new Date();
    
    // Find all unexpired transactions with positive points that have passed their expiration date
    const expiredTransactions = await db.select().from(schema.loyaltyTransactions)
      .where(and(
        gt(schema.loyaltyTransactions.points, 0),
        eq(schema.loyaltyTransactions.isExpired, false),
        lte(schema.loyaltyTransactions.expiresAt, now),
        isNotNull(schema.loyaltyTransactions.expiresAt)
      ));
    
    if (expiredTransactions.length === 0) {
      return { expiredCount: 0, usersAffected: 0 };
    }
    
    // Group by user to process each user's expired points
    const userExpiredPoints = new Map<string, number>();
    for (const tx of expiredTransactions) {
      const current = userExpiredPoints.get(tx.userId) || 0;
      userExpiredPoints.set(tx.userId, current + tx.points);
    }
    
    let expiredCount = 0;
    
    // Process each user's expired points
    for (const [userId, expiredPoints] of userExpiredPoints) {
      const userLoyalty = await this.getUserLoyalty(userId);
      if (!userLoyalty) continue;
      
      // Calculate how many points to actually expire (can't expire more than current balance)
      const pointsToExpire = Math.min(expiredPoints, userLoyalty.currentPoints);
      if (pointsToExpire <= 0) continue;
      
      const balanceBefore = userLoyalty.currentPoints;
      const balanceAfter = balanceBefore - pointsToExpire;
      
      // Create expiration transaction
      await db.insert(schema.loyaltyTransactions).values({
        userId,
        points: -pointsToExpire,
        type: 'expired',
        description: `${pointsToExpire} punkti aegus / ${pointsToExpire} points expired (6 months)`,
        balanceBefore,
        balanceAfter,
        isExpired: false,
      });
      
      // Update user balance
      await this.updateUserLoyalty(userId, {
        currentPoints: balanceAfter,
      });
      
      expiredCount += pointsToExpire;
    }
    
    // Mark original transactions as expired
    const expiredIds = expiredTransactions.map(tx => tx.id);
    await db.update(schema.loyaltyTransactions)
      .set({ isExpired: true })
      .where(inArray(schema.loyaltyTransactions.id, expiredIds));
    
    return { 
      expiredCount, 
      usersAffected: userExpiredPoints.size 
    };
  }
  
  async getExpiringPoints(userId: string, withinDays: number = 30): Promise<{ points: number; expiresAt: Date | null }[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
    
    const expiringTransactions = await db.select({
      points: schema.loyaltyTransactions.points,
      expiresAt: schema.loyaltyTransactions.expiresAt,
    }).from(schema.loyaltyTransactions)
      .where(and(
        eq(schema.loyaltyTransactions.userId, userId),
        gt(schema.loyaltyTransactions.points, 0),
        eq(schema.loyaltyTransactions.isExpired, false),
        gte(schema.loyaltyTransactions.expiresAt, now),
        lte(schema.loyaltyTransactions.expiresAt, futureDate)
      ))
      .orderBy(schema.loyaltyTransactions.expiresAt);
    
    return expiringTransactions;
  }
  
  async getAllUsersLoyalty(): Promise<(UserLoyalty & { user?: User })[]> {
    const loyaltyRecords = await db.select().from(schema.userLoyalty)
      .orderBy(desc(schema.userLoyalty.currentPoints));
    
    // Get user info for each loyalty record
    const results: (UserLoyalty & { user?: User })[] = [];
    for (const loyalty of loyaltyRecords) {
      const [user] = await db.select().from(schema.users)
        .where(eq(schema.users.id, loyalty.userId));
      results.push({ ...loyalty, user });
    }
    
    return results;
  }
  
  // Frequently Bought Together
  async getFrequentlyBoughtTogether(productId: string, limit: number = 4): Promise<Product[]> {
    const relations = await db.select().from(schema.frequentlyBoughtTogether)
      .where(eq(schema.frequentlyBoughtTogether.productId, productId))
      .orderBy(desc(schema.frequentlyBoughtTogether.purchaseCount))
      .limit(limit);
    
    if (relations.length === 0) return [];
    
    const relatedIds = relations.map(r => r.relatedProductId);
    return db.select().from(schema.products)
      .where(and(
        inArray(schema.products.id, relatedIds),
        eq(schema.products.isActive, true)
      ));
  }
  
  async updateFrequentlyBoughtTogether(productId: string, relatedProductId: string): Promise<void> {
    // Check if relation exists
    const [existing] = await db.select().from(schema.frequentlyBoughtTogether)
      .where(and(
        eq(schema.frequentlyBoughtTogether.productId, productId),
        eq(schema.frequentlyBoughtTogether.relatedProductId, relatedProductId)
      ));
    
    if (existing) {
      // Increment count
      await db.update(schema.frequentlyBoughtTogether)
        .set({ 
          purchaseCount: existing.purchaseCount + 1,
          updatedAt: new Date()
        })
        .where(eq(schema.frequentlyBoughtTogether.id, existing.id));
    } else {
      // Create new relation
      await db.insert(schema.frequentlyBoughtTogether).values({
        productId,
        relatedProductId,
        purchaseCount: 1,
      });
    }
  }
  
  async trackPurchasedTogether(productIds: string[]): Promise<void> {
    // Create relations between all products in the order
    for (let i = 0; i < productIds.length; i++) {
      for (let j = 0; j < productIds.length; j++) {
        if (i !== j) {
          await this.updateFrequentlyBoughtTogether(productIds[i], productIds[j]);
        }
      }
    }
  }
  
  // Financial Tracking
  async recordPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const [created] = await db.insert(schema.paymentTransactions).values(transaction).returning();
    return created;
  }
  
  async getPaymentTransactions(filters?: { 
    gateway?: string; 
    type?: string; 
    status?: string; 
    startDate?: Date; 
    endDate?: Date; 
    limit?: number 
  }): Promise<PaymentTransaction[]> {
    const conditions = [];
    
    if (filters?.gateway) {
      conditions.push(eq(schema.paymentTransactions.gateway, filters.gateway));
    }
    if (filters?.type) {
      conditions.push(eq(schema.paymentTransactions.type, filters.type));
    }
    if (filters?.status) {
      conditions.push(eq(schema.paymentTransactions.status, filters.status));
    }
    if (filters?.startDate) {
      conditions.push(gte(schema.paymentTransactions.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(schema.paymentTransactions.createdAt, filters.endDate));
    }
    
    let query = db.select().from(schema.paymentTransactions)
      .orderBy(desc(schema.paymentTransactions.createdAt));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return query;
  }
  
  async getFinancialOverview(startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    totalRefunds: number;
    totalFees: number;
    netRevenue: number;
    totalVat: number;
    transactionCount: number;
    orderCount: number;
    averageOrderValue: number;
    byGateway: { gateway: string; revenue: number; count: number }[];
    byStatus: { status: string; count: number }[];
  }> {
    const conditions = [];
    
    if (startDate) {
      conditions.push(gte(schema.paymentTransactions.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(schema.paymentTransactions.createdAt, endDate));
    }
    
    // Get all transactions in range
    let transactions: PaymentTransaction[];
    if (conditions.length > 0) {
      transactions = await db.select().from(schema.paymentTransactions)
        .where(and(...conditions));
    } else {
      transactions = await db.select().from(schema.paymentTransactions);
    }
    
    // Calculate totals
    let totalRevenue = 0;
    let totalRefunds = 0;
    let totalFees = 0;
    let totalVat = 0;
    const uniqueOrderIds = new Set<string>();
    const gatewayMap = new Map<string, { revenue: number; count: number }>();
    const statusMap = new Map<string, number>();
    
    for (const tx of transactions) {
      const amount = parseFloat(tx.amountEur);
      const fee = parseFloat(tx.fee || '0');
      const vat = parseFloat(tx.vatAmount || '0');
      
      if (tx.type === 'payment' && tx.status === 'completed') {
        totalRevenue += amount;
        totalVat += vat;
        if (tx.orderId) uniqueOrderIds.add(tx.orderId);
      } else if (tx.type === 'refund') {
        totalRefunds += Math.abs(amount);
      }
      
      totalFees += fee;
      
      // By gateway
      const gatewayStats = gatewayMap.get(tx.gateway) || { revenue: 0, count: 0 };
      if (tx.type === 'payment' && tx.status === 'completed') {
        gatewayStats.revenue += amount;
      }
      gatewayStats.count++;
      gatewayMap.set(tx.gateway, gatewayStats);
      
      // By status
      statusMap.set(tx.status, (statusMap.get(tx.status) || 0) + 1);
    }
    
    const netRevenue = totalRevenue - totalRefunds - totalFees;
    const orderCount = uniqueOrderIds.size;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    
    return {
      totalRevenue,
      totalRefunds,
      totalFees,
      netRevenue,
      totalVat,
      transactionCount: transactions.length,
      orderCount,
      averageOrderValue,
      byGateway: Array.from(gatewayMap.entries()).map(([gateway, stats]) => ({
        gateway,
        revenue: stats.revenue,
        count: stats.count,
      })),
      byStatus: Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
      })),
    };
  }
  
  async getRevenueTrends(days: number): Promise<{ date: string; revenue: number; orders: number; gateway: string }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const transactions = await db.select().from(schema.paymentTransactions)
      .where(and(
        gte(schema.paymentTransactions.createdAt, startDate),
        eq(schema.paymentTransactions.type, 'payment'),
        eq(schema.paymentTransactions.status, 'completed')
      ));
    
    // Group by date and gateway
    const dailyMap = new Map<string, Map<string, { revenue: number; orders: Set<string> }>>();
    
    for (const tx of transactions) {
      const dateStr = tx.createdAt.toISOString().split('T')[0];
      
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, new Map());
      }
      
      const gatewayMap = dailyMap.get(dateStr)!;
      if (!gatewayMap.has(tx.gateway)) {
        gatewayMap.set(tx.gateway, { revenue: 0, orders: new Set() });
      }
      
      const stats = gatewayMap.get(tx.gateway)!;
      stats.revenue += parseFloat(tx.amountEur);
      if (tx.orderId) stats.orders.add(tx.orderId);
    }
    
    // Convert to array
    const results: { date: string; revenue: number; orders: number; gateway: string }[] = [];
    
    for (const [date, gatewayMap] of dailyMap) {
      for (const [gateway, stats] of gatewayMap) {
        results.push({
          date,
          revenue: stats.revenue,
          orders: stats.orders.size,
          gateway,
        });
      }
    }
    
    // Sort by date
    results.sort((a, b) => a.date.localeCompare(b.date));
    
    return results;
  }
  
  async syncOrderPayments(): Promise<{ synced: number; errors: number }> {
    // Sync completed orders to payment_transactions table
    let synced = 0;
    let errors = 0;
    
    // Get all completed orders that don't have payment transactions yet
    const orders = await db.select().from(schema.orders)
      .where(and(
        eq(schema.orders.paymentStatus, 'paid'),
        isNotNull(schema.orders.stripePaymentIntentId)
      ));
    
    for (const order of orders) {
      try {
        // Check if already synced
        const [existing] = await db.select().from(schema.paymentTransactions)
          .where(eq(schema.paymentTransactions.orderId, order.id));
        
        if (existing) continue;
        
        // Get customer info
        let customerEmail = '';
        let customerName = '';
        if (order.userId) {
          const [user] = await db.select().from(schema.users)
            .where(eq(schema.users.id, order.userId));
          if (user) {
            customerEmail = user.email || '';
            customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          }
        }
        
        // Create payment transaction record
        const total = parseFloat(order.total);
        const vatAmount = total * 0.24 / 1.24; // Extract VAT from total (24% VAT included)
        
        await db.insert(schema.paymentTransactions).values({
          orderId: order.id,
          externalId: order.stripePaymentIntentId,
          gateway: order.paymentMethod === 'paypal' ? 'paypal' : 
                   order.paymentMethod === 'montonio' ? 'montonio' : 'stripe',
          type: 'payment',
          status: 'completed',
          amount: order.total,
          currency: 'EUR',
          amountEur: order.total,
          fee: '0.00', // Would need Stripe API to get actual fee
          netAmount: order.total,
          vatAmount: vatAmount.toFixed(2),
          customerEmail,
          customerName,
          description: `Order #${order.id}`,
          processedAt: order.createdAt,
        });
        
        synced++;
      } catch (error) {
        console.error(`Error syncing order ${order.id}:`, error);
        errors++;
      }
    }
    
    return { synced, errors };
  }
  
  // Seasonal Themes
  async getSeasonalThemes(): Promise<SeasonalTheme[]> {
    return db.select().from(schema.seasonalThemes)
      .orderBy(desc(schema.seasonalThemes.startDate));
  }
  
  async getSeasonalTheme(id: string): Promise<SeasonalTheme | undefined> {
    const [theme] = await db.select().from(schema.seasonalThemes)
      .where(eq(schema.seasonalThemes.id, id));
    return theme;
  }
  
  async getActiveSeasonalTheme(): Promise<SeasonalTheme | undefined> {
    const now = new Date();
    const [theme] = await db.select().from(schema.seasonalThemes)
      .where(and(
        eq(schema.seasonalThemes.isActive, true),
        lte(schema.seasonalThemes.startDate, now),
        gte(schema.seasonalThemes.endDate, now)
      ))
      .orderBy(desc(schema.seasonalThemes.startDate))
      .limit(1);
    return theme;
  }
  
  async createSeasonalTheme(theme: InsertSeasonalTheme): Promise<SeasonalTheme> {
    const [created] = await db.insert(schema.seasonalThemes).values(theme).returning();
    return created;
  }
  
  async updateSeasonalTheme(id: string, theme: Partial<InsertSeasonalTheme>): Promise<SeasonalTheme | undefined> {
    const [updated] = await db.update(schema.seasonalThemes)
      .set({ ...theme, updatedAt: new Date() })
      .where(eq(schema.seasonalThemes.id, id))
      .returning();
    return updated;
  }
  
  async deleteSeasonalTheme(id: string): Promise<void> {
    await db.delete(schema.seasonalThemes).where(eq(schema.seasonalThemes.id, id));
  }
}

export const storage = new DbStorage();
