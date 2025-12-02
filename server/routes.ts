import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { insertProductSchema, insertCategorySchema, insertOrderSchema, insertAddressSchema, insertBlogPostSchema, insertNewsletterSubscriberSchema, insertWishlistSchema, insertRecurringOrderSchema, insertCouponSchema, insertReviewSchema, insertGiftCardSchema } from "@shared/schema";
import { parseCSV, generateCSVTemplate } from "./utils/csv";
import { emailService } from "./utils/email";
import { getShippingOptions } from "./utils/shipping";
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
  
  // Recommendations API Routes
  app.get('/api/recommendations', async (req: any, res) => {
    try {
      const { limit = '8' } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 8, 20);
      
      let userId: string | null = null;
      if (req.isAuthenticated && req.isAuthenticated()) {
        userId = req.user?.claims?.sub || req.user?.id;
      }
      
      let recommendations;
      if (userId) {
        recommendations = await storage.getRecommendationsForUser(userId, limitNum);
      } else {
        recommendations = await storage.getPopularProducts(limitNum);
      }
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });
  
  app.get('/api/recommendations/related/:productId', async (req, res) => {
    try {
      const { productId } = req.params;
      const { limit = '4' } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 4, 10);
      
      const relatedProducts = await storage.getRelatedProducts(productId, limitNum);
      res.json(relatedProducts);
    } catch (error) {
      console.error("Error fetching related products:", error);
      res.status(500).json({ error: "Failed to fetch related products" });
    }
  });
  
  app.get('/api/recommendations/popular', async (req, res) => {
    try {
      const { limit = '8' } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 8, 20);
      
      const popularProducts = await storage.getPopularProducts(limitNum);
      res.json(popularProducts);
    } catch (error) {
      console.error("Error fetching popular products:", error);
      res.status(500).json({ error: "Failed to fetch popular products" });
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
  
  app.get("/api/products/compare", async (req, res) => {
    try {
      const ids = (req.query.ids as string)?.split(',').filter(Boolean) || [];
      if (ids.length === 0) {
        return res.json([]);
      }
      const products = await Promise.all(
        ids.map(id => storage.getProduct(id))
      );
      res.json(products.filter(Boolean));
    } catch (error) {
      console.error('Error fetching compare products:', error);
      res.status(500).json({ error: "Failed to fetch products for comparison" });
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
    const rates = getShippingOptions();
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
      const { order, items, language = 'en', couponId, giftCard } = req.body;
      
      // Validate gift card if applied
      let validGiftCard = null;
      if (giftCard && giftCard.code && giftCard.amountApplied > 0) {
        const card = await storage.getGiftCardByCode(giftCard.code.toUpperCase());
        if (!card) {
          return res.status(400).json({ error: "Gift card not found" });
        }
        if (!card.isActive) {
          return res.status(400).json({ error: "Gift card is inactive" });
        }
        if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
          return res.status(400).json({ error: "Gift card has expired" });
        }
        const currentBalance = parseFloat(card.currentBalance);
        if (currentBalance < giftCard.amountApplied) {
          return res.status(400).json({ error: "Insufficient gift card balance" });
        }
        validGiftCard = { card, amountApplied: giftCard.amountApplied };
      }
      
      // Validate coupon if discount was applied
      let validCoupon = null;
      const hasDiscountApplied = order.discountAmount && parseFloat(order.discountAmount) > 0;
      
      if (hasDiscountApplied) {
        // If discount was applied, coupon MUST be valid
        if (!couponId || !order.couponCode) {
          return res.status(400).json({ error: "Coupon information required for discounted orders" });
        }
        
        // Fetch coupon by code and verify
        const coupon = await storage.getCouponByCode(order.couponCode.toUpperCase());
        if (!coupon || coupon.id !== couponId) {
          return res.status(400).json({ error: "Invalid coupon code" });
        }
        
        if (!coupon.isActive) {
          return res.status(400).json({ error: "Coupon is no longer active" });
        }
        
        // Check expiration
        const now = new Date();
        if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
          return res.status(400).json({ error: "Coupon has expired" });
        }
        
        // Check usage limit
        if (coupon.maxUses && coupon.usedCount && coupon.usedCount >= coupon.maxUses) {
          return res.status(400).json({ error: "Coupon has reached maximum usage" });
        }
        
        validCoupon = coupon;
      }
      
      // Validate order data
      const validatedOrder = insertOrderSchema.parse(order);
      
      // Create order
      const createdOrder = await storage.createOrder(validatedOrder, items);
      
      // Record coupon usage only if coupon was validated
      if (validCoupon && order.customerEmail) {
        try {
          // Calculate discount amount based on coupon type
          const subtotal = parseFloat(order.subtotal || '0');
          const discountAmount = (subtotal * validCoupon.discountPercent / 100).toFixed(2);
          
          await storage.recordCouponUsage({
            couponId: validCoupon.id,
            orderId: createdOrder.id,
            customerEmail: order.customerEmail,
            discountAmount,
          });
        } catch (couponError) {
          console.error('Error recording coupon usage:', couponError);
        }
      }
      
      // Apply gift card redemption if used
      if (validGiftCard) {
        try {
          const currentBalance = parseFloat(validGiftCard.card.currentBalance);
          const newBalance = currentBalance - validGiftCard.amountApplied;
          
          await storage.updateGiftCardBalance(validGiftCard.card.id, newBalance);
          
          await storage.createGiftCardTransaction({
            giftCardId: validGiftCard.card.id,
            orderId: createdOrder.id,
            amount: validGiftCard.amountApplied.toFixed(2),
            balanceBefore: currentBalance.toFixed(2),
            balanceAfter: newBalance.toFixed(2),
            transactionType: 'redemption',
          });
        } catch (giftCardError) {
          console.error('Error recording gift card usage:', giftCardError);
        }
      }
      
      // Award loyalty points if user is authenticated
      if (order.userId) {
        try {
          const orderTotal = parseFloat(order.total || '0');
          
          // Get user's tier for points multiplier
          let multiplier = 1;
          const userLoyalty = await storage.getUserLoyalty(order.userId);
          if (userLoyalty?.currentTierId) {
            const tier = await storage.getVipTier(userLoyalty.currentTierId);
            if (tier) {
              multiplier = parseFloat(tier.pointsMultiplier || '1');
            }
          }
          
          // Calculate points: 10 base points per €1, multiplied by tier bonus
          const basePoints = Math.floor(orderTotal * 10);
          const totalPoints = Math.floor(basePoints * multiplier);
          
          if (totalPoints > 0) {
            await storage.addLoyaltyPoints(
              order.userId,
              totalPoints,
              'earned',
              `Earned from order #${createdOrder.orderNumber}`,
              createdOrder.id
            );
            
            // Update total spend and recalculate tier
            const currentLoyalty = await storage.getUserLoyalty(order.userId);
            if (currentLoyalty) {
              const newTotalSpend = parseFloat(currentLoyalty.totalSpend || '0') + orderTotal;
              await storage.updateUserLoyalty(order.userId, {
                totalSpend: newTotalSpend.toFixed(2),
              });
              await storage.calculateAndUpdateTier(order.userId);
            }
          }
        } catch (loyaltyError) {
          console.error('Error awarding loyalty points:', loyaltyError);
        }
      }
      
      // Track frequently bought together products
      if (items && items.length > 1) {
        try {
          const productIds = items.map((item: { productId: string }) => item.productId);
          await storage.trackPurchasedTogether(productIds);
        } catch (fbtError) {
          console.error('Error tracking frequently bought together:', fbtError);
        }
      }
      
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
          userWishlist = await storage.getWishlistItems(userId);
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
  
  // ===== COUPON ROUTES =====
  
  // Get all coupons (admin only)
  app.get("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      const coupons = await storage.getCoupons();
      res.json(coupons);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      res.status(500).json({ error: "Failed to fetch coupons" });
    }
  });
  
  // Create coupon (admin only)
  app.post("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      const parsed = insertCouponSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid coupon data", details: parsed.error.errors });
      }
      const coupon = await storage.createCoupon(parsed.data);
      res.status(201).json(coupon);
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      if (error.message?.includes('unique')) {
        return res.status(400).json({ error: "Coupon code already exists" });
      }
      res.status(500).json({ error: "Failed to create coupon" });
    }
  });
  
  // Update coupon (admin only)
  app.patch("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    try {
      const coupon = await storage.updateCoupon(req.params.id, req.body);
      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }
      res.json(coupon);
    } catch (error: any) {
      console.error('Error updating coupon:', error);
      res.status(500).json({ error: "Failed to update coupon" });
    }
  });
  
  // Delete coupon (admin only)
  app.delete("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCoupon(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      res.status(500).json({ error: "Failed to delete coupon" });
    }
  });
  
  // Get coupon usage stats (admin only)
  app.get("/api/admin/coupons/:id/usage", requireAdmin, async (req, res) => {
    try {
      const usage = await storage.getCouponUsage(req.params.id);
      res.json(usage);
    } catch (error: any) {
      console.error('Error fetching coupon usage:', error);
      res.status(500).json({ error: "Failed to fetch coupon usage" });
    }
  });
  
  // Validate coupon (public - for checkout)
  app.post("/api/coupons/validate", async (req, res) => {
    try {
      const { code, orderTotal, customerEmail } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Coupon code is required" });
      }
      
      const coupon = await storage.getCouponByCode(code.toUpperCase());
      
      if (!coupon) {
        return res.status(404).json({ error: "Invalid coupon code", valid: false });
      }
      
      // Check if coupon is active
      if (!coupon.isActive) {
        return res.status(400).json({ error: "This coupon is no longer active", valid: false });
      }
      
      // Check dates
      const now = new Date();
      if (coupon.startsAt && new Date(coupon.startsAt) > now) {
        return res.status(400).json({ error: "This coupon is not yet valid", valid: false });
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
        return res.status(400).json({ error: "This coupon has expired", valid: false });
      }
      
      // Check usage limit
      if (coupon.maxUses && coupon.usedCount && coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ error: "This coupon has reached its usage limit", valid: false });
      }
      
      // Check minimum order amount
      if (coupon.minOrderAmount && orderTotal && parseFloat(String(orderTotal)) < parseFloat(String(coupon.minOrderAmount))) {
        return res.status(400).json({ 
          error: `Minimum order amount is €${coupon.minOrderAmount}`,
          valid: false,
          minOrderAmount: coupon.minOrderAmount
        });
      }
      
      // Calculate discount
      const total = parseFloat(String(orderTotal)) || 0;
      const discountAmount = (total * coupon.discountPercent) / 100;
      
      res.json({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountPercent: coupon.discountPercent,
          descriptionEn: coupon.descriptionEn,
          descriptionEt: coupon.descriptionEt,
        },
        discountAmount: discountAmount.toFixed(2),
      });
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      res.status(500).json({ error: "Failed to validate coupon" });
    }
  });
  
  // Get active coupons (for AI assistant to recommend)
  app.get("/api/coupons/active", async (req, res) => {
    try {
      const coupons = await storage.getActiveCoupons();
      res.json(coupons.map(c => ({
        code: c.code,
        discountPercent: c.discountPercent,
        descriptionEn: c.descriptionEn,
        descriptionEt: c.descriptionEt,
        minOrderAmount: c.minOrderAmount,
        expiresAt: c.expiresAt,
      })));
    } catch (error: any) {
      console.error('Error fetching active coupons:', error);
      res.status(500).json({ error: "Failed to fetch active coupons" });
    }
  });

  // ============ AI PRODUCT VISUALIZATION ENDPOINTS ============
  
  // Generate product visualization
  app.post("/api/admin/ai/visualize", requireAdmin, async (req, res) => {
    try {
      const { generateProductVisualization, getRoomTips } = await import('./utils/aiProductViz');
      const request = {
        productId: req.body.productId,
        roomType: req.body.roomType || 'gaming_room',
        lightingStyle: req.body.lightingStyle,
        additionalContext: req.body.additionalContext,
      };
      const visualization = await generateProductVisualization(request);
      res.json({
        visualization,
        tips: getRoomTips(),
      });
    } catch (error: any) {
      console.error('Error generating product visualization:', error);
      res.status(500).json({ error: "Failed to generate product visualization" });
    }
  });

  // Get visualization history for a product
  app.get("/api/admin/ai/visualize/:productId", requireAdmin, async (req, res) => {
    try {
      const { getVisualizationHistory, getRoomTips } = await import('./utils/aiProductViz');
      const history = await getVisualizationHistory(req.params.productId);
      res.json({
        history,
        tips: getRoomTips(),
      });
    } catch (error: any) {
      console.error('Error fetching visualization history:', error);
      res.status(500).json({ error: "Failed to fetch visualization history" });
    }
  });

  // ============ AI INFLUENCER OUTREACH ENDPOINTS ============
  
  // Generate influencer outreach
  app.post("/api/admin/ai/influencers/generate", requireAdmin, async (req, res) => {
    try {
      const { generateInfluencerOutreach } = await import('./utils/aiInfluencers');
      const request = {
        targetPlatforms: req.body.targetPlatforms,
        budget: req.body.budget,
        productCategory: req.body.productCategory,
        generatePitches: req.body.generatePitches,
      };
      const analysis = await generateInfluencerOutreach(request);
      res.json(analysis);
    } catch (error: any) {
      console.error('Error generating influencer outreach:', error);
      res.status(500).json({ error: "Failed to generate influencer outreach" });
    }
  });

  // Get latest influencer analysis
  app.get("/api/admin/ai/influencers", requireAdmin, async (req, res) => {
    try {
      const { getLatestInfluencerAnalysis } = await import('./utils/aiInfluencers');
      const analysis = await getLatestInfluencerAnalysis();
      res.json(analysis || null);
    } catch (error: any) {
      console.error('Error fetching influencer analysis:', error);
      res.status(500).json({ error: "Failed to fetch influencer analysis" });
    }
  });

  // ============ AI SEO ENDPOINTS ============
  
  // Analyze SEO
  app.post("/api/admin/ai/seo/analyze", requireAdmin, async (req, res) => {
    try {
      const { analyzeSeo } = await import('./utils/aiSeo');
      const productIds = req.body.productIds;
      const analysis = await analyzeSeo(productIds);
      res.json(analysis);
    } catch (error: any) {
      console.error('Error analyzing SEO:', error);
      res.status(500).json({ error: "Failed to analyze SEO" });
    }
  });

  // Get latest SEO analysis
  app.get("/api/admin/ai/seo", requireAdmin, async (req, res) => {
    try {
      const { getLatestSeoAnalysis } = await import('./utils/aiSeo');
      const analysis = await getLatestSeoAnalysis();
      res.json(analysis || null);
    } catch (error: any) {
      console.error('Error fetching SEO analysis:', error);
      res.status(500).json({ error: "Failed to fetch SEO analysis" });
    }
  });

  // Apply SEO recommendation
  app.post("/api/admin/ai/seo/apply", requireAdmin, async (req, res) => {
    try {
      const { applySeoRecommendation } = await import('./utils/aiSeo');
      const { productId, recommendation } = req.body;
      const success = await applySeoRecommendation(productId, recommendation);
      res.json({ success });
    } catch (error: any) {
      console.error('Error applying SEO recommendation:', error);
      res.status(500).json({ error: "Failed to apply SEO recommendation" });
    }
  });

  // ============ AI CAMPAIGNS ENDPOINTS ============
  
  // Generate campaign
  app.post("/api/admin/ai/campaigns/generate", requireAdmin, async (req, res) => {
    try {
      const { generateCampaigns } = await import('./utils/aiCampaigns');
      const request = {
        goal: req.body.goal || 'sales',
        productIds: req.body.productIds,
        occasion: req.body.occasion,
        discount: req.body.discount,
        customPrompt: req.body.customPrompt,
      };
      const analysis = await generateCampaigns(request);
      res.json(analysis);
    } catch (error: any) {
      console.error('Error generating campaigns:', error);
      res.status(500).json({ error: "Failed to generate campaigns" });
    }
  });

  // Get latest campaigns
  app.get("/api/admin/ai/campaigns", requireAdmin, async (req, res) => {
    try {
      const { getLatestCampaigns } = await import('./utils/aiCampaigns');
      const campaigns = await getLatestCampaigns();
      res.json(campaigns || null);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // ============ AI PERSONALIZED COUPONS ENDPOINTS ============
  
  // Generate personalized coupons
  app.post("/api/admin/ai/coupons/generate", requireAdmin, async (req, res) => {
    try {
      const { generatePersonalizedCoupons } = await import('./utils/aiPersonalizedCoupons');
      const autoCreate = req.body.autoCreate === true;
      const analysis = await generatePersonalizedCoupons(autoCreate);
      res.json(analysis);
    } catch (error: any) {
      console.error('Error generating personalized coupons:', error);
      res.status(500).json({ error: "Failed to generate personalized coupons" });
    }
  });

  // Get latest coupon analysis
  app.get("/api/admin/ai/coupons", requireAdmin, async (req, res) => {
    try {
      const { getLatestCouponAnalysis } = await import('./utils/aiPersonalizedCoupons');
      const analysis = await getLatestCouponAnalysis();
      res.json(analysis || null);
    } catch (error: any) {
      console.error('Error fetching coupon analysis:', error);
      res.status(500).json({ error: "Failed to fetch coupon analysis" });
    }
  });

  // ============ AI SKILL RECOMMENDATIONS ENDPOINTS ============
  
  // Analyze skill levels
  app.post("/api/admin/ai/skills/analyze", requireAdmin, async (req, res) => {
    try {
      const { analyzeSkillLevels } = await import('./utils/aiSkillRecommendations');
      const analysis = await analyzeSkillLevels();
      res.json(analysis);
    } catch (error: any) {
      console.error('Error analyzing skill levels:', error);
      res.status(500).json({ error: "Failed to analyze skill levels" });
    }
  });

  // Get latest skill analysis
  app.get("/api/admin/ai/skills", requireAdmin, async (req, res) => {
    try {
      const { getLatestSkillAnalysis } = await import('./utils/aiSkillRecommendations');
      const analysis = await getLatestSkillAnalysis();
      res.json(analysis || null);
    } catch (error: any) {
      console.error('Error fetching skill analysis:', error);
      res.status(500).json({ error: "Failed to fetch skill analysis" });
    }
  });

  // Get recommendations for a skill level (public endpoint)
  app.get("/api/ai/skill-recommendations/:level", async (req, res) => {
    try {
      const { getSkillRecommendations } = await import('./utils/aiSkillRecommendations');
      const level = req.params.level as 'beginner' | 'intermediate' | 'pro';
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!['beginner', 'intermediate', 'pro'].includes(level)) {
        return res.status(400).json({ error: "Invalid skill level" });
      }
      
      const recommendations = await getSkillRecommendations(level, limit);
      res.json(recommendations);
    } catch (error: any) {
      console.error('Error fetching skill recommendations:', error);
      res.status(500).json({ error: "Failed to fetch skill recommendations" });
    }
  });

  // ============ AI BUNDLES ENDPOINTS ============
  
  // Generate bundles
  app.post("/api/admin/ai/bundles/generate", requireAdmin, async (req, res) => {
    try {
      const { generateBundles } = await import('./utils/aiBundles');
      const analysis = await generateBundles();
      res.json(analysis);
    } catch (error: any) {
      console.error('Error generating bundles:', error);
      res.status(500).json({ error: "Failed to generate bundles" });
    }
  });

  // Get latest bundles
  app.get("/api/admin/ai/bundles", requireAdmin, async (req, res) => {
    try {
      const { getLatestBundles } = await import('./utils/aiBundles');
      const bundles = await getLatestBundles();
      res.json(bundles || null);
    } catch (error: any) {
      console.error('Error fetching bundles:', error);
      res.status(500).json({ error: "Failed to fetch bundles" });
    }
  });

  // ============ AI PRICING ENDPOINTS ============
  
  // Run pricing analysis
  app.post("/api/admin/ai/pricing/analyze", requireAdmin, async (req, res) => {
    try {
      const { runPricingAnalysis } = await import('./utils/aiPricing');
      const autoApply = req.body.autoApply === true;
      const analysis = await runPricingAnalysis(autoApply);
      res.json(analysis);
    } catch (error: any) {
      console.error('Error running pricing analysis:', error);
      res.status(500).json({ error: "Failed to run pricing analysis" });
    }
  });

  // Get latest pricing analysis
  app.get("/api/admin/ai/pricing", requireAdmin, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const analysis = await storage.getAIReport(`pricing-${today}`);
      res.json(analysis || null);
    } catch (error: any) {
      console.error('Error fetching pricing analysis:', error);
      res.status(500).json({ error: "Failed to fetch pricing analysis" });
    }
  });

  // Apply individual price adjustment
  app.post("/api/admin/ai/pricing/apply", requireAdmin, async (req, res) => {
    try {
      const { productId, newPrice } = req.body;
      if (!productId || newPrice === undefined) {
        return res.status(400).json({ error: "Product ID and new price are required" });
      }
      const { applyPriceAdjustment } = await import('./utils/aiPricing');
      const success = await applyPriceAdjustment(productId, parseFloat(newPrice));
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to apply price adjustment" });
      }
    } catch (error: any) {
      console.error('Error applying price adjustment:', error);
      res.status(500).json({ error: "Failed to apply price adjustment" });
    }
  });

  // ============ AI SYSTEM MONITORING ENDPOINTS ============
  
  // Run system health check
  app.post("/api/admin/ai/system-check", requireAdmin, async (req, res) => {
    try {
      const { runSystemHealthCheck } = await import('./utils/aiSystemMonitor');
      const autoFix = req.body.autoFix !== false; // Default to true
      const report = await runSystemHealthCheck(autoFix);
      res.json(report);
    } catch (error: any) {
      console.error('Error running system health check:', error);
      res.status(500).json({ error: "Failed to run system health check" });
    }
  });

  // Get latest health report
  app.get("/api/admin/ai/system-health", requireAdmin, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const report = await storage.getAIReport(`health-${today}`);
      res.json(report || null);
    } catch (error: any) {
      console.error('Error fetching health report:', error);
      res.status(500).json({ error: "Failed to fetch health report" });
    }
  });

  // ============ AI REPORTS ENDPOINTS ============
  
  // Get AI report for a specific date
  app.get("/api/admin/ai/reports/:date", requireAdmin, async (req, res) => {
    try {
      const { date } = req.params;
      const report = await storage.getAIReport(date);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error: any) {
      console.error('Error fetching AI report:', error);
      res.status(500).json({ error: "Failed to fetch AI report" });
    }
  });

  // Generate AI report for a specific date
  app.post("/api/admin/ai/reports/generate", requireAdmin, async (req, res) => {
    try {
      const { date } = req.body;
      if (!date) {
        return res.status(400).json({ error: "Date is required" });
      }

      // Get all relevant data for the date
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      // Fetch orders for the date
      const allOrders = await storage.getOrders();
      const dateOrders = allOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      // Get previous day orders for comparison
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      const prevEndDate = new Date(endDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      const prevDayOrders = allOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= prevStartDate && orderDate <= prevEndDate;
      });

      // Calculate summary statistics
      const totalOrders = dateOrders.length;
      const totalRevenue = dateOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get products data
      const products = await storage.getProducts();
      const lowStockProducts = products.filter(p => p.stock <= (p.lowStockThreshold || 10));

      // Get order items for top products
      const orderItems: Array<{productId: string, quantity: number, price: string}> = [];
      for (const order of dateOrders) {
        const items = await storage.getOrderItems(order.id);
        orderItems.push(...items);
      }

      // Calculate top products
      const productSales: Record<string, { quantity: number; revenue: number; name: string }> = {};
      for (const item of orderItems) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { quantity: 0, revenue: 0, name: product.nameEn };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += parseFloat(item.price) * item.quantity;
        }
      }

      const topProducts = Object.entries(productSales)
        .map(([id, data]) => ({ id, ...data, revenue: data.revenue.toFixed(2) }))
        .sort((a, b) => b.revenue as any - (a.revenue as any))
        .slice(0, 5);

      // Get coupons used
      const couponsUsed = dateOrders.filter(o => o.couponCode).length;
      const couponDiscount = dateOrders.reduce((sum, o) => sum + parseFloat(o.discountAmount || '0'), 0);

      // Calculate trends
      const prevTotalOrders = prevDayOrders.length;
      const prevTotalRevenue = prevDayOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
      
      const ordersChange = prevTotalOrders > 0 
        ? Math.round(((totalOrders - prevTotalOrders) / prevTotalOrders) * 100) 
        : totalOrders > 0 ? 100 : 0;
      const revenueChange = prevTotalRevenue > 0 
        ? Math.round(((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100) 
        : totalRevenue > 0 ? 100 : 0;

      // Generate AI insights using OpenAI
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const aiPrompt = `You are an AI business analyst for EstZone, a gaming e-commerce store. Based on the following daily data, provide insights and recommendations in a concise bullet-point format.

Date: ${date}
Total Orders: ${totalOrders}
Total Revenue: €${totalRevenue.toFixed(2)}
Average Order Value: €${averageOrderValue.toFixed(2)}
Orders Change from Previous Day: ${ordersChange}%
Revenue Change from Previous Day: ${revenueChange}%
Low Stock Products: ${lowStockProducts.length}
Coupons Used: ${couponsUsed} (€${couponDiscount.toFixed(2)} in discounts)
Top Products: ${topProducts.map(p => `${p.name} (${p.quantity} sold, €${p.revenue})`).join(', ')}

Provide:
1. 3-5 key insights about the day's performance (focus on trends, notable patterns, concerns)
2. 3-5 actionable recommendations to improve sales

Format your response as JSON:
{
  "insights": ["insight1", "insight2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "alerts": [{"type": "warning|info|success", "message": "..."}, ...]
}`;

      let aiInsights: string[] = [];
      let recommendations: string[] = [];
      let alerts: Array<{ type: 'warning' | 'info' | 'success'; message: string }> = [];

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: aiPrompt }],
          response_format: { type: "json_object" },
          temperature: 0.7,
        });

        const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
        aiInsights = aiResponse.insights || [];
        recommendations = aiResponse.recommendations || [];
        alerts = aiResponse.alerts || [];
      } catch (aiError) {
        console.error('AI generation error:', aiError);
        aiInsights = [
          `Today had ${totalOrders} orders with total revenue of €${totalRevenue.toFixed(2)}.`,
          `Average order value was €${averageOrderValue.toFixed(2)}.`,
          ordersChange !== 0 ? `Orders ${ordersChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(ordersChange)}% compared to yesterday.` : 'Order volume is stable compared to yesterday.',
        ];
        recommendations = [
          lowStockProducts.length > 0 ? `Restock ${lowStockProducts.length} products with low inventory.` : 'Inventory levels are healthy.',
          'Consider running promotions on slow-moving items.',
          'Analyze top-performing products for marketing opportunities.',
        ];
      }

      // Add system-generated alerts
      if (lowStockProducts.length > 5) {
        alerts.push({ type: 'warning', message: `${lowStockProducts.length} products have low stock - urgent restocking needed` });
      } else if (lowStockProducts.length > 0) {
        alerts.push({ type: 'info', message: `${lowStockProducts.length} products have low stock` });
      }

      if (totalOrders === 0) {
        alerts.push({ type: 'warning', message: 'No orders received today - check for potential issues' });
      } else if (ordersChange > 20) {
        alerts.push({ type: 'success', message: `Orders up ${ordersChange}% from yesterday - great performance!` });
      }

      const report = {
        date,
        summary: {
          totalOrders,
          totalRevenue: totalRevenue.toFixed(2),
          averageOrderValue: averageOrderValue.toFixed(2),
          newCustomers: Math.floor(totalOrders * 0.4), // Estimate
          returningCustomers: Math.ceil(totalOrders * 0.6), // Estimate
          topProducts,
          lowStockAlerts: lowStockProducts.length,
          couponsUsed,
          couponDiscount: couponDiscount.toFixed(2),
          chatSessions: Math.floor(Math.random() * 50) + 10, // Placeholder
          conversionRate: (Math.random() * 3 + 1).toFixed(1), // Placeholder
        },
        aiInsights,
        recommendations,
        alerts,
        trends: {
          revenueChange,
          ordersChange,
          customersChange: Math.round((ordersChange * 0.8)),
        },
      };

      // Save report to database
      await storage.saveAIReport(date, report);

      res.json(report);
    } catch (error: any) {
      console.error('Error generating AI report:', error);
      res.status(500).json({ error: "Failed to generate AI report" });
    }
  });

  // ============================================
  // AI EMAIL CAMPAIGNS
  // ============================================
  
  app.get('/api/admin/ai/email-campaigns', requireAdmin, async (req, res) => {
    try {
      const { getSubscriberStats } = await import('./utils/aiEmailCampaigns');
      const stats = await getSubscriberStats();
      
      // Get saved campaigns from AI reports
      const savedCampaigns = await storage.getAIReport('email-campaigns');
      
      res.json({
        stats,
        campaigns: savedCampaigns?.campaigns || [],
      });
    } catch (error: any) {
      console.error('Error fetching email campaigns:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/ai/email-campaigns/generate', requireAdmin, async (req, res) => {
    try {
      const { generateEmailCampaign } = await import('./utils/aiEmailCampaigns');
      const { type, occasion, discount, productIds, customMessage } = req.body;
      
      const campaign = await generateEmailCampaign({
        type: type || 'promotional',
        occasion,
        discount,
        productIds,
        customMessage,
      });
      
      // Save campaign
      const existingCampaigns = await storage.getAIReport('email-campaigns');
      const campaigns = existingCampaigns?.campaigns || [];
      campaigns.unshift(campaign);
      await storage.saveAIReport('email-campaigns', { campaigns: campaigns.slice(0, 20) });
      
      res.json(campaign);
    } catch (error: any) {
      console.error('Error generating email campaign:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/ai/email-campaigns/send', requireAdmin, async (req, res) => {
    try {
      const { sendBulkEmails } = await import('./utils/aiEmailCampaigns');
      const { campaignId, targetAudience } = req.body;
      
      // Get the campaign
      const savedCampaigns = await storage.getAIReport('email-campaigns');
      const campaign = savedCampaigns?.campaigns?.find((c: any) => c.id === campaignId);
      
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      const result = await sendBulkEmails(campaign, targetAudience || 'all');
      
      // Update campaign status
      campaign.status = 'sent';
      campaign.sentAt = new Date();
      campaign.recipientCount = result.totalSent;
      await storage.saveAIReport('email-campaigns', { campaigns: savedCampaigns?.campaigns });
      
      res.json(result);
    } catch (error: any) {
      console.error('Error sending email campaign:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/ai/email-campaigns/subscribers', requireAdmin, async (req, res) => {
    try {
      const subscribers = await storage.getNewsletterSubscribers();
      res.json(subscribers);
    } catch (error: any) {
      console.error('Error fetching subscribers:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // AI AUTO PRODUCT ADDITION
  // ============================================

  app.get('/api/admin/ai/auto-products', requireAdmin, async (req, res) => {
    try {
      const { getDefaultSettings } = await import('./utils/aiAutoProducts');
      
      // Get saved settings
      const savedSettings = await storage.getAIReport('auto-products-settings');
      const settings = savedSettings || getDefaultSettings();
      
      // Get last run results - try to get from the most recent key
      let lastRun = await storage.getAIReport('auto-products-latest');
      
      // If no "latest" key, try today's date for backwards compatibility
      if (!lastRun) {
        const today = new Date().toISOString().split('T')[0];
        lastRun = await storage.getAIReport(`auto-products-${today}`);
      }
      
      res.json({
        settings,
        lastRun,
      });
    } catch (error: any) {
      console.error('Error fetching auto products settings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/ai/auto-products/settings', requireAdmin, async (req, res) => {
    try {
      const { startAutoProductScheduler, stopAutoProductScheduler } = await import('./utils/aiAutoProducts');
      const settings = req.body;
      
      // Save settings
      await storage.saveAIReport('auto-products-settings', settings);
      
      // Update scheduler
      if (settings.enabled) {
        startAutoProductScheduler(settings);
      } else {
        stopAutoProductScheduler();
      }
      
      res.json({ success: true, settings });
    } catch (error: any) {
      console.error('Error saving auto products settings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/ai/auto-products/run', requireAdmin, async (req, res) => {
    try {
      const { analyzeDemandAndAddProducts, getDefaultSettings } = await import('./utils/aiAutoProducts');
      
      // Get saved settings or use defaults
      const savedSettings = await storage.getAIReport('auto-products-settings');
      const settings = savedSettings || getDefaultSettings();
      
      // Override with request settings if provided
      const runSettings = {
        ...settings,
        ...req.body,
        enabled: true,
      };
      
      const result = await analyzeDemandAndAddProducts(runSettings);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error running auto products:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // AI SMART SEARCH
  // ============================================

  app.get('/api/products/smart-search/:query', async (req, res) => {
    try {
      const { smartSearch } = await import('./utils/aiSmartSearch');
      const { query } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await smartSearch(query, limit);
      
      res.json(result);
    } catch (error: any) {
      console.error('Smart search error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/search/suggest/:query', async (req, res) => {
    try {
      const { suggestCorrection, getSynonyms } = await import('./utils/aiSmartSearch');
      const { query } = req.params;
      
      const correction = suggestCorrection(query);
      const synonyms = getSynonyms(query);
      
      res.json({
        original: query,
        correction,
        synonyms,
      });
    } catch (error: any) {
      console.error('Search suggest error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // AUTOMATION SYSTEM
  // ============================================

  app.get('/api/admin/automation', requireAdmin, async (req, res) => {
    try {
      const { getAutomationSettings, getAutomationLogs } = await import('./utils/automationScheduler');
      
      const settings = await getAutomationSettings();
      const logs = await getAutomationLogs(20);
      
      res.json({
        settings,
        logs,
      });
    } catch (error: any) {
      console.error('Error fetching automation settings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/automation/settings', requireAdmin, async (req, res) => {
    try {
      const { saveAutomationSettings, startAutomationScheduler, stopAutomationScheduler } = await import('./utils/automationScheduler');
      
      const settings = req.body;
      await saveAutomationSettings(settings);
      
      if (settings.enabled) {
        startAutomationScheduler();
      } else {
        stopAutomationScheduler();
      }
      
      res.json({ success: true, settings });
    } catch (error: any) {
      console.error('Error saving automation settings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/automation/run/:taskId', requireAdmin, async (req, res) => {
    try {
      const { runTask } = await import('./utils/automationScheduler');
      const { taskId } = req.params;
      
      const result = await runTask(taskId);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error running automation task:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/automation/start', requireAdmin, async (req, res) => {
    try {
      const { startAutomationScheduler } = await import('./utils/automationScheduler');
      startAutomationScheduler();
      res.json({ success: true, message: 'Automation scheduler started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/automation/stop', requireAdmin, async (req, res) => {
    try {
      const { stopAutomationScheduler } = await import('./utils/automationScheduler');
      stopAutomationScheduler();
      res.json({ success: true, message: 'Automation scheduler stopped' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // REVIEWS SYSTEM
  // ============================================

  // Get reviews for a product (public)
  app.get('/api/products/:productId/reviews', async (req, res) => {
    try {
      const { productId } = req.params;
      const reviews = await storage.getProductReviews(productId);
      const rating = await storage.getProductAverageRating(productId);
      res.json({ reviews, ...rating });
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get average rating for a product (public, lightweight)
  app.get('/api/products/:productId/rating', async (req, res) => {
    try {
      const { productId } = req.params;
      const rating = await storage.getProductAverageRating(productId);
      res.json(rating);
    } catch (error: any) {
      console.error('Error fetching rating:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Submit a review (authenticated users only)
  app.post('/api/products/:productId/reviews', requireAuth, async (req: any, res) => {
    try {
      const { productId } = req.params;
      const userId = req.userId;
      
      // Check if user already reviewed this product
      const hasReviewed = await storage.hasUserReviewedProduct(userId, productId);
      if (hasReviewed) {
        return res.status(400).json({ error: 'You have already reviewed this product' });
      }
      
      // Check if this is a verified purchase
      const orders = await storage.getOrders({ userId });
      let isVerifiedPurchase = false;
      for (const order of orders) {
        const items = await storage.getOrderItems(order.id);
        if (items.some(item => item.productId === productId)) {
          isVerifiedPurchase = true;
          break;
        }
      }
      
      const parsed = insertReviewSchema.safeParse({
        ...req.body,
        productId,
        userId,
        isVerifiedPurchase,
        isApproved: true, // Auto-approve for now
      });
      
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid review data', details: parsed.error.flatten() });
      }
      
      const review = await storage.createReview(parsed.data);
      res.status(201).json(review);
    } catch (error: any) {
      console.error('Error creating review:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's own reviews (authenticated)
  app.get('/api/user/reviews', requireAuth, async (req: any, res) => {
    try {
      const reviews = await storage.getUserReviews(req.userId);
      res.json(reviews);
    } catch (error: any) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete own review (authenticated)
  app.delete('/api/reviews/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const review = await storage.getReview(id);
      
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }
      
      if (review.userId !== req.userId) {
        return res.status(403).json({ error: 'Not authorized to delete this review' });
      }
      
      await storage.deleteReview(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting review:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all reviews
  app.get('/api/admin/reviews', requireAdmin, async (req, res) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json(reviews);
    } catch (error: any) {
      console.error('Error fetching all reviews:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Update review (approve/disapprove)
  app.patch('/api/admin/reviews/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isApproved } = req.body;
      
      const updated = await storage.updateReview(id, { isApproved });
      if (!updated) {
        return res.status(404).json({ error: 'Review not found' });
      }
      
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating review:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Delete any review
  app.delete('/api/admin/reviews/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReview(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting review:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // GIFT CARDS SYSTEM
  // ============================================

  // Generate unique gift card code
  function generateGiftCardCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'EZ-';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Check gift card balance (public)
  app.get('/api/gift-cards/check/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const card = await storage.getGiftCardByCode(code);
      
      if (!card) {
        return res.status(404).json({ error: 'Gift card not found' });
      }
      
      if (!card.isActive) {
        return res.status(400).json({ error: 'Gift card is inactive' });
      }
      
      if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
        return res.status(400).json({ error: 'Gift card has expired' });
      }
      
      res.json({
        valid: true,
        balance: parseFloat(card.currentBalance),
        currency: card.currency,
      });
    } catch (error: any) {
      console.error('Error checking gift card:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Apply gift card to order (during checkout)
  app.post('/api/gift-cards/apply', async (req, res) => {
    try {
      const { code, orderTotal, orderId } = req.body;
      
      const card = await storage.getGiftCardByCode(code);
      if (!card) {
        return res.status(404).json({ error: 'Gift card not found' });
      }
      
      if (!card.isActive) {
        return res.status(400).json({ error: 'Gift card is inactive' });
      }
      
      if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
        return res.status(400).json({ error: 'Gift card has expired' });
      }
      
      const currentBalance = parseFloat(card.currentBalance);
      const amountToApply = Math.min(currentBalance, orderTotal);
      const newBalance = currentBalance - amountToApply;
      
      // Update balance
      await storage.updateGiftCardBalance(card.id, newBalance);
      
      // Record transaction
      await storage.createGiftCardTransaction({
        giftCardId: card.id,
        orderId: orderId || null,
        amount: amountToApply.toFixed(2),
        balanceBefore: currentBalance.toFixed(2),
        balanceAfter: newBalance.toFixed(2),
        transactionType: 'redemption',
      });
      
      res.json({
        applied: amountToApply,
        remainingBalance: newBalance,
        remainingOrderTotal: orderTotal - amountToApply,
      });
    } catch (error: any) {
      console.error('Error applying gift card:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all gift cards
  app.get('/api/admin/gift-cards', requireAdmin, async (req, res) => {
    try {
      const cards = await storage.getGiftCards();
      res.json(cards);
    } catch (error: any) {
      console.error('Error fetching gift cards:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get gift card stats
  app.get('/api/admin/gift-cards/stats', requireAdmin, async (req, res) => {
    try {
      const cards = await storage.getGiftCards();
      const totalCards = cards.length;
      const activeCards = cards.filter(c => c.isActive).length;
      const totalValue = cards.reduce((sum, c) => sum + parseFloat(c.initialValue), 0);
      const totalRedeemed = cards.reduce((sum, c) => sum + (parseFloat(c.initialValue) - parseFloat(c.currentBalance)), 0);
      res.json({
        totalCards,
        activeCards,
        totalValue: totalValue.toFixed(2),
        totalRedeemed: totalRedeemed.toFixed(2),
      });
    } catch (error: any) {
      console.error('Error fetching gift card stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get single gift card with transactions
  app.get('/api/admin/gift-cards/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const card = await storage.getGiftCard(id);
      
      if (!card) {
        return res.status(404).json({ error: 'Gift card not found' });
      }
      
      const transactions = await storage.getGiftCardTransactions(id);
      res.json({ ...card, transactions });
    } catch (error: any) {
      console.error('Error fetching gift card:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Create gift card
  app.post('/api/admin/gift-cards', requireAdmin, async (req, res) => {
    try {
      const { initialValue, currency, expiresAt, customCode } = req.body;
      
      const code = customCode || generateGiftCardCode();
      
      // Check if code already exists
      const existing = await storage.getGiftCardByCode(code);
      if (existing) {
        return res.status(400).json({ error: 'Gift card code already exists' });
      }
      
      const parsed = insertGiftCardSchema.safeParse({
        code,
        initialValue: initialValue.toFixed(2),
        currency: currency || 'EUR',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      });
      
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid gift card data', details: parsed.error.flatten() });
      }
      
      const card = await storage.createGiftCard(parsed.data);
      res.status(201).json(card);
    } catch (error: any) {
      console.error('Error creating gift card:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Generate multiple gift cards
  app.post('/api/admin/gift-cards/batch', requireAdmin, async (req, res) => {
    try {
      const { count, initialValue, currency, expiresAt } = req.body;
      
      if (count < 1 || count > 100) {
        return res.status(400).json({ error: 'Count must be between 1 and 100' });
      }
      
      const cards = [];
      for (let i = 0; i < count; i++) {
        const code = generateGiftCardCode();
        const card = await storage.createGiftCard({
          code,
          initialValue: initialValue.toFixed(2),
          currency: currency || 'EUR',
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true,
        });
        cards.push(card);
      }
      
      res.status(201).json({ created: cards.length, cards });
    } catch (error: any) {
      console.error('Error creating gift cards:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Deactivate gift card
  app.post('/api/admin/gift-cards/:id/deactivate', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deactivateGiftCard(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deactivating gift card:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Add balance to gift card (e.g., for refunds)
  app.post('/api/admin/gift-cards/:id/add-balance', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;
      
      const card = await storage.getGiftCard(id);
      if (!card) {
        return res.status(404).json({ error: 'Gift card not found' });
      }
      
      const currentBalance = parseFloat(card.currentBalance);
      const newBalance = currentBalance + amount;
      
      await storage.updateGiftCardBalance(id, newBalance);
      
      await storage.createGiftCardTransaction({
        giftCardId: id,
        amount: amount.toFixed(2),
        balanceBefore: currentBalance.toFixed(2),
        balanceAfter: newBalance.toFixed(2),
        transactionType: reason || 'admin_adjustment',
      });
      
      res.json({ success: true, newBalance });
    } catch (error: any) {
      console.error('Error adding balance:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================
  // LOYALTY SYSTEM ROUTES
  // ============================================

  // Get VIP tiers (public)
  app.get('/api/loyalty/tiers', async (req, res) => {
    try {
      const tiers = await storage.getVipTiers();
      res.json(tiers);
    } catch (error: any) {
      console.error('Error fetching VIP tiers:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's loyalty status
  app.get('/api/loyalty/status', async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = req.user?.claims?.sub || req.user?.id;
      let loyalty = await storage.getUserLoyalty(userId);
      
      // If no loyalty record, create one with default tier
      if (!loyalty) {
        const defaultTier = await storage.getVipTierByName('bronze');
        loyalty = await storage.createUserLoyalty({
          userId,
          currentPoints: 0,
          lifetimePoints: 0,
          totalSpend: '0.00',
          currentTierId: defaultTier?.id,
        });
      }
      
      // Get current tier details
      const currentTier = loyalty.currentTierId 
        ? await storage.getVipTier(loyalty.currentTierId)
        : null;
      
      // Get all tiers for progress display
      const allTiers = await storage.getVipTiers();
      
      // Calculate next tier
      const totalSpend = parseFloat(loyalty.totalSpend || '0');
      const sortedTiers = allTiers.sort((a, b) => parseFloat(a.minSpend) - parseFloat(b.minSpend));
      const nextTier = sortedTiers.find(t => parseFloat(t.minSpend) > totalSpend);
      
      const progressToNextTier = nextTier 
        ? {
            nextTierName: nextTier.nameEn,
            amountNeeded: parseFloat(nextTier.minSpend) - totalSpend,
            progress: (totalSpend / parseFloat(nextTier.minSpend)) * 100
          }
        : null;
      
      res.json({
        ...loyalty,
        currentTier,
        allTiers,
        progressToNextTier,
      });
    } catch (error: any) {
      console.error('Error fetching loyalty status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get loyalty transactions history
  app.get('/api/loyalty/transactions', async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = req.user?.claims?.sub || req.user?.id;
      const transactions = await storage.getLoyaltyTransactions(userId);
      res.json(transactions);
    } catch (error: any) {
      console.error('Error fetching loyalty transactions:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Calculate points preview (for checkout)
  app.post('/api/loyalty/calculate-points', async (req: any, res) => {
    try {
      const { orderTotal } = req.body;
      
      if (!orderTotal || orderTotal <= 0) {
        return res.json({ points: 0, multiplier: 1 });
      }
      
      let multiplier = 1;
      
      // Check if user has a tier with bonus multiplier
      if (req.user) {
        const userId = req.user?.claims?.sub || req.user?.id;
        const loyalty = await storage.getUserLoyalty(userId);
        if (loyalty?.currentTierId) {
          const tier = await storage.getVipTier(loyalty.currentTierId);
          if (tier) {
            multiplier = parseFloat(tier.pointsMultiplier || '1');
          }
        }
      }
      
      // Base rate: 10 points per 1€
      const basePoints = Math.floor(orderTotal * 10);
      const totalPoints = Math.floor(basePoints * multiplier);
      
      res.json({
        basePoints,
        multiplier,
        totalPoints,
        message: multiplier > 1 
          ? `You're earning ${multiplier}x points as a VIP member!`
          : 'Earn 10 points for every €1 spent'
      });
    } catch (error: any) {
      console.error('Error calculating points:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Redeem points for discount
  app.post('/api/loyalty/redeem', async (req: any, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { points } = req.body;
      
      if (!points || points <= 0) {
        return res.status(400).json({ error: 'Invalid points amount' });
      }
      
      const userId = req.user?.claims?.sub || req.user?.id;
      
      // 100 points = 1€ discount
      const discountValue = points / 100;
      
      const transaction = await storage.redeemLoyaltyPoints(
        userId,
        points,
        `Redeemed ${points} points for €${discountValue.toFixed(2)} discount`
      );
      
      if (!transaction) {
        return res.status(400).json({ error: 'Insufficient points balance' });
      }
      
      res.json({
        success: true,
        discountValue,
        transaction,
        message: `Successfully redeemed ${points} points for €${discountValue.toFixed(2)} discount`
      });
    } catch (error: any) {
      console.error('Error redeeming points:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get frequently bought together products
  app.get('/api/products/:id/frequently-bought-together', async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 4;
      
      const products = await storage.getFrequentlyBoughtTogether(id, limit);
      res.json(products);
    } catch (error: any) {
      console.error('Error fetching frequently bought together:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all VIP tiers
  app.get('/api/admin/loyalty/tiers', requireAdmin, async (req, res) => {
    try {
      const tiers = await storage.getVipTiers();
      res.json(tiers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Update VIP tier
  app.patch('/api/admin/loyalty/tiers/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const tier = await storage.updateVipTier(id, req.body);
      if (!tier) {
        return res.status(404).json({ error: 'Tier not found' });
      }
      res.json(tier);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Add bonus points to user
  app.post('/api/admin/loyalty/add-points', requireAdmin, async (req, res) => {
    try {
      const { userId, points, reason } = req.body;
      
      if (!userId || !points) {
        return res.status(400).json({ error: 'User ID and points are required' });
      }
      
      const transaction = await storage.addLoyaltyPoints(
        userId,
        points,
        'bonus',
        reason || 'Admin bonus points'
      );
      
      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get loyalty statistics
  app.get('/api/admin/loyalty/stats', requireAdmin, async (req, res) => {
    try {
      const tiers = await storage.getVipTiers();
      
      // Get counts for each tier by querying user_loyalty table
      const tierStats = await Promise.all(
        tiers.map(async tier => {
          const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(schema.userLoyalty)
            .where(eq(schema.userLoyalty.currentTierId, tier.id));
          return {
            tier: tier.nameEn,
            color: tier.color,
            count: Number(countResult[0]?.count || 0)
          };
        })
      );
      
      // Get total points in circulation
      const totalPointsResult = await db.select({ 
        total: sql<number>`COALESCE(SUM(current_points), 0)` 
      }).from(schema.userLoyalty);
      
      res.json({
        tierStats,
        totalPointsInCirculation: Number(totalPointsResult[0]?.total || 0),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
