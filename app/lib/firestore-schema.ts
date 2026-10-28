/**
 * UnlockPremium Shop — Firestore Data Model & Schema Definitions
 * 
 * Strict architectural boundaries:
 * 1. Monetary values are stored in integer minor units (pence for GBP: 8999 = £89.99).
 * 2. Public product documents contain only storefront-appropriate display data.
 * 3. Confidential supplier data and internal logo-permission documentation are
 *    isolated in the admin-only 'products_internal' collection.
 * 4. Demonstration catalogue items are preserved with status: 'draft' during migration.
 */

export type ProductStatus = 'draft' | 'published' | 'unpublished';

export type ActivationType =
  | 'instant_invite'
  | 'credentials'
  | 'license_key'
  | 'redemption_link';

export type LogoUsageStatus = 'none' | 'pending' | 'approved';

/**
 * Multi-duration & pricing variant per product
 */
export interface ProductVariant {
  id: string; // e.g. "1mo", "12mo", "lifetime"
  name: string; // e.g. "1 Month", "12 Months (Annual)"
  durationMonths: number; // e.g. 1, 12, 0 for lifetime
  priceMinor: number; // Integer minor currency units (e.g. 8999 = £89.99)
  currency: string; // ISO 4217 currency code (default: 'GBP')
  isAvailable: boolean; // Stock availability toggle
  isDefault: boolean; // Pre-selected option
}

/**
 * Publicly queryable Product document in Firestore (`products/{productId}`)
 * Public access is strictly gated by `status == 'published'`.
 */
export interface FirestoreProduct {
  id: string;
  slug: string; // URL slug (e.g. "canva-pro-annual")
  name: string; // Display title
  brandName: string; // Brand name (e.g. "Canva")
  category: string; // Matches Category taxonomy name
  tagline: string;
  description: string;
  status: ProductStatus;
  isAvailable: boolean; // Global stock availability toggle
  badge?: string; // Optional tag: "Popular", "Pro Choice", etc.
  features: string[]; // List of included features
  activationType: ActivationType;
  supportTerms: string; // e.g. "30-day replacement support"
  demoPriceMinor: number; // Base display price in minor units (e.g. 8999 for £89.99)
  currency: string; // Default: 'GBP'

  // Multi-duration & pricing variants
  variants: ProductVariant[];

  // Brand visual presentation
  logoUsageStatus: LogoUsageStatus; // Only 'approved' permits displaying official logo
  logoUrl?: string; // Path or URL to official logo
  coverImageUrl?: string; // Path or URL to separate cover image
  imageAlt?: string; // Descriptive accessibility alt text
  brandThemeColor?: string; // Hex color for typography graphics

  // Audit timestamps
  createdAt: string; // ISO 8601 string or Timestamp
  updatedAt: string;
  publishedAt: string | null;
  isDemo: boolean; // Flag identifying demonstration catalogue listings
}

/**
 * Category taxonomy document in Firestore (`categories/{categoryId}`)
 */
export interface FirestoreCategory {
  id: string; // e.g. "design-creativity"
  name: string; // e.g. "Design & Creativity"
  description: string;
  icon: string; // Category emoji or icon descriptor
  gradient: string; // Visual gradient styling classes
  displayOrder: number;
}

/**
 * Strictly Confidential & Admin-Only Document (`products_internal/{productId}`)
 * Inaccessible to public users via Firestore Security Rules.
 * Contains supplier information, wholesale costs, margins, and internal logo permission records.
 */
export interface ProductInternalData {
  productId: string;
  supplierName: string; // Direct supplier or distributor name
  supplierContact: string; // Portal URL, email, or order reference
  costMinor: number; // Wholesale unit cost in integer minor units (e.g. 4500 = £45.00)
  currency: string; // Cost currency (default: 'GBP')
  targetMarginPercent: number; // Expected profit margin percentage
  accountManagementNotes: string; // Internal operational notes (NO user passwords stored)
  logoPermissionSource: string; // Formal source / ticket reference for logo permissions
  logoPermissionNotes: string; // Legal or partner review notes regarding brand assets
  lastReviewedDate: string; // ISO 8601 date string
  updatedByUid?: string; // Admin UID who last modified the internal record
}

/**
 * Helper to format minor units to display price string
 * e.g. formatMinorCurrency(8999, 'GBP') => "£89.99"
 */
export function formatMinorCurrency(
  minorAmount: number,
  currency: string = 'GBP'
): string {
  const amount = minorAmount / 100;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
