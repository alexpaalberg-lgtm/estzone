import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema, insertAddressSchema, insertBlogPostSchema, insertNewsletterSubscriberSchema } from "@shared/schema";
import { parseCSV, generateCSVTemplate } from "./utils/csv";
import { emailService } from "./utils/email";
import { getShippingRates } from "./utils/shipping";
import { createStripePayment, createPayseraPayment } from "./utils/payments";

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

  const httpServer = createServer(app);
  return httpServer;
}
