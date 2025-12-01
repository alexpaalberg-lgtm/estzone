import OpenAI from 'openai';
import { storage } from '../storage';
import type { Product } from '@shared/schema';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface SystemIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'missing_image' | 'missing_description' | 'price_issue' | 'stock_issue' | 'seo_issue' | 'translation_issue';
  productId?: string;
  productName?: string;
  message: string;
  messageEt: string;
  autoFixable: boolean;
  autoFixApplied?: boolean;
  fixDetails?: string;
  detectedAt: Date;
}

interface SystemHealthReport {
  timestamp: Date;
  overallHealth: 'healthy' | 'warning' | 'critical';
  healthScore: number;
  issuesFound: number;
  issuesFixed: number;
  issues: SystemIssue[];
  checksPerformed: string[];
  recommendations: string[];
}

export async function runSystemHealthCheck(autoFix: boolean = true): Promise<SystemHealthReport> {
  const issues: SystemIssue[] = [];
  const checksPerformed: string[] = [];
  let issuesFixed = 0;

  try {
    const products = await storage.getProducts();
    const categories = await storage.getCategories();

    // Check 1: Missing or broken images
    checksPerformed.push('Product images check');
    for (const product of products) {
      if (!product.images || product.images.length === 0) {
        issues.push({
          id: `img-${product.id}`,
          type: 'error',
          category: 'missing_image',
          productId: product.id,
          productName: product.nameEn,
          message: `Product "${product.nameEn}" has no images`,
          messageEt: `Tootel "${product.nameEt}" puuduvad pildid`,
          autoFixable: false,
          detectedAt: new Date(),
        });
      }
    }

    // Check 2: Missing descriptions
    checksPerformed.push('Product descriptions check');
    for (const product of products) {
      if (!product.descriptionEn || product.descriptionEn.length < 50) {
        const issue: SystemIssue = {
          id: `desc-en-${product.id}`,
          type: 'warning',
          category: 'missing_description',
          productId: product.id,
          productName: product.nameEn,
          message: `Product "${product.nameEn}" has short or missing English description`,
          messageEt: `Tootel "${product.nameEt}" on lühike või puuduv ingliskeelne kirjeldus`,
          autoFixable: true,
          detectedAt: new Date(),
        };

        if (autoFix && product.descriptionEn && product.descriptionEn.length > 20) {
          try {
            const enhancedDesc = await enhanceProductDescription(product, 'en');
            if (enhancedDesc) {
              await storage.updateProduct(product.id, { descriptionEn: enhancedDesc });
              issue.autoFixApplied = true;
              issue.fixDetails = 'Enhanced English description with AI';
              issuesFixed++;
            }
          } catch (e) {
            console.error('Failed to enhance description:', e);
          }
        }
        issues.push(issue);
      }

      if (!product.descriptionEt || product.descriptionEt.length < 50) {
        const issue: SystemIssue = {
          id: `desc-et-${product.id}`,
          type: 'warning',
          category: 'missing_description',
          productId: product.id,
          productName: product.nameEn,
          message: `Product "${product.nameEn}" has short or missing Estonian description`,
          messageEt: `Tootel "${product.nameEt}" on lühike või puuduv eestikeelne kirjeldus`,
          autoFixable: true,
          detectedAt: new Date(),
        };

        if (autoFix && product.descriptionEn && product.descriptionEn.length > 50 && (!product.descriptionEt || product.descriptionEt.length < 50)) {
          try {
            const translatedDesc = await translateDescription(product.descriptionEn, 'et');
            if (translatedDesc) {
              await storage.updateProduct(product.id, { descriptionEt: translatedDesc });
              issue.autoFixApplied = true;
              issue.fixDetails = 'Translated description from English to Estonian';
              issuesFixed++;
            }
          } catch (e) {
            console.error('Failed to translate description:', e);
          }
        }
        issues.push(issue);
      }
    }

    // Check 3: Price issues
    checksPerformed.push('Price consistency check');
    for (const product of products) {
      const price = parseFloat(product.price);
      const salePrice = product.salePrice ? parseFloat(product.salePrice) : null;

      if (price <= 0) {
        issues.push({
          id: `price-zero-${product.id}`,
          type: 'error',
          category: 'price_issue',
          productId: product.id,
          productName: product.nameEn,
          message: `Product "${product.nameEn}" has invalid price (${price})`,
          messageEt: `Tootel "${product.nameEt}" on vigane hind (${price})`,
          autoFixable: false,
          detectedAt: new Date(),
        });
      }

      if (salePrice && salePrice >= price) {
        const issue: SystemIssue = {
          id: `price-sale-${product.id}`,
          type: 'warning',
          category: 'price_issue',
          productId: product.id,
          productName: product.nameEn,
          message: `Product "${product.nameEn}" sale price (€${salePrice}) is >= regular price (€${price})`,
          messageEt: `Toote "${product.nameEt}" soodushind (€${salePrice}) on >= tavahinnast (€${price})`,
          autoFixable: true,
          detectedAt: new Date(),
        };

        if (autoFix) {
          try {
            await storage.updateProduct(product.id, { salePrice: undefined });
            issue.autoFixApplied = true;
            issue.fixDetails = 'Removed invalid sale price';
            issuesFixed++;
          } catch (e) {
            console.error('Failed to fix sale price:', e);
          }
        }
        issues.push(issue);
      }
    }

    // Check 4: Stock issues
    checksPerformed.push('Stock levels check');
    const outOfStockProducts = products.filter(p => p.stock === 0 && p.isActive);
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 10) && p.isActive);

    if (outOfStockProducts.length > 0) {
      issues.push({
        id: `stock-out-${Date.now()}`,
        type: 'warning',
        category: 'stock_issue',
        message: `${outOfStockProducts.length} active products are out of stock`,
        messageEt: `${outOfStockProducts.length} aktiivset toodet on laost otsas`,
        autoFixable: false,
        detectedAt: new Date(),
      });
    }

    if (lowStockProducts.length > 10) {
      issues.push({
        id: `stock-low-${Date.now()}`,
        type: 'warning',
        category: 'stock_issue',
        message: `${lowStockProducts.length} products have low stock`,
        messageEt: `${lowStockProducts.length} tootel on madal laoseis`,
        autoFixable: false,
        detectedAt: new Date(),
      });
    }

    // Check 5: Category validation
    checksPerformed.push('Category assignment check');
    const productsWithoutCategory = products.filter(p => !p.categoryId);
    if (productsWithoutCategory.length > 0) {
      issues.push({
        id: `cat-missing-${Date.now()}`,
        type: 'error',
        category: 'seo_issue',
        message: `${productsWithoutCategory.length} products have no category assigned`,
        messageEt: `${productsWithoutCategory.length} tootel puudub kategooria`,
        autoFixable: false,
        detectedAt: new Date(),
      });
    }

    // Check 6: Translation consistency
    checksPerformed.push('Translation consistency check');
    for (const product of products) {
      if (product.nameEn && !product.nameEt) {
        const issue: SystemIssue = {
          id: `name-et-${product.id}`,
          type: 'warning',
          category: 'translation_issue',
          productId: product.id,
          productName: product.nameEn,
          message: `Product "${product.nameEn}" missing Estonian name`,
          messageEt: `Tootel "${product.nameEn}" puudub eestikeelne nimi`,
          autoFixable: true,
          detectedAt: new Date(),
        };

        if (autoFix) {
          try {
            const translatedName = await translateText(product.nameEn, 'et');
            if (translatedName) {
              await storage.updateProduct(product.id, { nameEt: translatedName });
              issue.autoFixApplied = true;
              issue.fixDetails = 'Translated name from English to Estonian';
              issuesFixed++;
            }
          } catch (e) {
            console.error('Failed to translate name:', e);
          }
        }
        issues.push(issue);
      }
    }

    // Calculate health score
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;
    const totalProducts = products.length;

    let healthScore = 100;
    healthScore -= (errorCount * 5);
    healthScore -= (warningCount * 2);
    healthScore = Math.max(0, Math.min(100, healthScore));

    let overallHealth: 'healthy' | 'warning' | 'critical';
    if (healthScore >= 80 && errorCount === 0) {
      overallHealth = 'healthy';
    } else if (healthScore >= 50 && errorCount <= 5) {
      overallHealth = 'warning';
    } else {
      overallHealth = 'critical';
    }

    // Generate AI recommendations
    const recommendations = await generateRecommendations(issues, products.length);

    const report: SystemHealthReport = {
      timestamp: new Date(),
      overallHealth,
      healthScore,
      issuesFound: issues.length,
      issuesFixed,
      issues,
      checksPerformed,
      recommendations,
    };

    // Save the health report
    await storage.saveAIReport(`health-${new Date().toISOString().split('T')[0]}`, report);

    return report;
  } catch (error) {
    console.error('System health check error:', error);
    // Return fallback report instead of throwing with bilingual content
    return {
      timestamp: new Date(),
      overallHealth: 'warning' as const,
      healthScore: 50,
      issuesFound: 0,
      issuesFixed: 0,
      issues: [],
      checksPerformed: ['Fallback mode - AI unavailable / Varuvariant - AI pole saadaval'],
      recommendations: [
        'AI analysis unavailable - manual review recommended / AI analüüs pole saadaval - soovitatav käsitsi ülevaade',
        'Check OpenAI API connectivity / Kontrolli OpenAI API ühendust',
      ],
    };
  }
}

