import { storage } from '../storage';

export interface ScheduledTask {
  id: string;
  name: string;
  nameEt: string;
  description: string;
  descriptionEt: string;
  schedule: 'hourly' | 'daily' | 'weekly' | 'custom';
  customCron?: string;
  hour?: number;
  dayOfWeek?: number;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  lastResult?: 'success' | 'error' | 'skipped';
  lastError?: string;
  runCount: number;
}

export interface AutomationSettings {
  enabled: boolean;
  tasks: Record<string, ScheduledTask>;
  timezone: string;
  adminEmail?: string;
  lastUpdated: Date;
}

const intervals: Map<string, NodeJS.Timeout> = new Map();
let mainInterval: NodeJS.Timeout | null = null;

const defaultTasks: Record<string, ScheduledTask> = {
  dailyReport: {
    id: 'dailyReport',
    name: 'Daily AI Report',
    nameEt: 'Igapäevane AI raport',
    description: 'Generate AI business insights report every morning',
    descriptionEt: 'Genereeri AI ärianalüüsi raport igal hommikul',
    schedule: 'daily',
    hour: 8,
    enabled: true,
    runCount: 0,
  },
  lowStockAlerts: {
    id: 'lowStockAlerts',
    name: 'Low Stock Alerts',
    nameEt: 'Madala laoseisu hoiatused',
    description: 'Send email alerts when products have low stock',
    descriptionEt: 'Saada meiliteade kui toodete laoseis on madal',
    schedule: 'daily',
    hour: 9,
    enabled: true,
    runCount: 0,
  },
  weeklyNewsletter: {
    id: 'weeklyNewsletter',
    name: 'Weekly Newsletter',
    nameEt: 'Iganädalane uudiskiri',
    description: 'Send automated newsletter with new products and deals',
    descriptionEt: 'Saada automaatne uudiskiri uute toodete ja pakkumistega',
    schedule: 'weekly',
    dayOfWeek: 1,
    hour: 10,
    enabled: true,
    runCount: 0,
  },
  inactiveCustomerWinback: {
    id: 'inactiveCustomerWinback',
    name: 'Inactive Customer Win-back',
    nameEt: 'Inaktiivsete klientide tagasivõit',
    description: 'Send personalized coupons to customers who haven\'t ordered in 30 days',
    descriptionEt: 'Saada personaalseid kuponge klientidele, kes pole 30 päeva tellinud',
    schedule: 'weekly',
    dayOfWeek: 3,
    hour: 11,
    enabled: true,
    runCount: 0,
  },
  abandonedCartReminders: {
    id: 'abandonedCartReminders',
    name: 'Abandoned Cart Reminders',
    nameEt: 'Ostukorvi meeldetuletused',
    description: 'Send reminders to customers who left items in cart',
    descriptionEt: 'Saada meeldetuletusi klientidele, kes jätsid tooted ostukorvi',
    schedule: 'hourly',
    enabled: true,
    runCount: 0,
  },
  priceOptimization: {
    id: 'priceOptimization',
    name: 'AI Price Optimization',
    nameEt: 'AI hindade optimeerimine',
    description: 'Analyze sales data and optimize product pricing',
    descriptionEt: 'Analüüsi müügiandmeid ja optimeeri toodete hindu',
    schedule: 'weekly',
    dayOfWeek: 0,
    hour: 6,
    enabled: true,
    runCount: 0,
  },
  seoAudit: {
    id: 'seoAudit',
    name: 'Weekly SEO Audit',
    nameEt: 'Iganädalane SEO audit',
    description: 'Run AI-powered SEO analysis and generate recommendations',
    descriptionEt: 'Käivita AI SEO analüüs ja genereeri soovitused',
    schedule: 'weekly',
    dayOfWeek: 1,
    hour: 7,
    enabled: true,
    runCount: 0,
  },
  wishlistPriceAlerts: {
    id: 'wishlistPriceAlerts',
    name: 'Wishlist Price Alerts',
    nameEt: 'Soovide nimekirja hinnateavitused',
    description: 'Notify customers when wishlist items go on sale',
    descriptionEt: 'Teavita kliente kui soovide nimekirjas olevad tooted lähevad soodusmüüki',
    schedule: 'hourly',
    enabled: true,
    runCount: 0,
  },
  pointsExpiration: {
    id: 'pointsExpiration',
    name: 'Points Expiration Check',
    nameEt: 'Punktide aegumise kontroll',
    description: 'Expire loyalty points that are older than 6 months',
    descriptionEt: 'Aeguvad lojaalsuspunktid, mis on vanemad kui 6 kuud',
    schedule: 'daily',
    hour: 1,
    enabled: true,
    runCount: 0,
  },
  autoProducts: {
    id: 'autoProducts',
    name: 'Auto Product Addition',
    nameEt: 'Automaatne toodete lisamine',
    description: 'Automatically add new games from RAWG API',
    descriptionEt: 'Lisa automaatselt uusi mänge RAWG API-st',
    schedule: 'custom',
    customCron: '0 3 */3 * *',
    enabled: true,
    runCount: 0,
  },
  rotatingFlashSales: {
    id: 'rotatingFlashSales',
    name: 'Rotating Flash Sales',
    nameEt: 'Rotatsioonilised välkmüügid',
    description: 'Automatically apply discounts to random products every 4 days',
    descriptionEt: 'Rakenda automaatselt allahindlusi juhuslikele toodetele iga 4 päeva tagant',
    schedule: 'custom',
    customCron: '0 6 */4 * *',
    enabled: true,
    runCount: 0,
  },
};

