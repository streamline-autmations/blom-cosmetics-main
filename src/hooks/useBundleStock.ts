import { useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { getBundleComponentIds, isBundleInStock, isProductInStock } from '../lib/stockAvailability';

export type BundleStock = {
  inStock: boolean;
  /** How many of the bundle's component products are currently in stock. */
  componentsInStock: number;
};

/**
 * Live sold-out state for promo bundles, keyed by slug. Returns `null` while loading
 * (or if the lookup fails) so promo UIs can keep showing the offer rather than
 * flashing "sold out" on a slow connection — checkout still enforces stock.
 */
export const useBundleStock = (slugs: string[]): Record<string, BundleStock> | null => {
  const [stock, setStock] = useState<Record<string, BundleStock> | null>(null);
  const key = slugs.join('|');

  useEffect(() => {
    if (!supabaseConfigured || slugs.length === 0) return;
    let cancelled = false;

    (async () => {
      const { data: bundles, error } = await supabase
        .from('bundles')
        .select('slug, stock, is_active, status, bundle_products')
        .in('slug', slugs);
      if (error || !bundles) return;

      const ids = Array.from(new Set(bundles.flatMap(getBundleComponentIds)));
      let productsById: Map<string, any> | null = new Map();
      if (ids.length > 0) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, status, is_active, out_of_stock, stock, stock_qty, stock_on_hand, inventory_quantity')
          .in('id', ids);
        productsById = productsError ? null : new Map((products || []).map((p: any) => [String(p.id), p]));
      }

      const result: Record<string, BundleStock> = {};
      bundles.forEach((bundle: any) => {
        const componentIds = getBundleComponentIds(bundle);
        result[bundle.slug] = {
          inStock: isBundleInStock(bundle, productsById),
          componentsInStock: productsById
            ? componentIds.filter((id) => isProductInStock(productsById!.get(id))).length
            : componentIds.length,
        };
      });
      if (!cancelled) setStock(result);
    })().catch(() => { /* promo UI falls back to showing the offer */ });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return stock;
};
