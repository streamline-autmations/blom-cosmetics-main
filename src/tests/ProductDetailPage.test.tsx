import { hasContent } from '../pages/ProductDetailPage';

describe('hasContent function', () => {
  test('returns false for null/undefined', () => {
    expect(hasContent(null)).toBe(false);
    expect(hasContent(undefined)).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(hasContent('')).toBe(false);
  });

  test('returns false for whitespace only', () => {
    expect(hasContent('   ')).toBe(false);
    expect(hasContent('\n\t')).toBe(false);
  });

  test('returns false for HTML tags only', () => {
    expect(hasContent('<p></p>')).toBe(false);
    expect(hasContent('<div><br></div>')).toBe(false);
  });

  test('returns true for meaningful content', () => {
    expect(hasContent('Hello World')).toBe(true);
    expect(hasContent('<p>Hello World</p>')).toBe(true);
    expect(hasContent('  Content with spaces  ')).toBe(true);
  });

  test('handles arrays correctly', () => {
    expect(hasContent([])).toBe(false);
    expect(hasContent([''])).toBe(false);
    expect(hasContent(['item1', 'item2'])).toBe(true);
  });
});

describe('Product Information Section Rendering', () => {
  const mockProduct = {
    overview: '<p>Product overview</p>',
    features: ['Feature 1', 'Feature 2'],
    howToUse: '<p>How to use instructions</p>',
    ingredients: { inci: '<p>Ingredients list</p>' },
    shippingInfo: '<p>Shipping information</p>'
  };

  test('shows product info section when content exists', () => {
    const showProductInfo = hasContent(mockProduct.overview) || 
                           hasContent(mockProduct.features) || 
                           hasContent(mockProduct.howToUse) || 
                           hasContent(mockProduct.ingredients?.inci) ||
                           hasContent(mockProduct.shippingInfo);
    expect(showProductInfo).toBe(true);
  });

  test('hides product info section when all fields are empty', () => {
    const emptyProduct = {
      overview: '',
      features: [],
      howToUse: null,
      ingredients: { inci: '' },
      shippingInfo: undefined
    };

    const showProductInfo = hasContent(emptyProduct.overview) || 
                           hasContent(emptyProduct.features) || 
                           hasContent(emptyProduct.howToUse) || 
                           hasContent(emptyProduct.ingredients?.inci) ||
                           hasContent(emptyProduct.shippingInfo);
    expect(showProductInfo).toBe(false);
  });
});