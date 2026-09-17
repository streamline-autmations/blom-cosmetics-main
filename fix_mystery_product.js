import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fixMysteryProduct() {
  console.log('🛠️ FIXING: Mystery "Colour Acrylics" without variant');
  console.log('='.repeat(80));
  console.log('Creating a specific product to replace the generic one');
  console.log(`📍 Database: ${SUPABASE_URL}`);
  console.log(`🕐 Started: ${new Date().toISOString()}\n`);

  try {
    const mysteryItemId = '93294cf3-6a89-4d6e-ab6c-f6d00eeb9329';
    
    // Step 1: Get the current mystery item
    console.log('🔍 Step 1: Getting current mystery item...');
    const { data: currentItem, error: currentError } = await supabase
      .from('order_items')
      .select('*')
      .eq('id', mysteryItemId)
      .single();
    
    if (currentError) {
      console.log(`❌ Error getting current item: ${currentError.message}`);
      return;
    }
    
    console.log(`✅ Current item details:`);
    console.log(`   Product Name: ${currentItem.product_name}`);
    console.log(`   Unit Price: R${currentItem.unit_price}`);
    console.log(`   Current Product ID: ${currentItem.product_id}`);
    
    // Step 2: Create a specific product for this order
    console.log('\n🔧 Step 2: Creating specific product...');
    
    const specificProductData = {
      name: `Colour Acrylics - Customer Choice (Order ${currentItem.order_number || 'BL-MIJ9P3QJ'})`,
      sku: `CUSTOM-CHOICE-${Date.now().toString().slice(-6)}`,
      price: currentItem.unit_price,
      description: `Colour Acrylics selected by customer for order ${currentItem.order_number || 'BL-MIJ9P3QJ'}. Generic "Colour Acrylics" selection - customer can specify desired colour during fulfillment.`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stock_on_hand: 10
    };
    
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert([specificProductData])
      .select('id, name, sku')
      .single();
    
    if (productError) {
      console.log(`❌ Error creating new product: ${productError.message}`);
      return;
    }
    
    console.log(`✅ Created new specific product:`);
    console.log(`   ID: ${newProduct.id}`);
    console.log(`   Name: ${newProduct.name}`);
    console.log(`   SKU: ${newProduct.sku}`);
    
    // Step 3: Update the order item
    console.log('\n🔄 Step 3: Updating order item...');
    
    const { data: updatedItem, error: updateError } = await supabase
      .from('order_items')
      .update({
        product_id: newProduct.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', mysteryItemId)
      .select('*')
      .single();
    
    if (updateError) {
      console.log(`❌ Error updating order item: ${updateError.message}`);
      return;
    }
    
    console.log(`✅ Order item updated successfully`);
    console.log(`   New Product ID: ${updatedItem.product_id}`);
    
    // Step 4: Verification - Check the final result
    console.log('\n🔍 Step 4: Final verification...');
    const { data: finalItem, error: finalError } = await supabase
      .from('order_items')
      .select(`
        *,
        products (
          id,
          name,
          sku,
          description
        )
      `)
      .eq('id', mysteryItemId)
      .single();
    
    if (finalError) {
      console.log(`❌ Final verification error: ${finalError.message}`);
    } else {
      console.log('🎉 FINAL RESULT:');
      console.log(`   Order Item ID: ${finalItem.id}`);
      console.log(`   Product Name: ${finalItem.products.name}`);
      console.log(`   SKU: ${finalItem.products.sku}`);
      console.log(`   Description: ${finalItem.products.description || 'None'}`);
    }
    
    // Step 5: Compare before/after for receipt
    console.log('\n📊 RECEIPT IMPROVEMENT:');
    console.log('='.repeat(60));
    console.log('❌ BEFORE: Colour Acrylics (no variant, no SKU)');
    console.log(`✅ AFTER:  ${finalItem.products.name}`);
    console.log(`          SKU: ${finalItem.products.sku}`);
    console.log('          Customer can specify colour during fulfillment');
    
    // Step 6: Provide next steps
    console.log('\n💡 NEXT STEPS:');
    console.log('1. ✅ Order item now has specific product information');
    console.log('2. ✅ Receipt will show "Customer Choice" instead of generic');
    console.log('3. ✅ Better inventory tracking for this item');
    console.log('4. 🔄 Contact customer to clarify which colour they want');
    console.log('5. 📦 Fulfill with specific colour once clarified');
    
    console.log('\n🎯 RECEIPT ANALYSIS:');
    console.log('The mystery "Colour Acrylics" was likely caused by:');
    console.log('- Customer selecting generic option instead of specific variant');
    console.log('- Our fixing process mapped to existing generic product');
    console.log('- Now resolved with specific product for this order');
    
    console.log('\n🛠️ SOLUTION COMPLETE!');
    console.log('The order item now has proper product information for fulfillment.');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  }
}

// Execute the fix
fixMysteryProduct();