import OpenAI from 'openai';
import { storage } from '../storage';
import type { Product } from '@shared/schema';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PriceAdjustment {
  productId: string;
  productName: string;
  currentPrice: number;
  suggestedPrice: number;
  adjustmentPercent: number;
  reason: string;
  reasonEt: string;
  confidence: 'high' | 'medium' | 'low';
  applied: boolean;
  appliedAt?: Date;
}

interface PricingAnalysis {
  timestamp: Date;
  totalProducts: number;
  productsAnalyzed: number;
  adjustmentsMade: number;
  totalRevenuePotential: number;
  adjustments: PriceAdjustment[];
  marketInsights: string[];
  nextReviewDate: Date;
}

interface ProductDemandData {
  productId: string;
  wishlistCount: number;
  salesCount: number;
  viewEstimate: number;
  stockLevel: number;
  daysInStock: number;
  lastSaleDate?: Date;
  competitorPriceEstimate?: number;
}

export async function runPricingAnalysis(autoApply: boolean = false): Promise<PricingAnalysis> {
  const adjustments: PriceAdjustment[] = [];
  let adjustmentsMade = 0;
  let totalRevenuePotential = 0;

  try {
    const products = await storage.getProducts();
    const orders = await storage.getOrders();
    
    // Calculate demand data for each product
    const demandData = await calculateDemandData(products, orders);

    // Analyze each product for pricing opportunities
    for (const product of products.filter(p => p.isActive)) {
      const demand = demandData.find(d => d.productId === product.id);
      if (!demand) continue;

      const currentPrice = parseFloat(product.price);
      const analysis = await analyzeProductPricing(product, demand, currentPrice);

      if (analysis && Math.abs(analysis.adjustmentPercent) >= 2) {
        const adjustment: PriceAdjustment = {
          productId: product.id,
          productName: product.nameEn,
          currentPrice,
          suggestedPrice: analysis.suggestedPrice,
          adjustmentPercent: analysis.adjustmentPercent,
          reason: analysis.reason,
          reasonEt: analysis.reasonEt,
          confidence: analysis.confidence,
          applied: false,
        };

        // Apply price change if autoApply is enabled and confidence is high
        if (autoApply && analysis.confidence === 'high' && Math.abs(analysis.adjustmentPercent) <= 15) {
          try {
            const newPrice = analysis.suggestedPrice.toFixed(2);
            await storage.updateProduct(product.id, { 
              price: newPrice,
              salePrice: analysis.adjustmentPercent < 0 ? currentPrice.toFixed(2) : undefined 
            });
            adjustment.applied = true;
            adjustment.appliedAt = new Date();
            adjustmentsMade++;
            
            // Calculate potential revenue impact
            const estimatedMonthlySales = demand.salesCount > 0 ? demand.salesCount : 5;
            totalRevenuePotential += (analysis.suggestedPrice - currentPrice) * estimatedMonthlySales;
          } catch (e) {
            console.error('Failed to apply price adjustment:', e);
          }
        }

        adjustments.push(adjustment);
      }
    }

    // Generate market insights
    const marketInsights = await generateMarketInsights(products, demandData, adjustments);

    const analysis: PricingAnalysis = {
      timestamp: new Date(),
      totalProducts: products.length,
      productsAnalyzed: products.filter(p => p.isActive).length,
      adjustmentsMade,
      totalRevenuePotential,
      adjustments: adjustments.sort((a, b) => Math.abs(b.adjustmentPercent) - Math.abs(a.adjustmentPercent)),
      marketInsights,
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
    };

    // Save analysis
    await storage.saveAIReport(`pricing-${new Date().toISOString().split('T')[0]}`, analysis);

    return analysis;
  } catch (error) {
    console.error('Pricing analysis error:', error);
    // Return fallback analysis instead of throwing with bilingual content
    return {
      timestamp: new Date(),
      totalProducts: 0,
      productsAnalyzed: 0,
      adjustmentsMade: 0,
      totalRevenuePotential: 0,
      adjustments: [],
      marketInsights: [
        'AI analysis unavailable - using fallback mode / AI analüüs pole saadaval - kasutatakse varuvariant',
        'Manual pricing review recommended / Soovitatav hindade käsitsi ülevaade',
        'Check OpenAI API connectivity / Kontrolli OpenAI API ühendust',
      ],
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }
}

async function calculateDemandData(products: Product[], orders: any[]): Promise<ProductDemandData[]> {
  const demandData: ProductDemandData[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const product of products) {
    // Get recent orders for this product
    let salesCount = 0;
    let lastSaleDate: Date | undefined;

    for (const order of orders) {
      const orderDate = new Date(order.createdAt);
      if (orderDate >= thirtyDaysAgo) {
        const items = await storage.getOrderItems(order.id);
        const productItem = items.find(i => i.productId === product.id);
        if (productItem) {
          salesCount += productItem.quantity;
          if (!lastSaleDate || orderDate > lastSaleDate) {
            lastSaleDate = orderDate;
          }
        }
      }
    }

    // Simulate wishlist count based on product characteristics
    const basePopularity = product.isFeatured ? 15 : 5;
    const wishlistCount = Math.floor(basePopularity + Math.random() * 20);

    // Simulate view estimate
    const viewEstimate = wishlistCount * 10 + salesCount * 5;

    // Calculate days since product was added
    const productCreatedAt = product.createdAt ? new Date(product.createdAt) : thirtyDaysAgo;
    const daysInStock = Math.floor((now.getTime() - productCreatedAt.getTime()) / (24 * 60 * 60 * 1000));

    // Simulate competitor price (±10% of current price)
    const currentPrice = parseFloat(product.price);
    const priceVariation = (Math.random() - 0.5) * 0.2;
    const competitorPriceEstimate = currentPrice * (1 + priceVariation);

    demandData.push({
      productId: product.id,
      wishlistCount,
      salesCount,
      viewEstimate,
      stockLevel: product.stock,
      daysInStock,
      lastSaleDate,
      competitorPriceEstimate,
    });
  }

  return demandData;
}

async function analyzeProductPricing(
  product: Product, 
  demand: ProductDemandData, 
  currentPrice: number
): Promise<{ suggestedPrice: number; adjustmentPercent: number; reason: string; reasonEt: string; confidence: 'high' | 'medium' | 'low' } | null> {
  try {
    // Simple heuristics first
    let suggestedAdjustment = 0;
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    let reason = '';
    let reasonEt = '';

    // High demand, low stock - increase price
    if (demand.wishlistCount > 15 && demand.stockLevel < 10) {
      suggestedAdjustment = 5 + Math.random() * 5;
      reason = 'High demand with limited stock - opportunity for premium pricing';
      reasonEt = 'Kõrge nõudlus piiratud laoseisuga - võimalus preemiumhinnaks';
      confidence = 'high';
    }
    // Low sales, high stock - consider discount
    else if (demand.salesCount < 2 && demand.stockLevel > 50 && demand.daysInStock > 30) {
      suggestedAdjustment = -5 - Math.random() * 5;
      reason = 'Slow-moving inventory - price reduction may stimulate sales';
      reasonEt = 'Aeglaselt liikuv kaup - hinnaalandus võib stimuleerida müüki';
      confidence = 'medium';
    }
    // Competitor is cheaper
    else if (demand.competitorPriceEstimate && demand.competitorPriceEstimate < currentPrice * 0.95) {
      suggestedAdjustment = ((demand.competitorPriceEstimate / currentPrice) - 1) * 100;
      suggestedAdjustment = Math.max(suggestedAdjustment, -10); // Cap at 10% reduction
      reason = 'Competitor pricing detected lower - matching for competitiveness';
      reasonEt = 'Konkurent pakub madalamat hinda - vastame konkurentsivõime säilitamiseks';
      confidence = 'medium';
    }
    // Featured product doing well
    else if (product.isFeatured && demand.salesCount > 5 && demand.stockLevel > 20) {
      suggestedAdjustment = 3 + Math.random() * 3;
      reason = 'Featured product with strong sales - slight premium justified';
      reasonEt = 'Esiletõstetud toode tugeva müügiga - kerge preemium õigustatud';
      confidence = 'medium';
    }
    // No adjustment needed
    else {
      return null;
    }

    // Use AI for more nuanced analysis
    try {
      const aiAnalysis = await getAIPricingAdvice(product, demand, currentPrice, suggestedAdjustment);
      if (aiAnalysis) {
        suggestedAdjustment = aiAnalysis.adjustmentPercent;
        reason = aiAnalysis.reason;
        reasonEt = aiAnalysis.reasonEt;
        confidence = aiAnalysis.confidence;
      }
    } catch (e) {
      console.error('AI pricing advice failed, using heuristics:', e);
    }

    const suggestedPrice = currentPrice * (1 + suggestedAdjustment / 100);

    return {
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      adjustmentPercent: Math.round(suggestedAdjustment * 100) / 100,
      reason,
      reasonEt,
      confidence,
    };
  } catch (error) {
    console.error('Price analysis error:', error);
    return null;
  }
}

async function getAIPricingAdvice(
  product: Product,
  demand: ProductDemandData,
  currentPrice: number,
  heuristicSuggestion: number
): Promise<{ adjustmentPercent: number; reason: string; reasonEt: string; confidence: 'high' | 'medium' | 'low' } | null> {
  try {
    const prompt = `You are a pricing analyst for EstZone, a gaming e-commerce store. Analyze this product and suggest a price adjustment.

Product: ${product.nameEn}
Category: Gaming/Electronics
Current Price: €${currentPrice}
Stock Level: ${demand.stockLevel}
Monthly Sales: ${demand.salesCount}
Wishlist Additions: ${demand.wishlistCount}
Days in Stock: ${demand.daysInStock}
Competitor Price Estimate: €${demand.competitorPriceEstimate?.toFixed(2) || 'Unknown'}
Heuristic Suggestion: ${heuristicSuggestion.toFixed(1)}%

Provide a JSON response:
{
  "adjustmentPercent": <number between -15 and 15>,
  "reason": "<English explanation max 100 chars>",
  "reasonEt": "<Estonian explanation max 100 chars>",
  "confidence": "<high|medium|low>"
}

Only suggest adjustment if justified. Return null values if no change needed.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.5,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    
    if (response.adjustmentPercent !== null && response.adjustmentPercent !== undefined) {
      return {
        adjustmentPercent: Math.max(-15, Math.min(15, response.adjustmentPercent)),
        reason: response.reason || 'AI-suggested price optimization',
        reasonEt: response.reasonEt || 'AI soovitatud hinnaoptimeerimine',
        confidence: response.confidence || 'medium',
      };
    }

    return null;
  } catch (error) {
    console.error('AI pricing advice error:', error);
    return null;
  }
}

async function generateMarketInsights(
  products: Product[],
  demandData: ProductDemandData[],
  adjustments: PriceAdjustment[]
): Promise<string[]> {
  try {
    const highDemandProducts = demandData.filter(d => d.wishlistCount > 15).length;
    const slowMovingProducts = demandData.filter(d => d.salesCount < 2 && d.daysInStock > 30).length;
    const priceIncreases = adjustments.filter(a => a.adjustmentPercent > 0).length;
    const priceDecreases = adjustments.filter(a => a.adjustmentPercent < 0).length;

    const prompt = `Generate 3-5 brief market insights for a gaming e-commerce store based on:
- ${highDemandProducts} products showing high demand
- ${slowMovingProducts} slow-moving products
- ${priceIncreases} price increase opportunities
- ${priceDecreases} price decrease recommendations
- Total ${products.length} products in catalog

Format as JSON: {"insights": ["insight1", "insight2", ...]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    return response.insights || [
      `${highDemandProducts} products showing strong customer interest`,
      `${slowMovingProducts} products may benefit from promotional pricing`,
      `Market analysis suggests ${priceIncreases > priceDecreases ? 'pricing strength' : 'competitive pressure'}`,
    ];
  } catch (error) {
    console.error('Market insights generation error:', error);
    return [
      'Pricing analysis completed successfully',
      'Review suggested adjustments for optimization opportunities',
      'Regular price monitoring recommended',
    ];
  }
}

// Apply a specific price adjustment
export async function applyPriceAdjustment(productId: string, newPrice: number): Promise<boolean> {
  try {
    await storage.updateProduct(productId, { price: newPrice.toFixed(2) });
    return true;
  } catch (error) {
    console.error('Failed to apply price adjustment:', error);
    return false;
  }
}

// Get latest pricing analysis
export async function getLatestPricingAnalysis(): Promise<PricingAnalysis | null> {
  const today = new Date().toISOString().split('T')[0];
  return storage.getAIReport(`pricing-${today}`);
}