async function enhanceProductDescription(product: Product, language: string): Promise<string | null> {
  try {
    const prompt = `Enhance this gaming product description to be more compelling and SEO-friendly. Keep it under 500 characters.

Product: ${product.nameEn}
Current description: ${product.descriptionEn}
Category: Gaming product

Return only the enhanced description, no explanation.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    return completion.choices[0].message.content?.trim() || null;
  } catch (error) {
    console.error('Failed to enhance description:', error);
    return null;
  }
}

async function translateDescription(text: string, targetLang: string): Promise<string | null> {
  try {
    const langName = targetLang === 'et' ? 'Estonian' : 'English';
    const prompt = `Translate this gaming product description to ${langName}. Keep the same tone and style.

Text: ${text}

Return only the translation, no explanation.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    });

    return completion.choices[0].message.content?.trim() || null;
  } catch (error) {
    console.error('Failed to translate description:', error);
    return null;
  }
}

async function translateText(text: string, targetLang: string): Promise<string | null> {
  try {
    const langName = targetLang === 'et' ? 'Estonian' : 'English';
    const prompt = `Translate this product name to ${langName}. Keep it concise.

Text: ${text}

Return only the translation, no explanation.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.3,
    });

    return completion.choices[0].message.content?.trim() || null;
  } catch (error) {
    console.error('Failed to translate text:', error);
    return null;
  }
}

async function generateRecommendations(issues: SystemIssue[], totalProducts: number): Promise<string[]> {
  try {
    const issuesSummary = {
      total: issues.length,
      errors: issues.filter(i => i.type === 'error').length,
      warnings: issues.filter(i => i.type === 'warning').length,
      byCategory: {
        images: issues.filter(i => i.category === 'missing_image').length,
        descriptions: issues.filter(i => i.category === 'missing_description').length,
        prices: issues.filter(i => i.category === 'price_issue').length,
        stock: issues.filter(i => i.category === 'stock_issue').length,
        seo: issues.filter(i => i.category === 'seo_issue').length,
        translations: issues.filter(i => i.category === 'translation_issue').length,
      },
    };

    const prompt = `Based on this e-commerce catalog health check, provide 3-5 prioritized recommendations:

Total Products: ${totalProducts}
Issues Summary: ${JSON.stringify(issuesSummary)}

Provide actionable, specific recommendations. Format as a JSON array of strings.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    return response.recommendations || [
      'Review and add missing product images',
      'Ensure all products have complete bilingual descriptions',
      'Check inventory levels and restock low-stock items',
    ];
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    return [
      'Review and fix product catalog issues',
      'Ensure bilingual content is complete',
      'Monitor stock levels regularly',
    ];
  }
}

// Scheduled health check (can be called periodically)
export async function scheduleHealthCheck(): Promise<void> {
  console.log('[AI System Monitor] Running scheduled health check...');
  try {
    const report = await runSystemHealthCheck(true);
    console.log(`[AI System Monitor] Health check complete. Score: ${report.healthScore}, Issues: ${report.issuesFound}, Fixed: ${report.issuesFixed}`);
  } catch (error) {
    console.error('[AI System Monitor] Health check failed:', error);
  }
}