export function getDefaultSettings(): AutomationSettings {
  return {
    enabled: true,
    tasks: { ...defaultTasks },
    timezone: 'Europe/Tallinn',
    lastUpdated: new Date(),
  };
}

export async function getAutomationSettings(): Promise<AutomationSettings> {
  const saved = await storage.getAIReport('automation-settings');
  if (saved) {
    return {
      ...getDefaultSettings(),
      ...saved,
      tasks: { ...defaultTasks, ...saved.tasks },
    };
  }
  return getDefaultSettings();
}

export async function saveAutomationSettings(settings: AutomationSettings): Promise<void> {
  settings.lastUpdated = new Date();
  await storage.saveAIReport('automation-settings', settings);
}

export async function runTask(taskId: string): Promise<{ success: boolean; message: string; messageEt: string }> {
  const settings = await getAutomationSettings();
  const task = settings.tasks[taskId];
  
  if (!task) {
    return { success: false, message: `Task ${taskId} not found`, messageEt: `Ülesanne ${taskId} ei leitud` };
  }

  console.log(`[AUTOMATION] Running task: ${task.name}`);
  
  try {
    let result: { success: boolean; message: string; messageEt: string };

    switch (taskId) {
      case 'dailyReport':
        result = await runDailyReport();
        break;
      case 'lowStockAlerts':
        result = await runLowStockAlerts();
        break;
      case 'weeklyNewsletter':
        result = await runWeeklyNewsletter();
        break;
      case 'inactiveCustomerWinback':
        result = await runInactiveCustomerWinback();
        break;
      case 'abandonedCartReminders':
        result = await runAbandonedCartReminders();
        break;
      case 'priceOptimization':
        result = await runPriceOptimization();
        break;
      case 'seoAudit':
        result = await runSeoAudit();
        break;
      case 'wishlistPriceAlerts':
        result = await runWishlistPriceAlerts();
        break;
      case 'autoProducts':
        result = await runAutoProducts();
        break;
      case 'pointsExpiration':
        result = await runPointsExpiration();
        break;
      case 'rotatingFlashSales':
        result = await runRotatingFlashSales();
        break;
      default:
        result = { success: false, message: 'Unknown task', messageEt: 'Tundmatu ülesanne' };
    }

    task.lastRun = new Date();
    task.lastResult = result.success ? 'success' : 'error';
    task.lastError = result.success ? undefined : result.message;
    task.runCount++;
    
    await saveAutomationSettings(settings);
    
    console.log(`[AUTOMATION] Task ${task.name} completed: ${result.success ? 'SUCCESS' : 'ERROR'}`);
    return result;
  } catch (error: any) {
    task.lastRun = new Date();
    task.lastResult = 'error';
    task.lastError = error.message;
    await saveAutomationSettings(settings);
    
    console.error(`[AUTOMATION] Task ${task.name} failed:`, error);
    return { success: false, message: error.message, messageEt: `Viga: ${error.message}` };
  }
}

