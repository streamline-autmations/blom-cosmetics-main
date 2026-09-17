import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function getInvoiceUrl() {
    console.log('🔍 Checking for invoice URL in order BL-MIJ9P3QJ...');
    
    try {
        // Get order by m_payment_id or order_number
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .or('order_number.eq.BL-MIJ9P3QJ,m_payment_id.eq.BL-19ACBFB542B')
            .single();
            
        if (orderError) {
            console.log('❌ Error finding order:', orderError.message);
            return;
        }
        
        console.log('\n📋 ORDER DETAILS:');
        console.log('==================');
        console.log(`Order ID: ${order.id}`);
        console.log(`Order Number: ${order.order_number}`);
        console.log(`Payment ID: ${order.m_payment_id}`);
        console.log(`Status: ${order.status}`);
        console.log(`Payment Status: ${order.payment_status}`);
        console.log(`Buyer: ${order.buyer_name} (${order.buyer_email})`);
        console.log(`Total: R${order.total}`);
        
        // Check for invoice URL in metadata or additional fields
        if (order.invoice_url) {
            console.log(`\n📄 EXISTING INVOICE URL: ${order.invoice_url}`);
        } else if (order.metadata && order.metadata.invoice_url) {
            console.log(`\n📄 INVOICE URL (from metadata): ${order.metadata.invoice_url}`);
        } else {
            console.log('\n❌ No invoice URL found in database');
            console.log('💡 Invoice can be generated at:');
            console.log(`   https://blom-cosmetics.co.za/.netlify/functions/invoice-pdf?m_payment_id=${order.m_payment_id}`);
        }
        
        // Get order items to confirm the Colour Acrylics - 062 fix
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('product_name, sku, unit_price, quantity')
            .eq('order_id', order.id);
            
        if (!itemsError && items) {
            console.log('\n🛍️ ORDER ITEMS:');
            console.log('================');
            const acrylicsItem = items.find(item => item.product_name.includes('Colour Acrylics'));
            if (acrylicsItem) {
                console.log(`✅ Colour Acrylics: ${acrylicsItem.product_name} (${acrylicsItem.sku}) - R${acrylicsItem.unit_price}`);
            }
            items.forEach(item => {
                console.log(`• ${item.product_name} (${item.sku}) - R${item.unit_price} x ${item.quantity}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Execute
getInvoiceUrl();