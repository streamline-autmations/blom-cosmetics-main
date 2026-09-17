import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function investigateMysteryProduct() {
  console.log('🔍 INVESTIGATING: Mystery "Colour Acrylics" without variant');
  console.log('='.repeat(80));
  console.log(`📍 Database: ${SUPABASE_URL}`);
  console.log(`🕐 Started: ${new Date().toISOString()}\n`);

  try {
    const orderId = '4fc6796e-3b62-4890-8d8d-0e645f6599a3';
    
    // Step 1: Find the mystery "Colour Acrylics" item
    console.log('🔍 Step 1: Finding the mystery "Colour Acrylics" item...');
    const { data: mysteryItems, error: mysteryError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .eq('product_name', 'Colour Acrylics')
      .limit(1);
    
    if (mysteryError) {
      console.log(`❌ Error finding mystery item: ${mysteryError.message}`);
      return;
    }
    
    if (!mysteryItems || mysteryItems.length === 0) {
      console.log('❌ No mystery "Colour Acrylics" item found');
      return;
    }
    
    const mysteryItem = mysteryItems[0];
    console.log(`✅ Found mystery item:`);
    console.log(`   ID: ${mysteryItem.id}`);
    console.log(`   Product Name: ${mysteryItem.product_name}`);
    console.log(`   SKU: ${mysteryItem.sku || 'NULL'}`);
    console.log(`   Product ID: ${mysteryItem.product_id}`);
    console.log(`   Unit Price: R${mysteryItem.unit_price}`);
    
    // Step 2: Check what product this was mapped to
    console.log('\n🔍 Step 2: Checking mapped product details...');
    const { data: mappedProduct, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', mysteryItem.product_id)
      .single();
    
    if (productError) {
      console.log(`❌ Error getting mapped product: ${productError.message}`);
      return;
    }
    
    console.log(`✅ Mapped product details:`);
    console.log(`   Name: ${mappedProduct.name}`);
    console.log(`   SKU: ${mappedProduct.sku}`);
    console.log(`   Description: ${mappedProduct.description || 'NULL'}`);
    console.log(`   Has Variants: Checking...`);
    
    // Step 3: Check if this product has variants
    console.log('\n🔍 Step 3: Checking for product variants...');
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', mappedProduct.id);
    
    if (variantsError) {
      console.log(`❌ Error checking variants: ${variantsError.message}`);
    } else if (variants && variants.length > 0) {
      console.log(`✅ Product has ${variants.length} variants:`);
      variants.forEach((variant, i) => {
        console.log(`   ${i + 1}. ${variant.title} (${variant.sku}) - R${variant.price}`);
      });
      
      // Suggest the first variant as a fix
      console.log('\n💡 SUGGESTED FIX:');
      console.log(`   Map this order item to variant: "${variants[0].title}" (${variants[0].sku})`);
      console.log(`   This will give the customer a specific colour instead of generic "Colour Acrylics"`);
      
    } else {
      console.log('❌ Product has NO variants - this is the problem!');
      console.log('   The original order probably intended a specific colour variant');
      console.log('   But the generic "Colour Acrylics" product was created/used instead');
    }
    
    // Step 4: Find all Colour Acrylics products for comparison
    console.log('\n🔍 Step 4: Finding all Colour Acrylics products...');
    const { data: allColourProducts, error: allProductsError } = await supabase
      .from('products')
      .select('id, name, sku, description, price')
      .ilike('name', '%colour acrylics%')
      .order('name');
    
    if (allProductsError) {
      console.log(`❌ Error finding all products: ${allProductsError.message}`);
    } else if (allColourProducts) {
      console.log(`✅ Found ${allColourProducts.length} Colour Acrylics products:`);
      allColourProducts.forEach((product, i) => {
        console.log(`   ${i + 1}. ${product.name} (${product.sku || 'NO SKU'}) - R${product.price}`);
      });
    }
    
    // Step 5: Analysis and recommendations
    console.log('\n🎯 ANALYSIS:');
    console.log('='.repeat(60));
    console.log('❌ PROBLEM IDENTIFIED:');
    console.log('   - Customer ordered a specific colour variant');
    console.log('   - But the order shows generic "Colour Acrylics"');
    console.log('   - This affects inventory tracking and customer expectations');
    
    console.log('\n💡 POSSIBLE CAUSES:');
    console.log('   1. Customer selected generic Colour Acrylics instead of specific variant');
    console.log('   2. Product creation/selection process had issues');
    console.log('   3. Data quality issue during order creation');
    console.log('   4. Our fix process mapped to wrong product');
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('   1. If product has variants → Map to specific variant');
    console.log('   2. If no variants exist → Create variants for this product');
    console.log('   3. Contact customer to clarify which colour they wanted');
    console.log('   4. Update order_item to reflect correct product');
    
    // Step 6: Offer to fix
    console.log('\n🛠️ READY TO FIX:');
    if (variants && variants.length > 0) {
      console.log(`   We can update the order to use variant: "${variants[0].title}"`);
      console.log('   This will show the specific colour on the receipt');
    } else {
      console.log('   Need to create proper variants for Colour Acrylics product');
      console.log('   Then map order item to specific variant');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  }
}

// Execute the investigation
investigateMysteryProduct();