import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema, insertAddressSchema, insertBlogPostSchema, insertNewsletterSubscriberSchema } from "@shared/schema";
import { parseCSV, generateCSVTemplate } from "./utils/csv";
import { emailService } from "./utils/email";
import { getShippingRates } from "./utils/shipping";
import { createStripePayment, createPayseraPayment } from "./utils/payments";
import { streamChatResponse, detectLanguage, searchProducts } from "./utils/chat";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { createMontonioPayment, handleMontonioWebhook, handleMontonioReturn } from "./montonio";

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: "Unauthorized - Admin access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin Authentication Routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }
      
      if (password === process.env.SESSION_SECRET) {
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
      const { status, paymentStatus } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      
      await storage.updateOrderStatus(req.params.id, status, paymentStatus);
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
  
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const allProducts = await storage.getProducts();
      const allOrders = await storage.getOrders();
      const lowStockProducts = await storage.getLowStockProducts();
      
      res.json({
        totalProducts: allProducts.length,
        totalOrders: allOrders.length,
        lowStockCount: lowStockProducts.length
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
  app.post("/api/support/chat", async (req, res) => {
    try {
      const { sessionId, message, language: userLanguage } = req.body;
      
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      let session;
      let detectedLang: 'en' | 'et' = userLanguage || 'en';
      let confidence = 1.0;
      
      // Get or create session
      if (sessionId) {
        session = await storage.getSupportSession(sessionId);
        if (session) {
          detectedLang = session.language as 'en' | 'et';
        }
      }
      
      if (!session) {
        // Detect language from first message if not provided
        if (!userLanguage) {
          const detection = detectLanguage(message);
          detectedLang = detection.language;
          confidence = detection.confidence;
        }
        
        session = await storage.createSupportSession({
          language: detectedLang,
          languageConfidence: confidence.toString(),
          isActive: true,
        });
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
      
      // Get conversation history (last 10 messages)
      const history = await storage.getSupportMessages(session.id);
      const sessionHistory = history.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Get all products for context
      const allProducts = await storage.getProducts({});
      
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
      
      await streamChatResponse(
        message,
        detectedLang,
        {
          products: relevantProducts,
          order,
          sessionHistory
        },
        (chunk) => {
          // Send SSE chunk
          res.write(`data: ${JSON.stringify({ chunk, sessionId: session.id })}\n\n`);
          fullResponse += chunk;
        }
      );
      
      // Save assistant response
      await storage.createSupportMessage({
        sessionId: session.id,
        role: 'assistant',
        content: fullResponse,
      });
      
      // Send completion signal
      res.write(`data: ${JSON.stringify({ done: true, sessionId: session.id })}\n\n`);
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

  const httpServer = createServer(app);
  return httpServer;
}