async function runDailyReport(): Promise<{ success: boolean; message: string; messageEt: string }> {
  const today = new Date().toISOString().split('T')[0];
  
  const orders = await storage.getOrders();
  const products = await storage.getProducts();
  
  const todayOrders = orders.filter(o => o.createdAt?.toISOString().split('T')[0] === today);
  const totalRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0);
  const lowStockProducts = products.filter(p => (p.stock || 0) < 10);

  const report = {
    date: today,
    generatedAt: new Date(),
    summary: {
      totalOrders: todayOrders.length,
      totalRevenue: totalRevenue.toFixed(2),
      lowStockCount: lowStockProducts.length,
      activeProducts: products.filter(p => p.isActive).length,
    },
    automated: true,
  };

  await storage.saveAIReport(`daily-report-${today}`, report);
  await storage.saveAIReport('daily-report-latest', report);

  return {
    success: true,
    message: `Daily report generated: ${todayOrders.length} orders, €${totalRevenue.toFixed(2)} revenue`,
    messageEt: `Päevaraport loodud: ${todayOrders.length} tellimust, €${totalRevenue.toFixed(2)} käive`,
  };
}

async function runLowStockAlerts(): Promise<{ success: boolean; message: string; messageEt: string }> {
  const products = await storage.getProducts();
  const lowStockProducts = products.filter(p => p.isActive && (p.stock || 0) < 5);

  if (lowStockProducts.length === 0) {
    return {
      success: true,
      message: 'No low stock products found',
      messageEt: 'Madala laoseisuga tooteid ei leitud',
    };
  }

  const alertData = {
    timestamp: new Date(),
    products: lowStockProducts.map(p => ({
      id: p.id,
      name: p.nameEn,
      nameEt: p.nameEt,
      sku: p.sku,
      stock: p.stock,
    })),
    count: lowStockProducts.length,
  };

  await storage.saveAIReport('low-stock-alert-latest', alertData);

  try {
    const { sendLowStockAlert } = await import('./automationEmails');
    await sendLowStockAlert(lowStockProducts);
  } catch (error) {
    console.log('[AUTOMATION] Email service not available, alert saved to database');
  }

  return {
    success: true,
    message: `Low stock alert: ${lowStockProducts.length} products need restocking`,
    messageEt: `Madala laoseisu hoiatus: ${lowStockProducts.length} toodet vajab täiendamist`,
  };
}

async function runWeeklyNewsletter(): Promise<{ success: boolean; message: string; messageEt: string }> {
  const { generateEmailCampaign, sendBulkEmails } = await import('./aiEmailCampaigns');
  
  const campaign = await generateEmailCampaign({
    type: 'newsletter',
    occasion: 'Weekly Update',
  });

  const result = await sendBulkEmails(campaign, 'all');

  return {
    success: true,
    message: `Weekly newsletter sent to ${result.successful} subscribers`,
    messageEt: `Iganädalane uudiskiri saadetud ${result.successful} tellijale`,
  };
}

async function runInactiveCustomerWinback(): Promise<{ success: boolean; message: string; messageEt: string }> {
  const { generateEmailCampaign, sendBulkEmails } = await import('./aiEmailCampaigns');
  
  const campaign = await generateEmailCampaign({
    type: 'winback',
    discount: 20,
  });

  const result = await sendBulkEmails(campaign, 'inactive');

  return {
    success: true,
    message: `Win-back campaign sent to ${result.successful} inactive customers`,
    messageEt: `Tagasivõidu kampaania saadetud ${result.successful} inaktiivsele kliendile`,
  };
}

async function runAbandonedCartReminders(): Promise<{ success: boolean; message: string; messageEt: string }> {
  const { generateEmailCampaign, sendBulkEmails } = await import('./aiEmailCampaigns');
  
  const campaign = await generateEmailCampaign({
    type: 'abandoned_cart',
  });

  const result = await sendBulkEmails(campaign, 'all');

  return {
    success: true,
    message: `Abandoned cart reminders sent: ${result.successful} emails`,
    messageEt: `Ostukorvi meeldetuletused saadetud: ${result.successful} meili`,
  };
}

