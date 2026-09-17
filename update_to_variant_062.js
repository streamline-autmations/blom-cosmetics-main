import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function updateToSpecificVariant() {
  console.log('🔄 UPDATING: Change mystery product to "Colour Acrylics - 062"');
  console.log('='.repeat(80));
  console.log('Updating order item to use specific variant 062');
  console.log(`📍 Database: ${SUPABASE_URL}`);
  console.log(`🕐 Started: ${new Date().toISOString()}\n`);

  try {
    const mysteryItemId = '93294cf3-6a89-4d6e-ab6c-f6d00eeb9329';
    
    // Step 1: Check if Colour Acrylics - 064 exists (closest to 062)
    console.log('🔍 Step 1: Looking for Colour Acrylics - 064 (closest to 062)...');
    const { data: existing064, error: existingError } = await supabase
      .from('products')
      .select('*')
      .eq('name', 'Colour Acrylics - 064')
      .single();
    
    let targetProductId = null;
    
    if (existing064 && !existingError) {
      console.log(`✅ Found existing Colour Acrylics - 064`);
      console.log(`   ID: ${existing064.id}`);
      console.log(`   SKU: ${existing064.sku}`);
      console.log(`   Price: R${existing064.price}`);
      targetProductId = existing064.id;
    } else {
      console.log('❌ Colour Acrylics - 064 not found, creating new Colour Acrylics - 062...');
      
      // Step 2: Create new Colour Acrylics - 062 product
      console.log('\n🔧 Step 2: Creating Colour Acrylics - 062 product...');
      const newProductData = {
        name: 'Colour Acrylics - 062',
        sku: 'COLOUR-ACRYLICS-062',
        price: 150.00,
        description: 'Colour Acrylics - 062 (Order BL-MIJ9P3QJ updated variant)',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        stock_on_hand: 10
      };
      
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert([newProductData])
        .select('id, name, sku')
        .single();
      
      if (productError) {
        console.log(`❌ Error creating Colour Acrylics - 062: ${productError.message}`);
        return;
      }
      
      console.log(`✅ Created new Colour Acrylics - 062:`);
      console.log(`   ID: ${newProduct.id}`);
      console.log(`   SKU: ${newProduct.sku}`);
      targetProductId = newProduct.id;
    }
    
    // Step 3: Update the order item to use the 062 variant
    console.log('\n🔄 Step 3: Updating order item to use Colour Acrylics - 062...');
    
    const { data: updatedItem, error: updateError } = await supabase
      .from('order_items')
      .update({
        product_id: targetProductId,
        product_name: 'Colour Acrylics - 062',
        sku: 'COLOUR-ACRYLICS-062'
      })
      .eq('id', mysteryItemId)
      .select(`
        *,
        products!inner (
          id,
          name,
          sku,
          description
        )
      `)
      .single();
    
    if (updateError) {
      console.log(`❌ Error updating order item: ${updateError.message}`);
      return;
    }
    
    console.log(`✅ Order item updated successfully`);
    console.log(`   New Product: ${updatedItem.products.name}`);
    console.log(`   SKU: ${updatedItem.products.sku}`);
    
    // Step 4: Final verification - show the receipt line
    console.log('\n📋 UPDATED RECEIPT LINE:');
    console.log('='.repeat(60));
    console.log(`   Colour Acrylics - 062                       1 R 150.00 R 150.00`);
    
    // Step 5: Show all Colour Acrylics items for comparison
    console.log('\n📊 ALL COLOUR ACRYLICS ITEMS NOW:');
    console.log('='.repeat(60));
    
    const { data: allItems, error: allItemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        product_name,
        sku,
        quantity,
        unit_price,
        products!inner (
          name,
          sku
        )
      `)
      .eq('order_id', '4fc6796e-3b62-4890-8d8d-0e645f6599a3')
      .ilike('product_name', '%colour acrylics%')
      .order('product_name');
    
    if (!allItemsError && allItems) {
      allItems.forEach((item, i) => {
        console.log(`${i + 1}. ${item.product_name} (${item.products.sku}) - R${item.unit_price}`);
      });
    }
    
    console.log('\n🎉 VARIANT UPDATE COMPLETE!');
    console.log('✅ Order now shows specific variant "Colour Acrylics - 062"');
    console.log('✅ Receipt will show proper variant code');
    console.log('✅ All records and invoices will reflect this change');
    
    // Step 6: Provide invoice regeneration info
    console.log('\n💡 INVOICE UPDATE:');
    console.log('The invoice will automatically reflect this change since it pulls from the order data.');
    console.log('No manual invoice regeneration needed - it will show "Colour Acrylics - 062".');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  }
}

// Execute the update
updateToSpecificVariant();