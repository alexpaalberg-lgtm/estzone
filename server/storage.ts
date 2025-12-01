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
} from '@shared/schema';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';

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
}

export const storage = new DbStorage();