async function runPriceOptimization(): Promise<{ success: boolean; message: string; messageEt: string }> {
  const { runPricingAnalysis } = await import('./aiPricing');
  
  const analysis = await runPricingAnalysis(false);
  
  await storage.saveAIReport('pricing-recommendations-latest', {
    timestamp: new Date(),
    analysis,
    automated: true,
  });

  const adjustmentCount = analysis.adjustments?.length || 0;

  return {
    success: true,
    message: `Price optimization complete: ${adjustmentCount} price adjustments analyzed`,
    messageEt: `Hindade optimeerimine lõpetatud: ${adjustmentCount} hinnamuudatust analüüsitud`,
  };
}

async function runSeoAudit(): Promise<{ success: boolean; message: string; messageEt: string }> {
  const { analyzeSeo } = await import('./aiSeo');
  
  const audit = await analyzeSeo();
  
  await storage.saveAIReport('seo-audit-latest', {
    timestamp: new Date(),
    audit,
    automated: true,
  });

  const issueCount = audit.recommendations?.length || 0;

  return {
    success: true,
    message: `SEO audit complete: ${issueCount} recommendations generated`,
    messageEt: `SEO audit lõpetatud: ${issueCount} soovitust genereeritud`,
  };
}

async function runWishlistPriceAlerts(): Promise<{ success: boolean; message: string; messageEt: string }> {
  const { checkWishlistPriceDrops } = await import('./wishlistAlerts');
  
  const result = await checkWishlistPriceDrops();

  return {
    success: true,
    message: `Wishlist alerts: ${result.alertsSent} customers notified about price drops`,
    messageEt: `Soovide nimekirja teavitused: ${result.alertsSent} klienti teavitatud hinnalangetustest`,
  };
}

async function runAutoProducts(): Promise<{ success: boolean; message: string; messageEt: string }> {
  const { analyzeDemandAndAddProducts, getDefaultSettings } = await import('./aiAutoProducts');
  
  const settings = await storage.getAIReport('auto-products-settings') || getDefaultSettings();
  const result = await analyzeDemandAndAddProducts(settings);

  return {
    success: true,
    message: `Auto products: ${result.productsAdded} new products added`,
    messageEt: `Autotooted: ${result.productsAdded} uut toodet lisatud`,
  };
}

async function runPointsExpiration(): Promise<{ success: boolean; message: string; messageEt: string }> {
  try {
    const result = await storage.expireOldPoints();
    
    return {
      success: true,
      message: result.expiredCount > 0 
        ? `Points expiration: ${result.expiredCount} points expired from ${result.usersAffected} users`
        : 'No points to expire',
      messageEt: result.expiredCount > 0 
        ? `Punktide aegumine: ${result.expiredCount} punkti aegus ${result.usersAffected} kasutajalt`
        : 'Aegunud punkte ei leitud',
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Points expiration failed: ${error.message}`,
      messageEt: `Punktide aegumine ebaõnnestus: ${error.message}`,
    };
  }
}

async function runRotatingFlashSales(): Promise<{ success: boolean; message: string; messageEt: string }> {
  try {
    const products = await storage.getProducts();
    const now = new Date();
    const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    
    const activeProducts = products.filter(p => 
      p.isActive && 
      p.stock && p.stock > 0 &&
      parseFloat(p.price || '0') > 10
    );
    
    if (activeProducts.length === 0) {
      return {
        success: true,
        message: 'No eligible products for flash sales',
        messageEt: 'Välkmüügiks sobivaid tooteid ei leitud',
      };
    }
    
    const expiredDiscounts = products.filter(p => 
      p.discountEndDate && new Date(p.discountEndDate) < now
    );
    
    for (const product of expiredDiscounts) {
      await storage.updateProduct(product.id, {
        salePrice: null,
        discountPercent: null,
        discountStartDate: null,
        discountEndDate: null,
      });
    }
    
    const discountTiers = [10, 15, 20, 25, 30];
    const numberOfProducts = Math.min(Math.floor(Math.random() * 8) + 5, activeProducts.length);
    
    const shuffled = [...activeProducts].sort(() => Math.random() - 0.5);
    const selectedProducts = shuffled.slice(0, numberOfProducts);
    
    const discountedProducts: Array<{name: string; discount: number}> = [];
    
    for (const product of selectedProducts) {
      const discountPercent = discountTiers[Math.floor(Math.random() * discountTiers.length)];
      const originalPrice = parseFloat(product.price || '0');
      const salePrice = (originalPrice * (1 - discountPercent / 100)).toFixed(2);
      
      await storage.updateProduct(product.id, {
        salePrice: salePrice,
        discountPercent: discountPercent,
        discountStartDate: now,
        discountEndDate: fourDaysFromNow,
      });
      
      discountedProducts.push({
        name: product.nameEn || product.nameEt || 'Unknown',
        discount: discountPercent,
      });
    }
    
    const flashSaleReport = {
      timestamp: now,
      expiresAt: fourDaysFromNow,
      expiredDiscountsCleared: expiredDiscounts.length,
      newDiscountsApplied: discountedProducts.length,
      products: discountedProducts,
    };
    
    await storage.saveAIReport('flash-sale-latest', flashSaleReport);
    await storage.saveAIReport(`flash-sale-${now.toISOString().split('T')[0]}`, flashSaleReport);

    return {
      success: true,
      message: `Flash sales: ${discountedProducts.length} products discounted (10-30% off), ${expiredDiscounts.length} old discounts cleared`,
      messageEt: `Välkmüük: ${discountedProducts.length} toodet allahindlusega (10-30%), ${expiredDiscounts.length} vana allahindlust eemaldatud`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Rotating flash sales failed: ${error.message}`,
      messageEt: `Rotatsioonilised välkmüügid ebaõnnestusid: ${error.message}`,
    };
  }
}

