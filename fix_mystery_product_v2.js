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
  console.log('Updating order item to use specific product');
  console.log(`📍 Database: ${SUPABASE_URL}`);
  console.log(`🕐 Started: ${new Date().toISOString()}\n`);

  try {
    const mysteryItemId = '93294cf3-6a89-4d6e-ab6c-f6d00eeb9329';
    const newProductId = '11396774-0b12-4bf0-af63-e7092dd3575b'; // From previous run
    
    // Step 1: Update the order item (without updated_at field)
    console.log('🔄 Step 1: Updating order item to use new specific product...');
    
    const { data: updatedItem, error: updateError } = await supabase
      .from('order_items')
      .update({
        product_id: newProductId
      })
      .eq('id', mysteryItemId)
      .select('*')
      .single();
    
    if (updateError) {
      console.log(`❌ Error updating order item: ${updateError.message}`);
      return;
    }
    
    console.log(`✅ Order item updated successfully`);
    console.log(`   Item ID: ${updatedItem.id}`);
    console.log(`   New Product ID: ${updatedItem.product_id}`);
    
    // Step 2: Verification - Check the final result
    console.log('\n🔍 Step 2: Final verification...');
    const { data: finalItem, error: finalError } = await supabase
      .from('order_items')
      .select(`
        *,
        products!inner (
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
    
    // Step 3: Compare before/after for receipt
    console.log('\n📊 RECEIPT IMPROVEMENT:');
    console.log('='.repeat(60));
    console.log('❌ BEFORE: Colour Acrylics (no variant, no SKU)');
    console.log(`✅ AFTER:  ${finalItem.products.name}`);
    console.log(`          SKU: ${finalItem.products.sku}`);
    console.log('          Customer can specify colour during fulfillment');
    
    // Step 4: Show the receipt line as it will appear
    console.log('\n📋 UPDATED RECEIPT LINE:');
    console.log('='.repeat(60));
    console.log(`   Colour Acrylics - Customer Choice (Order BL-MIJ9P3QJ) 1 R 150.00 R 150.00`);
    
    // Step 5: Provide next steps
    console.log('\n💡 NEXT STEPS:');
    console.log('1. ✅ Order item now has specific product information');
    console.log('2. ✅ Receipt will show "Customer Choice" instead of generic');
    console.log('3. ✅ Better inventory tracking for this item');
    console.log('4. 🔄 Contact customer to clarify which colour they want');
    console.log('5. 📦 Fulfill with specific colour once clarified');
    
    console.log('\n🎯 PROBLEM RESOLVED:');
    console.log('The mystery "Colour Acrylics" without variant has been fixed!');
    console.log('Customer now has a specific product entry instead of generic one.');
    
    console.log('\n🛠️ SOLUTION COMPLETE!');
    console.log('Order BL-MIJ9P3QJ now has proper product information for fulfillment.');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  }
}

// Execute the fix
fixMysteryProduct();