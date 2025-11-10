import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema, insertAddressSchema, insertBlogPostSchema, insertNewsletterSubscriberSchema } from "@shared/schema";
import { parseCSV, generateCSVTemplate } from "./utils/csv";
import { emailService } from "./utils/email";
import { getShippingRates } from "./utils/shipping";
import { createStripeCheckoutSession, handleStripeWebhook, createPayseraPayment } from "./utils/payments";
import { streamChatResponse, detectLanguage, searchProducts } from "./utils/chat";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { createMontonioPayment, handleMontonioWebhook, handleMontonioReturn } from "./montonio";
import { handlePaymentWebhook, getOrderPaymentStatus } from "./utils/paymentOrchestrator";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const { categoryId, featured, search } = req.query;
      const products = await storage.getProducts({
        categoryId: categoryId as string,
        featured: featured === 'true',
        search: search as string,
      });
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: "Failed to fetch products" });
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
  
  // Checkout (legacy - deprecated, use provider-specific endpoints)
  app.post("/api/checkout/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = 'EUR', provider = 'paysera' } = req.body;
      
      if (provider === 'paysera') {
        const orderId = `temp-${Date.now()}`;
        const paymentUrl = await createPayseraPayment(amount, orderId, currency);
        res.json({ paymentUrl, provider: 'paysera' });
      } else {
        res.status(400).json({ error: "Use provider-specific payment endpoints: /api/payments/stripe/checkout, /paypal/order, /api/payments/montonio" });
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
      
      // Create order with stock reservation (not immediate deduction)
      const createdOrder = await storage.createOrder(validatedOrder, items);
      
      // Send order pending email (waiting for payment)
      const orderItems = await storage.getOrderItems(createdOrder.id);
      await emailService.sendOrderConfirmation(createdOrder, orderItems, language);
      
      res.status(201).json(createdOrder);
    } catch (error: any) {
      console.error('Error creating order:', error);
      res.status(400).json({ error: error.message || "Failed to create order" });
    }
  });
  
  // Get order payment status (for polling from frontend)
  app.get("/api/orders/:id/status", async (req, res) => {
    try {
      const status = await getOrderPaymentStatus(req.params.id);
      res.json(status);
    } catch (error: any) {
      res.status(404).json({ error: error.message || "Order not found" });
    }
  });
  
  // Payment initiation endpoints
  app.post("/api/payments/stripe/checkout", async (req, res) => {
    try {
      const { orderId, amount, currency } = req.body;
      const session = await createStripeCheckoutSession(orderId, amount, currency);
      res.json(session);
    } catch (error: any) {
      console.error('[STRIPE] Checkout error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Stripe webhook (requires raw body for signature verification)
  app.post("/api/webhooks/stripe", async (req, res) => {
    await handleStripeWebhook(req, res);
  });
  
  // Unified webhook handler (generic endpoint for testing)
  app.post("/api/webhooks/payment", async (req, res) => {
    try {
      const result = await handlePaymentWebhook(req.body);
      if (!result.success) {
        // Return 503 (Service Unavailable) to trigger provider retry
        res.status(503).json(result);
      } else {
        res.json(result);
      }
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: error.message });
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