function shouldRunTask(task: ScheduledTask, now: Date): boolean {
  if (!task.enabled) return false;
  
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const minute = now.getMinutes();
  
  if (minute !== 0) return false;

  switch (task.schedule) {
    case 'hourly':
      return true;
    case 'daily':
      return hour === (task.hour || 8);
    case 'weekly':
      return dayOfWeek === (task.dayOfWeek || 1) && hour === (task.hour || 10);
    case 'custom':
      return false;
    default:
      return false;
  }
}

export async function checkAndRunScheduledTasks(): Promise<void> {
  const settings = await getAutomationSettings();
  
  if (!settings.enabled) {
    return;
  }

  const now = new Date();
  
  for (const [taskId, task] of Object.entries(settings.tasks)) {
    if (shouldRunTask(task, now)) {
      if (task.lastRun) {
        const lastRunTime = new Date(task.lastRun).getTime();
        const timeSinceLastRun = now.getTime() - lastRunTime;
        
        if (task.schedule === 'hourly' && timeSinceLastRun < 55 * 60 * 1000) continue;
        if (task.schedule === 'daily' && timeSinceLastRun < 23 * 60 * 60 * 1000) continue;
        if (task.schedule === 'weekly' && timeSinceLastRun < 6 * 24 * 60 * 60 * 1000) continue;
      }
      
      console.log(`[AUTOMATION] Scheduled task triggered: ${task.name}`);
      runTask(taskId).catch(err => console.error(`[AUTOMATION] Task ${taskId} error:`, err));
    }
  }
}

export function startAutomationScheduler(): void {
  if (mainInterval) {
    clearInterval(mainInterval);
  }

  console.log('[AUTOMATION] Starting automation scheduler...');
  
  mainInterval = setInterval(() => {
    checkAndRunScheduledTasks().catch(err => {
      console.error('[AUTOMATION] Scheduler error:', err);
    });
  }, 60 * 1000);

  console.log('[AUTOMATION] Scheduler started - checking tasks every minute');
}

export function stopAutomationScheduler(): void {
  if (mainInterval) {
    clearInterval(mainInterval);
    mainInterval = null;
    console.log('[AUTOMATION] Scheduler stopped');
  }
}

export async function getAutomationLogs(limit: number = 50): Promise<any[]> {
  const logs: any[] = [];
  
  const reportTypes = [
    'daily-report-latest',
    'low-stock-alert-latest',
    'pricing-recommendations-latest',
    'seo-audit-latest',
    'auto-products-latest',
  ];

  for (const type of reportTypes) {
    const report = await storage.getAIReport(type);
    if (report) {
      logs.push({
        type,
        ...report,
      });
    }
  }

  return logs.sort((a, b) => 
    new Date(b.timestamp || b.generatedAt || 0).getTime() - 
    new Date(a.timestamp || a.generatedAt || 0).getTime()
  ).slice(0, limit);
}
