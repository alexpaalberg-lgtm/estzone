import { db } from './db';
import * as schema from '@shared/schema';
import type {
  User, InsertUser,
  Product, InsertProduct,
  Category, InsertCategory,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  Address, InsertAddress,
  BlogPost, InsertBlogPost,
  NewsletterSubscriber, InsertNewsletterSubscriber,
  SupportSession, InsertSupportSession,
  SupportMessage, InsertSupportMessage,
  StockReservation, InsertStockReservation,
  PaymentEvent, InsertPaymentEvent,
} from '@shared/schema';
import { eq, desc, and, sql, or, ilike } from 'drizzle-orm';

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  
  // Products
  getProducts(filters?: { categoryId?: string; featured?: boolean; search?: string }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getLowStockProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
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
  
  // Stock Reservations
  createReservation(orderId: string, items: InsertOrderItem[]): Promise<void>;
  commitReservation(orderId: string, paymentId: string): Promise<void>;
  commitReservationWithEvent(orderId: string, paymentId: string, eventId: string): Promise<void>;
  releaseReservation(orderId: string, reason: string): Promise<void>;
  releaseReservationWithEvent(orderId: string, reason: string, eventId: string): Promise<void>;
  expireOldReservations(): Promise<number>;
  getReservations(orderId: string): Promise<StockReservation[]>;
  
  // Payment Events (for idempotency)
  recordPaymentEvent(event: InsertPaymentEvent): Promise<PaymentEvent | null>;
  markPaymentEventProcessed(providerEventId: string): Promise<void>;
  isPaymentEventProcessed(providerEventId: string): Promise<boolean>;
  getPaymentEvent(providerEventId: string): Promise<PaymentEvent | undefined>;
  
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
  
  // Products
  async getProducts(filters?: { categoryId?: string; featured?: boolean; search?: string }): Promise<Product[]> {
    const conditions = [eq(schema.products.isActive, true)];
    
    if (filters?.categoryId) {
      conditions.push(eq(schema.products.categoryId, filters.categoryId));
    }
    if (filters?.featured) {
      conditions.push(eq(schema.products.isFeatured, true));
    }
    if (filters?.search && filters.search.trim()) {
      const searchTerm = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.products.nameEn, searchTerm),
          ilike(schema.products.nameEt, searchTerm),
          ilike(schema.products.descriptionEn, searchTerm),
          ilike(schema.products.descriptionEt, searchTerm)
        )!
      );
    }
    
    return db.select().from(schema.products)
      .where(and(...conditions))
      .orderBy(desc(schema.products.createdAt));
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
    
    // Set reservation expiry (15 minutes from now)
    const reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    const orderData = {
      ...order,
      orderNumber,
      reservationExpiresAt,
      paymentStatus: 'pending',
      status: 'pending',
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
    
    // Create stock reservations instead of immediately decrementing
    await this.createReservation(created.id, items);
    
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
  
  // Stock Reservation Methods
  async createReservation(orderId: string, items: InsertOrderItem[]): Promise<void> {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    for (const item of items) {
      await db.insert(schema.stockReservations).values({
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        status: 'reserved',
        expiresAt,
      });
    }
  }
  
  async commitReservationWithEvent(orderId: string, paymentId: string, eventId: string): Promise<void> {
    // ATOMIC: Entire flow in single transaction
    await db.transaction(async (tx) => {
      // Get all reservations for this order
      const reservations = await tx.select()
        .from(schema.stockReservations)
        .where(eq(schema.stockReservations.orderId, orderId));
      
      // Update stock levels atomically
      for (const reservation of reservations) {
        if (reservation.status === 'reserved') {
          // Decrement actual stock
          await tx.update(schema.products)
            .set({
              stock: sql`${schema.products.stock} - ${reservation.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(schema.products.id, reservation.productId));
          
          // Mark reservation as committed
          await tx.update(schema.stockReservations)
            .set({
              status: 'committed',
              releasedAt: new Date(),
              releaseReason: 'payment_success',
            })
            .where(eq(schema.stockReservations.id, reservation.id));
        }
      }
      
      // Update order payment status
      await tx.update(schema.orders)
        .set({
          paymentStatus: 'completed',
          paymentId,
          status: 'processing',
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, orderId));
      
      // Mark payment event as processed
      await tx.update(schema.paymentEvents)
        .set({
          processed: true,
          processedAt: new Date(),
        })
        .where(eq(schema.paymentEvents.providerEventId, eventId));
    });
  }
  
  async commitReservation(orderId: string, paymentId: string): Promise<void> {
    // Legacy method - kept for backward compatibility
    // Use commitReservationWithEvent for webhook processing
    const reservations = await this.getReservations(orderId);
    
    for (const reservation of reservations) {
      if (reservation.status === 'reserved') {
        await this.updateProductStock(reservation.productId, -reservation.quantity);
        
        await db.update(schema.stockReservations)
          .set({
            status: 'committed',
            releasedAt: new Date(),
            releaseReason: 'payment_success',
          })
          .where(eq(schema.stockReservations.id, reservation.id));
      }
    }
    
    await db.update(schema.orders)
      .set({
        paymentStatus: 'completed',
        paymentId,
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, orderId));
  }
  
  async releaseReservationWithEvent(orderId: string, reason: string, eventId: string): Promise<void> {
    // ATOMIC: Entire flow in single transaction
    await db.transaction(async (tx) => {
      // Mark all reservations as released
      await tx.update(schema.stockReservations)
        .set({
          status: 'released',
          releasedAt: new Date(),
          releaseReason: reason,
        })
        .where(
          and(
            eq(schema.stockReservations.orderId, orderId),
            eq(schema.stockReservations.status, 'reserved')
          )
        );
      
      // Update order status
      const updateData: any = {
        updatedAt: new Date(),
      };
      
      if (reason === 'payment_failed') {
        updateData.paymentStatus = 'failed';
        updateData.status = 'cancelled';
      }
      
      await tx.update(schema.orders)
        .set(updateData)
        .where(eq(schema.orders.id, orderId));
      
      // Mark payment event as processed
      await tx.update(schema.paymentEvents)
        .set({
          processed: true,
          processedAt: new Date(),
        })
        .where(eq(schema.paymentEvents.providerEventId, eventId));
    });
  }
  
  async releaseReservation(orderId: string, reason: string): Promise<void> {
    // Legacy method - kept for backward compatibility
    await db.update(schema.stockReservations)
      .set({
        status: 'released',
        releasedAt: new Date(),
        releaseReason: reason,
      })
      .where(
        and(
          eq(schema.stockReservations.orderId, orderId),
          eq(schema.stockReservations.status, 'reserved')
        )
      );
    
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (reason === 'payment_failed') {
      updateData.paymentStatus = 'failed';
      updateData.status = 'cancelled';
    }
    
    await db.update(schema.orders)
      .set(updateData)
      .where(eq(schema.orders.id, orderId));
  }
  
  async expireOldReservations(): Promise<number> {
    const now = new Date();
    
    // Find expired reservations
    const expired = await db.select()
      .from(schema.stockReservations)
      .where(
        and(
          eq(schema.stockReservations.status, 'reserved'),
          sql`${schema.stockReservations.expiresAt} < ${now}`
        )
      );
    
    // Release them
    for (const reservation of expired) {
      await this.releaseReservation(reservation.orderId, 'timeout');
    }
    
    return expired.length;
  }
  
  async getReservations(orderId: string): Promise<StockReservation[]> {
    return db.select()
      .from(schema.stockReservations)
      .where(eq(schema.stockReservations.orderId, orderId));
  }
  
  // Payment Event Methods (for idempotency)
  async recordPaymentEvent(event: InsertPaymentEvent): Promise<PaymentEvent | null> {
    // ATOMIC: Try to insert new event; if duplicate (unique constraint), return null
    try {
      const [created] = await db.insert(schema.paymentEvents)
        .values({
          ...event,
          processed: false, // Always start unprocessed
        })
        .onConflictDoNothing({ target: schema.paymentEvents.providerEventId })
        .returning();
      
      // If no row returned, it means this event already exists (idempotent retry)
      if (!created) {
        return null;
      }
      
      return created;
    } catch (error: any) {
      // If unique constraint violation somehow still happens, treat as idempotent retry
      if (error.code === '23505') { // PostgreSQL unique violation
        return null;
      }
      throw error;
    }
  }
  
  async markPaymentEventProcessed(providerEventId: string): Promise<void> {
    await db.update(schema.paymentEvents)
      .set({
        processed: true,
        processedAt: new Date(),
      })
      .where(eq(schema.paymentEvents.providerEventId, providerEventId));
  }
  
  async isPaymentEventProcessed(providerEventId: string): Promise<boolean> {
    const [event] = await db.select()
      .from(schema.paymentEvents)
      .where(eq(schema.paymentEvents.providerEventId, providerEventId));
    return !!event?.processed;
  }
  
  async getPaymentEvent(providerEventId: string): Promise<PaymentEvent | undefined> {
    const [event] = await db.select()
      .from(schema.paymentEvents)
      .where(eq(schema.paymentEvents.providerEventId, providerEventId));
    return event;
  }
}

export const storage = new DbStorage();
