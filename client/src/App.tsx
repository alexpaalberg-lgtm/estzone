import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CompareProvider } from "@/contexts/CompareContext";
import FloatingButtons from "@/components/FloatingButtons";
import ShoppingCart from "@/components/ShoppingCart";
import CookieConsent from "@/components/CookieConsent";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import About from "@/pages/About";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/Products";
import AdminOrders from "@/pages/admin/Orders";
import AdminCategories from "@/pages/admin/Categories";
import AdminInventory from "@/pages/admin/Inventory";
import AdminCoupons from "@/pages/admin/Coupons";
import AdminAIReports from "@/pages/admin/AIReports";
import AdminAISystemHealth from "@/pages/admin/AISystemHealth";
import AdminAIPricing from "@/pages/admin/AIPricing";
import AdminAIBundles from "@/pages/admin/AIBundles";
import AdminAISkills from "@/pages/admin/AISkills";
import AdminAICoupons from "@/pages/admin/AICoupons";
import AdminAICampaigns from "@/pages/admin/AICampaigns";
import AdminAISeo from "@/pages/admin/AISeo";
import AdminAIInfluencers from "@/pages/admin/AIInfluencers";
import AdminAIProductViz from "@/pages/admin/AIProductViz";
import AdminAIEmailCampaigns from "@/pages/admin/AIEmailCampaigns";
import AdminAIAutoProducts from "@/pages/admin/AIAutoProducts";
import AdminAIAutomation from "@/pages/admin/AIAutomation";
import AdminGiftCards from "@/pages/admin/GiftCards";
import AdminReviews from "@/pages/admin/Reviews";
import AdminLoyalty from "@/pages/admin/Loyalty";
import AdminFinance from "@/pages/admin/Finance";
import Legal from "@/pages/Legal";
import FAQ from "@/pages/FAQ";
import Wishlist from "@/pages/Wishlist";
import Account from "@/pages/Account";
import Auth from "@/pages/Auth";
import Compare from "@/pages/Compare";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { useAnalytics } from "./hooks/use-analytics";

function Router() {
  // Track page views when routes change (Google Analytics)
  useAnalytics();
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/:categorySlug" component={Products} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/about" component={About} />
      <Route path="/terms" component={() => <Legal type="terms" />} />
      <Route path="/privacy" component={() => <Legal type="privacy" />} />
      <Route path="/returns" component={() => <Legal type="returns" />} />
      <Route path="/shipping-policy" component={() => <Legal type="shipping" />} />
      <Route path="/faq" component={FAQ} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/compare" component={Compare} />
      <Route path="/account" component={Account} />
      <Route path="/auth" component={Auth} />
      <Route path="/login" component={Auth} />
      <Route path="/register" component={Auth} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/inventory" component={AdminInventory} />
      <Route path="/admin/coupons" component={AdminCoupons} />
      <Route path="/admin/ai-reports" component={AdminAIReports} />
      <Route path="/admin/ai-system" component={AdminAISystemHealth} />
      <Route path="/admin/ai-pricing" component={AdminAIPricing} />
      <Route path="/admin/ai-bundles" component={AdminAIBundles} />
      <Route path="/admin/ai-skills" component={AdminAISkills} />
      <Route path="/admin/ai-personalized-coupons" component={AdminAICoupons} />
      <Route path="/admin/ai-campaigns" component={AdminAICampaigns} />
      <Route path="/admin/ai-seo" component={AdminAISeo} />
      <Route path="/admin/ai-influencers" component={AdminAIInfluencers} />
      <Route path="/admin/ai-product-viz" component={AdminAIProductViz} />
      <Route path="/admin/ai-email-campaigns" component={AdminAIEmailCampaigns} />
      <Route path="/admin/ai-auto-products" component={AdminAIAutoProducts} />
      <Route path="/admin/ai-automation" component={AdminAIAutomation} />
      <Route path="/admin/gift-cards" component={AdminGiftCards} />
      <Route path="/admin/reviews" component={AdminReviews} />
      <Route path="/admin/loyalty" component={AdminLoyalty} />
      <Route path="/admin/finance" component={AdminFinance} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <CartProvider>
              <CompareProvider>
                <Toaster />
                <Router />
                <ShoppingCart />
                <FloatingButtons />
                <CookieConsent />
              </CompareProvider>
            </CartProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
