import { Product, ProductBadge, PriceTier } from '@/types/fastapi.types';

/**
 * Get price tier based on price_percentile
 * @param percentile - Value between 0.0 and 1.0
 * @returns Price tier classification
 */
export function getPriceTier(percentile: number | undefined): PriceTier {
  if (percentile === undefined) return 'mid';
  
  if (percentile < 0.2) return 'budget';
  if (percentile < 0.4) return 'value';
  if (percentile < 0.7) return 'mid';
  if (percentile < 0.9) return 'premium';
  return 'luxury';
}

/**
 * Get product badge based on price_percentile and budget_hub
 * This implements the "Explainable Results" requirement
 * @param product - Product with price_percentile and budget_hub
 * @returns Badge information for display
 */
export function getProductBadge(product: Product): ProductBadge | null {
  // Hub products get special badge
  if (product.budget_hub) {
    return {
      label: 'Popular Starter',
      type: 'hub',
      color: 'blue',
    };
  }

  // Check price_percentile for value/premium badges
  if (product.price_percentile !== undefined) {
    if (product.price_percentile < 0.3) {
      return {
        label: 'Great Value',
        type: 'value',
        color: 'green',
      };
    }
    
    if (product.price_percentile > 0.7) {
      return {
        label: 'Premium Pick',
        type: 'premium',
        color: 'purple',
      };
    }
  }

  return null;
}

/**
 * Get all applicable badges for a product
 * @param product - Product to get badges for
 * @returns Array of badges
 */
export function getProductBadges(product: Product): ProductBadge[] {
  const badges: ProductBadge[] = [];

  // Hub product badge
  if (product.budget_hub) {
    badges.push({
      label: 'Popular Starter',
      type: 'hub',
      color: 'blue',
    });
  }

  // Price tier badges
  if (product.price_percentile !== undefined) {
    if (product.price_percentile < 0.2) {
      badges.push({
        label: 'Budget Friendly',
        type: 'value',
        color: 'green',
      });
    } else if (product.price_percentile < 0.4) {
      badges.push({
        label: 'Great Value',
        type: 'value',
        color: 'green',
      });
    } else if (product.price_percentile > 0.8) {
      badges.push({
        label: 'Luxury',
        type: 'premium',
        color: 'gold',
      });
    } else if (product.price_percentile > 0.7) {
      badges.push({
        label: 'Premium Pick',
        type: 'premium',
        color: 'purple',
      });
    }
  }

  return badges;
}

/**
 * Format price with currency
 * @param price - Price in cents or dollars
 * @param currency - Currency symbol
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = '$'): string {
  return `${currency}${price.toFixed(2)}`;
}

/**
 * Calculate discounted price
 * @param price - Original price
 * @param discountPercentage - Discount percentage (0-100)
 * @returns Discounted price
 */
export function getDiscountedPrice(price: number, discountPercentage: number): number {
  return price * (1 - discountPercentage / 100);
}

/**
 * Get price explanation based on percentile
 * @param percentile - Price percentile (0-1)
 * @param categoryName - Category name
 * @returns Human-readable explanation
 */
export function getPriceExplanation(percentile: number | undefined, categoryName?: string): string {
  if (percentile === undefined) return '';

  const category = categoryName ? ` in ${categoryName}` : '';
  
  if (percentile < 0.2) {
    return `This is among the most affordable options${category}.`;
  } else if (percentile < 0.4) {
    return `This offers great value${category}.`;
  } else if (percentile < 0.6) {
    return `This is a mid-range option${category}.`;
  } else if (percentile < 0.8) {
    return `This is a premium option${category}.`;
  } else {
    return `This is a luxury/high-end option${category}.`;
  }
}
