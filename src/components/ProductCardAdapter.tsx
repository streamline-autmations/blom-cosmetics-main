// src/components/ProductCardAdapter.tsx
import React from 'react';
import { ProductCard } from './ProductCard';
import { Product } from '../lib/products';

interface ProductCardAdapterProps {
  product: Product;
}

export function ProductCardAdapter({ product }: ProductCardAdapterProps) {
  return (
    <ProductCard
      id={product.id}
      name={product.name}
      slug={product.slug}
      price={product.price}
      compareAtPrice={product.compareAtPrice}
      badges={product.badges}
      images={product.images}
      shortDescription={product.shortDescription}
      variants={product.variants}
      inStock={product.inStock}
      hoverShine={true}
      className="border border-gray-200 hover:-translate-y-3"
    />
  );
}