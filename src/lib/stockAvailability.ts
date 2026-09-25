// Single source of truth for "is this sellable right now?" — shared by the shop grid,
// product page, promo popups and create-order so a sold-out product can never be
// sold through a bundle that contains it.

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const getStockLevel = (item: any): number | null => {
  const values = [item?.stock_qty, item?.stock_on_hand, item?.inventory_quantity, item?.stock]
    .map(toNumber)
    .filter((v): v is number => v !== null);
  return values.length > 0 ? Math.max(...values) : null;
};

export const isProductInStock = (product: any): boolean => {
  if (!product) return false;
  const level = getStockLevel(product);
  return product.out_of_stock !== true &&
    product.is_active !== false &&
    !['archived', 'deleted', 'draft'].includes(String(product.status || '').toLowerCase()) &&
    (level === null || level > 0);
};

export const getBundleComponentIds = (bundle: any): string[] =>
  (Array.isArray(bundle?.bundle_products) ? bundle.bundle_products : [])
    .map((bp: any) => bp?.product_id)
    .filter(Boolean)
    .map(String);

/**
 * A bundle is sold out when its own stock is 0, OR when any product inside it is sold
 * out. Pass `productsById = null` when the product catalog couldn't be loaded — the
 * component rule is then skipped rather than marking every bundle sold out.
 */
export const isBundleInStock = (bundle: any, productsById: Map<string, any> | null): boolean => {
  if (!bundle || bundle.is_active === false) return false;
  const ownStock = toNumber(bundle.stock);
  if (ownStock !== null && ownStock <= 0) return false;
  if (!productsById) return true;
  return getBundleComponentIds(bundle).every((id) => isProductInStock(productsById.get(id)));
};
