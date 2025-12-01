import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema, insertOrderSchema, insertAddressSchema, insertBlogPostSchema, insertNewsletterSubscriberSchema, insertWishlistSchema, insertRecurringOrderSchema } from "@shared/schema";
import { parseCSV, generateCSVTemplate } from "./utils/csv";
import { emailService } from "./utils/email";
import { getShippingRates } from "./utils/shipping";
import { createStripePayment, createPayseraPayment } from "./utils/payments";
import { streamChatResponse, detectLanguage, searchProducts, getPersonaByName } from "./utils/chat";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { createMontonioPayment, handleMontonioWebhook, handleMontonioReturn } from "./montonio";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupLocalAuth } from "./localAuth";

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: "Unauthorized - Admin access required" });
  }
  next();
};

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = req.user as any;
  const userId = user?.claims?.sub || user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  (req as any).userId = userId;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  
  // Setup Local Email/Password Auth
  setupLocalAuth(app);
  
  // Get current authenticated user (supports both Replit Auth and local auth)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Support both Replit Auth (claims.sub) and local auth (id)
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Wishlist Routes (require authentication)
  app.get('/api/wishlist', requireAuth, async (req: any, res) => {
    try {
      const items = await storage.getWishlistItems(req.userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  });
  
  app.post('/api/wishlist', requireAuth, async (req: any, res) => {
    try {
      const { productId } = req.body;
      
      // Check if already in wishlist
      const exists = await storage.isInWishlist(req.userId, productId);
      if (exists) {
        return res.status(400).json({ error: "Already in wishlist" });
      }
      
      const item = await storage.addToWishlist({
        userId: req.userId,
        productId,
        notifyOnSale: true,
        notifyOnRestock: true,
      });
      res.json(item);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });
  
  app.delete('/api/wishlist/:productId', requireAuth, async (req: any, res) => {
    try {
      const { productId } = req.params;
      await storage.removeFromWishlist(req.userId, productId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ error: "Failed to remove from wishlist" });
    }
  });
  
  app.get('/api/wishlist/check/:productId', requireAuth, async (req: any, res) => {
    try {
      const { productId } = req.params;
      const inWishlist = await storage.isInWishlist(req.userId, productId);
      res.json({ inWishlist });
    } catch (error) {
      res.status(500).json({ error: "Failed to check wishlist" });
    }
  });
  
  // Recurring Orders Routes (require authentication)
  app.get('/api/recurring-orders', requireAuth, async (req: any, res) => {
    try {
      const orders = await storage.getRecurringOrders(req.userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching recurring orders:", error);
      res.status(500).json({ error: "Failed to fetch recurring orders" });
    }
  });
  
  app.post('/api/recurring-orders', requireAuth, async (req: any, res) => {
    try {
      const validated = insertRecurringOrderSchema.parse({ ...req.body, userId: req.userId });
      const order = await storage.createRecurringOrder(validated);
      res.json(order);
    } catch (error) {
      console.error("Error creating recurring order:", error);
      res.status(500).json({ error: "Failed to create recurring order" });
    }
  });
  
  app.patch('/api/recurring-orders/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateRecurringOrder(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating recurring order:", error);
      res.status(500).json({ error: "Failed to update recurring order" });
    }
  });
  
  app.delete('/api/recurring-orders/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRecurringOrder(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting recurring order:", error);
      res.status(500).json({ error: "Failed to delete recurring order" });
    }
  });

  // User Addresses Routes (require authentication)
  app.get('/api/addresses', requireAuth, async (req: any, res) => {
    try {
      const addresses = await storage.getUserAddresses(req.userId);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });

  app.post('/api/addresses', requireAuth, async (req: any, res) => {
    try {
      const addressData = { ...req.body, userId: req.userId };
      
      // If this is marked as default, unset other defaults first
      if (addressData.isDefault) {
        const existingAddresses = await storage.getUserAddresses(req.userId);
        for (const addr of existingAddresses) {
          if (addr.isDefault) {
            await storage.updateAddress(addr.id, { isDefault: false });
          }
        }
      }
      
      const address = await storage.createAddress(addressData);
      res.json(address);
    } catch (error) {
      console.error("Error creating address:", error);
      res.status(500).json({ error: "Failed to create address" });
    }
  });

  app.patch('/api/addresses/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // If marking as default, unset other defaults first
      if (req.body.isDefault) {
        const existingAddresses = await storage.getUserAddresses(req.userId);
        for (const addr of existingAddresses) {
          if (addr.isDefault && addr.id !== id) {
            await storage.updateAddress(addr.id, { isDefault: false });
          }
        }
      }
      
      const updated = await storage.updateAddress(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating address:", error);
      res.status(500).json({ error: "Failed to update address" });
    }
  });

  app.delete('/api/addresses/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAddress(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting address:", error);
      res.status(500).json({ error: "Failed to delete address" });
    }
  });

  // Admin Authentication Routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }
      
      // Use ADMIN_PASSWORD if set, otherwise fall back to SESSION_SECRET
      const adminPassword = process.env.ADMIN_PASSWORD || process.env.SESSION_SECRET;
      
      if (!adminPassword) {
        return res.status(500).json({ error: "Admin password not configured" });
      }
      
      if (password === adminPassword) {
        req.session.isAdmin = true;
        res.json({ success: true, message: "Admin login successful" });
      } else {
        res.status(401).json({ error: "Invalid admin password" });
      }
    } catch (error: any) {
      console.error('Error during admin login:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  
  app.post("/api/admin/logout", async (req, res) => {
    try {
      req.session.isAdmin = false;
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({ error: "Logout failed" });
        }
        res.json({ success: true, message: "Admin logout successful" });
      });
    } catch (error: any) {
      console.error('Error during admin logout:', error);
      res.status(500).json({ error: "Logout failed" });
    }
  });
  
  app.get("/api/admin/check", async (req, res) => {
    try {
      res.json({ isAdmin: req.session.isAdmin || false });
    } catch (error: any) {
      console.error('Error checking admin status:', error);
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });
  
  // Protected Admin Routes
  app.get("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const { page = '1', limit = '20', search, sort } = req.query;
      const products = await storage.getProducts({
        search: search as string,
        sort: sort as string,
      });
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      
      const paginatedProducts = products.slice(startIndex, endIndex);
      
      res.json({
        products: paginatedProducts,
        total: products.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(products.length / limitNum)
      });
    } catch (error: any) {
      console.error('Error fetching admin products:', error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  
  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const validated = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validated);
      res.status(201).json(product);
    } catch (error: any) {
      console.error('Error creating product:', error);
      res.status(400).json({ error: error.message || "Failed to create product" });
    }
  });
  
  app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const validated = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, validated);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error: any) {
      console.error('Error updating product:', error);
      res.status(400).json({ error: error.message || "Failed to update product" });
    }
  });
  
  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });
  
  // Admin Category Routes
  app.post("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const validated = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validated);
      res.status(201).json(category);
    } catch (error: any) {
      console.error('Error creating category:', error);
      res.status(400).json({ error: error.message || "Failed to create category" });
    }
  });
  
  app.put("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const validated = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validated);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(category);
    } catch (error: any) {
      console.error('Error updating category:', error);
      res.status(400).json({ error: error.message || "Failed to update category" });
    }
  });
  
  app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const products = await storage.getProducts({ categoryId: req.params.id });
      
      if (products.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete category with products. Please remove or reassign products first." 
        });
      }
      
      await storage.deleteCategory(req.params.id);
      res.json({ success: true, message: "Category deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });
  
  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
      const { status, page = '1', limit = '20' } = req.query;
      const orders = await storage.getOrders({
        status: status as string
      });
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      
      const paginatedOrders = orders.slice(startIndex, endIndex);
      
      res.json({
        orders: paginatedOrders,
        total: orders.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(orders.length / limitNum)
      });
    } catch (error: any) {
      console.error('Error fetching admin orders:', error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  
  app.put("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const { status, paymentStatus, trackingNumber } = req.body;
      
      if (!status && !paymentStatus && !trackingNumber) {
        return res.status(400).json({ error: "At least one field (status, paymentStatus, or trackingNumber) is required" });
      }
      
      if (status || paymentStatus) {
        await storage.updateOrderStatus(req.params.id, status, paymentStatus);
      }
      
      if (trackingNumber !== undefined) {
        await storage.updateOrderTracking(req.params.id, trackingNumber);
      }
      
      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error: any) {
      console.error('Error updating order:', error);
      res.status(500).json({ error: "Failed to update order" });
    }
  });
  
  app.get("/api/admin/orders/:id/items", requireAdmin, async (req, res) => {
    try {
      const items = await storage.getOrderItems(req.params.id);
      res.json(items);
    } catch (error: any) {
      console.error('Error fetching order items:', error);
      res.status(500).json({ error: "Failed to fetch order items" });
    }
  });
  
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const allProducts = await storage.getProducts();
      const allOrders = await storage.getOrders();
      const lowStockProducts = await storage.getLowStockProducts();
      
      // Calculate total revenue from paid orders
      const totalRevenue = allOrders
        .filter(order => order.paymentStatus === 'paid' || order.paymentStatus === 'completed')
        .reduce((sum, order) => sum + parseFloat(order.total), 0);
      
      // Get recent orders (last 10)
      const recentOrders = allOrders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
      
      res.json({
        totalProducts: allProducts.length,
        totalOrders: allOrders.length,
        lowStockCount: lowStockProducts.length,
        totalRevenue: totalRevenue.toFixed(2),
        recentOrders,
        lowStockProducts
      });
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  
  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });
  
  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, featured, search, sort } = req.query;
      const products = await storage.getProducts({
        categoryId: categoryId as string,
        featured: featured === 'true',
        search: search as string,
        sort: sort as string,
      });
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  
  app.get("/api/products/search/:query", async (req, res) => {
    try {
      const query = req.params.query;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const products = await storage.searchProducts(query, 10);
      res.json(products);
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ error: "Failed to search products" });
    }
  });
  
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });
  
  app.post("/api/products", async (req, res) => {
    try {
      const validated = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validated);
      res.status(201).json(product);
    } catch (error: any) {
      console.error('Error creating product:', error);
      res.status(400).json({ error: error.message || "Failed to create product" });
    }
  });
  
  // CSV Import
  app.get("/api/products/csv/template", (req, res) => {
    const template = generateCSVTemplate();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=product-template.csv');
    res.send(template);
  });
  
  app.post("/api/products/csv/import", async (req, res) => {
    try {
      const { csvContent } = req.body;
      if (!csvContent) {
        return res.status(400).json({ error: "CSV content is required" });
      }
      
      const products = parseCSV(csvContent);
      await storage.importProducts(products);
      
      res.json({ message: `Successfully imported ${products.length} products`, count: products.length });
    } catch (error: any) {
      console.error('Error importing products:', error);
      res.status(400).json({ error: error.message || "Failed to import products" });
    }
  });
  
  // Low stock alerts
  app.get("/api/products/alerts/low-stock", async (req, res) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock products" });
    }
  });
  
  // Shipping
  app.get("/api/shipping/rates", (req, res) => {
    const rates = getShippingRates();
    res.json(rates);
  });
  
  // Checkout
  app.post("/api/checkout/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = 'EUR', provider = 'stripe' } = req.body;
      
      if (provider === 'stripe') {
        const intent = await createStripePayment(amount, currency);
        res.json({ clientSecret: intent.id, provider: 'stripe' });
      } else if (provider === 'paysera') {
        const orderId = `temp-${Date.now()}`;
        const paymentUrl = await createPayseraPayment(amount, orderId, currency);
        res.json({ paymentUrl, provider: 'paysera' });
      } else {
        res.status(400).json({ error: "Invalid payment provider" });
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: error.message || "Failed to create payment intent" });
    }
  });
  
  // PayPal Integration (from blueprint:javascript_paypal)
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });
  
  app.post("/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });
  
  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });
  
  // Montonio Integration (JWT-based Baltic payment gateway)
  app.post("/api/payments/montonio", async (req, res) => {
    await createMontonioPayment(req, res);
  });
  
  // Montonio webhook - raw body already captured by global express.json middleware
  app.post("/api/payments/montonio/webhook", async (req, res) => {
    await handleMontonioWebhook(req, res);
  });
  
  app.get("/api/payments/montonio/return", async (req, res) => {
    await handleMontonioReturn(req, res);
  });
  
  // Orders
  app.post("/api/orders", async (req, res) => {
    try {
      const { order, items, language = 'en' } = req.body;
      
      // Validate order data
      const validatedOrder = insertOrderSchema.parse(order);
      
      // Create order
      const createdOrder = await storage.createOrder(validatedOrder, items);
      
      // Send confirmation email
      const orderItems = await storage.getOrderItems(createdOrder.id);
      await emailService.sendOrderConfirmation(createdOrder, orderItems, language);
      
      res.status(201).json(createdOrder);
    } catch (error: any) {
      console.error('Error creating order:', error);
      res.status(400).json({ error: error.message || "Failed to create order" });
    }
  });
  
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const items = await storage.getOrderItems(order.id);
      res.json({ ...order, items });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  
  app.get("/api/orders/number/:orderNumber", async (req, res) => {
    try {
      const order = await storage.getOrderByNumber(req.params.orderNumber);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const items = await storage.getOrderItems(order.id);
      res.json({ ...order, items });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  
  app.get("/api/user/:userId/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders({ userId: req.params.userId });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  
  // Blog
  app.get("/api/blog/posts", async (req, res) => {
    try {
      const { published } = req.query;
      const posts = await storage.getBlogPosts(published === 'true' || published === undefined);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });
  
  app.get("/api/blog/posts/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  });
  
  app.post("/api/blog/posts", async (req, res) => {
    try {
      const validated = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(validated);
      res.status(201).json(post);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create blog post" });
    }
  });
  
  // Newsletter
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email, language = 'en' } = req.body;
      const validated = insertNewsletterSubscriberSchema.parse({ email });
      const subscriber = await storage.subscribeNewsletter(validated);
      
      // Send welcome email
      await emailService.sendNewsletterWelcome(email, language);
      
      res.status(201).json({ message: "Successfully subscribed to newsletter" });
    } catch (error: any) {
      console.error('Error subscribing to newsletter:', error);
      res.status(400).json({ error: error.message || "Failed to subscribe" });
    }
  });
  
  // User Addresses
  app.get("/api/user/:userId/addresses", async (req, res) => {
    try {
      const addresses = await storage.getUserAddresses(req.params.userId);
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });
  
  app.post("/api/user/:userId/addresses", async (req, res) => {
    try {
      const validated = insertAddressSchema.parse({ ...req.body, userId: req.params.userId });
      const address = await storage.createAddress(validated);
      res.status(201).json(address);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create address" });
    }
  });
  
  // AI Support Chat
  app.post("/api/support/chat", async (req: any, res) => {
    try {
      const { sessionId, message, language: userLanguage } = req.body;
      
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Try to get authenticated user
      let userId: string | null = null;
      let userInfo: any = null;
      let userWishlist: any[] = [];
      let userAddresses: any[] = [];
      let userRecurringOrders: any[] = [];
      
      if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
      } else if (req.user?.id) {
        userId = req.user.id;
      }
      
      if (userId) {
        try {
          userInfo = await storage.getUser(userId);
          userWishlist = await storage.getWishlist(userId);
          userAddresses = await storage.getUserAddresses(userId);
          userRecurringOrders = await storage.getRecurringOrders(userId);
        } catch (e) {
          console.log('Could not fetch user context for chat:', e);
        }
      }
      
      let session;
      
      // ALWAYS detect language from the current message - ignore header language
      const detection = detectLanguage(message);
      let detectedLang: 'en' | 'et' = detection.language;
      let confidence = detection.confidence;
      
      // Get or create session
      if (sessionId) {
        session = await storage.getSupportSession(sessionId);
      }
      
      if (!session) {
        session = await storage.createSupportSession({
          language: detectedLang,
          languageConfidence: confidence.toString(),
          isActive: true,
        });
      } else {
        // Update session language if user switched languages
        if (session.language !== detectedLang && confidence > 0.6) {
          await storage.updateSupportSession(session.id, {
            language: detectedLang,
            languageConfidence: confidence.toString(),
          });
        }
      }
      
      // Save user message
      await storage.createSupportMessage({
        sessionId: session.id,
        role: 'user',
        content: message,
      });
      
      // Update last activity
      await storage.updateSupportSession(session.id, {
        lastActivity: new Date(),
      });
      
      // Get conversation history (last 20 messages for better context)
      const history = await storage.getSupportMessages(session.id);
      const sessionHistory = history.slice(-20).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Get all products and categories for context
      const allProducts = await storage.getProducts({});
      const categories = await storage.getCategories();
      
      // Search for relevant products based on message
      const relevantProducts = searchProducts(allProducts, message, detectedLang);
      
      // Try to extract order number from message
      const orderNumberMatch = message.match(/#?(\d{6,})/);
      let order;
      if (orderNumberMatch) {
        const orders = await storage.getOrders({});
        order = orders.find(o => o.orderNumber === orderNumberMatch[1]);
      }
      
      // Stream the response
      let fullResponse = '';
      const baseUrl = process.env.BASE_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'www.estzone.eu'}`;
      
      // Get persona from session or create new one
      let storedPersonaName: string | null = null;
      let storedPersonaLang: 'en' | 'et' | null = null;
      try {
        if (session.metadata) {
          const metadata = typeof session.metadata === 'string' ? JSON.parse(session.metadata) : session.metadata;
          storedPersonaName = metadata?.personaName || null;
        }
      } catch (e) {
        storedPersonaName = null;
      }
      
      let persona = storedPersonaName ? getPersonaByName(storedPersonaName) : undefined;
      
      // If user switched language, switch to a persona that speaks that language
      if (persona && persona.language !== detectedLang) {
        persona = undefined; // Will get new language-appropriate persona
        storedPersonaName = null;
      }
      
      const result = await streamChatResponse(
        message,
        detectedLang,
        {
          products: relevantProducts,
          allProducts,
          categories,
          order,
          sessionHistory,
          baseUrl,
          user: userInfo,
          wishlist: userWishlist,
          addresses: userAddresses,
          recurringOrders: userRecurringOrders,
        },
        (chunk) => {
          // Send SSE chunk
          res.write(`data: ${JSON.stringify({ chunk, sessionId: session.id })}\n\n`);
          fullResponse += chunk;
        },
        persona
      );
      
      // Store persona name in session metadata if new or changed
      if (result.personaName && result.personaName !== storedPersonaName) {
        await storage.updateSupportSession(session.id, {
          metadata: JSON.stringify({ personaName: result.personaName })
        });
      }
      
      // Save assistant response
      await storage.createSupportMessage({
        sessionId: session.id,
        role: 'assistant',
        content: fullResponse,
      });
      
      // Send completion signal with persona name
      res.write(`data: ${JSON.stringify({ done: true, sessionId: session.id, personaName: result.personaName })}\n\n`);
      res.end();
      
    } catch (error: any) {
      console.error('Chat error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  });
  
  // Get chat session history
  app.get("/api/support/session/:sessionId", async (req, res) => {
    try {
      const messages = await storage.getSupportMessages(req.params.sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });
  
  // Saved Cart Routes (for AI assistant cart sharing)
  app.post("/api/cart/share", async (req, res) => {
    try {
      const { items, customerEmail } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Cart items are required" });
      }
      
      const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const cart = await storage.createSavedCart({
        shareCode,
        items: JSON.stringify(items),
        customerEmail,
        expiresAt,
      });
      
      const baseUrl = process.env.BASE_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'www.estzone.eu'}`;
      
      res.json({
        shareCode: cart.shareCode,
        shareUrl: `${baseUrl}/cart?code=${cart.shareCode}`,
        expiresAt: cart.expiresAt,
      });
    } catch (error: any) {
      console.error('Error creating shared cart:', error);
      res.status(500).json({ error: "Failed to create shared cart" });
    }
  });
  
  app.get("/api/cart/share/:code", async (req, res) => {
    try {
      const cart = await storage.getSavedCart(req.params.code);
      
      if (!cart) {
        return res.status(404).json({ error: "Shared cart not found" });
      }
      
      if (cart.expiresAt && new Date(cart.expiresAt) < new Date()) {
        return res.status(410).json({ error: "Shared cart has expired" });
      }
      
      res.json({
        items: typeof cart.items === 'string' ? JSON.parse(cart.items) : cart.items,
        createdAt: cart.createdAt,
      });
    } catch (error: any) {
      console.error('Error fetching shared cart:', error);
      res.status(500).json({ error: "Failed to fetch shared cart" });
    }
  });
  
  // Return Request Routes (for AI assistant)
  app.post("/api/returns", async (req, res) => {
    try {
      const { orderNumber, reason, description, customerEmail, customerName } = req.body;
      
      if (!orderNumber || !reason) {
        return res.status(400).json({ error: "Order number and reason are required" });
      }
      
      const order = await storage.getOrderByNumber(orderNumber);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const orderDate = new Date(order.createdAt);
      const daysSinceOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceOrder > 14 && reason !== 'defective') {
        return res.status(400).json({ 
          error: "Return period has expired (14 days)",
          daysSinceOrder,
        });
      }
      
      const returnRequest = await storage.createReturnRequest({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: customerEmail || order.customerEmail,
        customerName: customerName || order.customerName,
        reason,
        description,
        status: 'pending',
        processedBy: 'ai_assistant',
      });
      
      res.status(201).json(returnRequest);
    } catch (error: any) {
      console.error('Error creating return request:', error);
      res.status(500).json({ error: "Failed to create return request" });
    }
  });
  
  app.get("/api/returns/:orderNumber", async (req, res) => {
    try {
      const returns = await storage.getReturnRequests({ orderNumber: req.params.orderNumber });
      res.json(returns);
    } catch (error: any) {
      console.error('Error fetching returns:', error);
      res.status(500).json({ error: "Failed to fetch returns" });
    }
  });
  
  // Order Cancellation (for AI assistant)
  app.post("/api/orders/:orderNumber/cancel", async (req, res) => {
    try {
      const order = await storage.getOrderByNumber(req.params.orderNumber);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      const canCancel = ['pending', 'paid', 'processing'].includes(order.status);
      
      if (!canCancel) {
        return res.status(400).json({ 
          error: "Order cannot be cancelled",
          reason: order.status === 'shipped' ? "Order has already been shipped" : "Order is in final state",
          currentStatus: order.status,
        });
      }
      
      await storage.updateOrderStatus(order.id, 'cancelled', 'refund_pending');
      
      res.json({
        success: true,
        message: "Order has been cancelled",
        orderNumber: order.orderNumber,
        refundAmount: order.total,
      });
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ error: "Failed to cancel order" });
    }
  });
  
  // Stock Check (for AI assistant)
  app.get("/api/products/:id/stock", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json({
        id: product.id,
        sku: product.sku,
        stock: product.stock,
        inStock: product.stock > 0,
        lowStock: product.stock > 0 && product.stock <= (product.lowStockThreshold || 10),
      });
    } catch (error: any) {
      console.error('Error checking stock:', error);
      res.status(500).json({ error: "Failed to check stock" });
    }
  });
  
  // Low Stock Products (for admin/AI)
  app.get("/api/products/low-stock", async (req, res) => {
    try {
      const lowStockProducts = await storage.getLowStockProducts();
      res.json(lowStockProducts);
    } catch (error: any) {
      console.error('Error fetching low stock products:', error);
      res.status(500).json({ error: "Failed to fetch low stock products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
