// Cart "Recommended for you" logic.
//
// Recommendations are derived from the live product catalog
// (/content/products/index.json — the same source ShopPage falls back to)
// instead of a hardcoded list. This means:
//  - discontinued products (e.g. the old Watermelon cuticle oil) can never
//    appear here, because they are not in the catalog, and
//  - suggestions are tailored to what's already in the cart (same category
//    first) and rotate so the customer doesn't always see the same items.

import { CartItem } from './cart';
import { supabase } from './supabase';

export interface CatalogProduct {
  id?: string;
  slug: string;
  title: string;
  price: number;
  thumbnail?: string;
  images?: string[];
  category?: string;
  subcategory?: string;
  status?: string;
  stockStatus?: string;
  stock?: number;
  stock_qty?: number;
  stock_on_hand?: number;
  inventory_quantity?: number;
  out_of_stock?: boolean;
  rating?: number;
  reviews?: number;
}

export interface RecommendedProduct {
  slug: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

let catalogCache: CatalogProduct[] | null = null;
let catalogPromise: Promise<CatalogProduct[]> | null = null;

const toNumberOrNull = (value: unknown): number | null => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const getStockLevel = (p: CatalogProduct): number | null => {
  const values = [
    p.stock_qty,
    p.stock_on_hand,
    p.inventory_quantity,
    p.stock,
  ].map(toNumberOrNull).filter((value): value is number => value !== null);

  return values.length > 0 ? Math.max(...values) : null;
};

type SupabaseProduct = {
  id?: string;
  name?: string;
  slug?: string;
  price?: number;
  price_cents?: number;
  thumbnail_url?: string;
  image_url?: string;
  gallery_urls?: string[];
  category?: string | string[];
  subcategory?: string;
  status?: string;
  is_active?: boolean;
  stock?: number;
  stock_qty?: number;
  stock_on_hand?: number;
  inventory_quantity?: number;
  out_of_stock?: boolean;
};

const mapSupabaseProduct = (p: SupabaseProduct): CatalogProduct => ({
  id: p.id,
  slug: p.slug,
  title: p.name,
  price: p.price || (p.price_cents ? p.price_cents / 100 : 0),
  thumbnail: p.thumbnail_url || p.image_url,
  images: [p.thumbnail_url, p.image_url, ...(Array.isArray(p.gallery_urls) ? p.gallery_urls : [])].filter(Boolean),
  category: Array.isArray(p.category) ? p.category[0] : p.category,
  subcategory: p.subcategory,
  status: p.status || (p.is_active === false ? 'inactive' : 'active'),
  stock: p.stock,
  stock_qty: p.stock_qty,
  stock_on_hand: p.stock_on_hand,
  inventory_quantity: p.inventory_quantity,
  out_of_stock: p.out_of_stock === true,
  rating: 0,
  reviews: 0,
});

// Load (and cache) the catalog. Prefer Supabase so admin stock changes affect
// recommendations immediately; fall back to the static catalog if Supabase is
// unavailable.
export async function loadCatalog(): Promise<CatalogProduct[]> {
  if (catalogCache) return catalogCache;
  if (!catalogPromise) {
    catalogPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id,name,slug,price,price_cents,thumbnail_url,image_url,gallery_urls,category,subcategory,status,is_active,stock,stock_qty,stock_on_hand,inventory_quantity,out_of_stock')
          .in('status', ['active', 'published']);

        if (!error && Array.isArray(data) && data.length > 0) {
          catalogCache = (data as SupabaseProduct[]).map(mapSupabaseProduct);
          return catalogCache;
        }

        const res = await fetch('/content/products/index.json', { cache: 'no-store' });
        const staticData = res.ok ? await res.json() : [];
        catalogCache = Array.isArray(staticData) ? (staticData as CatalogProduct[]) : [];
        return catalogCache;
      } catch {
        catalogCache = [];
        return catalogCache;
      }
    })();
  }
  return catalogPromise;
}

const isAvailable = (p: CatalogProduct): boolean => {
  const stockLevel = getStockLevel(p);
  return (p.status || 'active') === 'active' &&
    p.out_of_stock !== true &&
    (p.stockStatus ? p.stockStatus === 'In Stock' : true) &&
    (stockLevel === null || stockLevel > 0) &&
    typeof p.price === 'number' &&
    p.price >= 0;
};

const byPopularity = (a: CatalogProduct, b: CatalogProduct): number =>
  (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0);

// Rotate an array by n places so repeat visits surface different items.
const rotate = <T>(arr: T[], n: number): T[] => {
  if (arr.length === 0) return arr;
  const offset = ((n % arr.length) + arr.length) % arr.length;
  return arr.slice(offset).concat(arr.slice(0, offset));
};

const toRecommended = (p: CatalogProduct): RecommendedProduct => ({
  slug: p.slug,
  name: p.title,
  price: p.price,
  image: p.thumbnail || (p.images && p.images[0]) || '',
  category: p.category || '',
});

/**
 * Build "Recommended for you" suggestions for the current cart.
 *
 * Products that share a category with something already in the cart are
 * prioritised, then the rest of the catalog fills any remaining slots.
 * Anything already in the cart is excluded, and a seed-based rotation keeps
 * the list from being identical every time.
 */
export function buildRecommendations(
  catalog: CatalogProduct[],
  cartItems: CartItem[],
  limit = 3,
  seed = 0
): RecommendedProduct[] {
  const inCart = new Set(cartItems.flatMap((i) => [i.productId, i.id].filter(Boolean)));
  const productKeys: Array<[string, CatalogProduct]> = catalog.flatMap((p) =>
    [[p.slug, p], [p.id || '', p]] as Array<[string, CatalogProduct]>
  ).filter(([key]) => Boolean(key));
  const bySlug = new Map<string, CatalogProduct>(productKeys);

  // Categories represented in the cart (mapped from each item's slug).
  const cartCategories = new Set(
    cartItems
      .map((i) => bySlug.get(i.productId)?.category)
      .filter((c): c is string => Boolean(c))
  );

  const available = catalog.filter((p) => isAvailable(p) && !inCart.has(p.slug));

  const sameCategory = available
    .filter((p) => p.category && cartCategories.has(p.category))
    .sort(byPopularity);
  const otherCategory = available
    .filter((p) => !p.category || !cartCategories.has(p.category))
    .sort(byPopularity);

  const ordered = [
    ...rotate(sameCategory, seed),
    ...rotate(otherCategory, seed),
  ];

  return ordered.slice(0, limit).map(toRecommended);
}
