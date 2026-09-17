// Test script to verify invoice generation and payload update
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yvmnedjybrpvlupygusf.supabase.co';
const SITE_URL = process.env.SITE_URL || 'https://cute-stroopwafel-203cac.netlify.app';

// Order ID to test
const TEST_ORDER_ID = 'c7c88c8d-a961-4692-9ae7-fbfacf151e88'; // BL-MIHIANYT
const M_PAYMENT_ID = 'BL-19AC5A26DD5';

async function getCurrentOrderStatus() {
  console.log('🔍 Checking current order status...');
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${TEST_ORDER_ID}&select=*`, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY || '',
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`
    }
  });
  
  const orders = await response.json();
  const order = orders[0];
  
  if (!order) {
    console.error('❌ Order not found!');
    return null;
  }
  
  console.log('📊 Current Order Status:');
  console.log('  - Order ID:', order.id);
  console.log('  - Order Number:', order.order_number);
  console.log('  - Status:', order.status);
  console.log('  - Payment Status:', order.payment_status);
  console.log('  - Invoice URL:', order.invoice_url || 'NOT GENERATED YET');
  console.log('  - Created At:', order.created_at);
  console.log('  - Paid At:', order.paid_at || 'NOT PAID YET');
  
  return order;
}

async function simulatePayFastITN() {
  console.log('\n🔄 Simulating PayFast ITN webhook...');
  
  // Create a test ITN payload
  const itnPayload = new URLSearchParams({
    merchant_id: '10000100',
    merchant_key: '46f0cd694581a',
    payment_status: 'COMPLETE',
    amount: '250.00',
    item_name: 'Test Order',
    m_payment_id: M_PAYMENT_ID,
    signature: 'test-signature',
    name_first: 'Test',
    name_last: 'Customer',
    email_address: 'test@example.com',
    cell_number: '1234567890'
  });
  
  try {
    const response = await fetch(`${SITE_URL}/.netlify/functions/payfast-itn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: itnPayload.toString()
    });
    
    console.log('📡 ITN Response Status:', response.status);
    const responseText = await response.text();
    console.log('📡 ITN Response:', responseText);
    
    return response.ok;
  } catch (error) {
    console.error('❌ ITN call failed:', error.message);
    return false;
  }
}

async function checkInvoiceGeneration() {
  console.log('\n🎯 Checking invoice generation...');
  
  // Wait a bit for the async processes to complete
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${TEST_ORDER_ID}&select=invoice_url,status,payment_status,paid_at`, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY || '',
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`
    }
  });
  
  const orders = await response.json();
  const order = orders[0];
  
  console.log('✅ Updated Order Status:');
  console.log('  - Status:', order.status);
  console.log('  - Payment Status:', order.payment_status);
  console.log('  - Paid At:', order.paid_at);
  console.log('  - Invoice URL:', order.invoice_url || 'STILL NOT GENERATED');
  
  return order.invoice_url;
}

async function testNewOrderAlert() {
  console.log('\n📢 Testing new order alert payload...');
  
  try {
    const response = await fetch(`${SITE_URL}/.netlify/functions/new-order-alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: TEST_ORDER_ID
      })
    });
    
    console.log('📡 Alert Response Status:', response.status);
    const alertResponse = await response.json();
    console.log('📡 Alert Response:', JSON.stringify(alertResponse, null, 2));
    
    if (response.ok) {
      console.log('✅ New order alert sent successfully');
      return true;
    } else {
      console.log('❌ New order alert failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Alert call failed:', error.message);
    return false;
  }
}

async function runFullTest() {
  console.log('🧪 TESTING INVOICE WORKFLOW AND PAYLOAD UPDATE\n');
  console.log('='.repeat(60));
  
  // Step 1: Check current status
  const initialOrder = await getCurrentOrderStatus();
  if (!initialOrder) {
    console.log('❌ Cannot proceed without valid order');
    return;
  }
  
  // Step 2: Simulate payment completion
  if (initialOrder.status !== 'paid') {
    console.log('\n💳 Order is not paid yet. Simulating payment...');
    const itnSuccess = await simulatePayFastITN();
    if (!itnSuccess) {
      console.log('❌ ITN simulation failed');
      return;
    }
  } else {
    console.log('\n✅ Order already marked as paid');
  }
  
  // Step 3: Check invoice generation
  const invoiceUrl = await checkInvoiceGeneration();
  
  // Step 4: Test new order alert payload
  const alertSuccess = await testNewOrderAlert();
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY:');
  console.log(`  - Order Status: ${initialOrder.status === 'paid' ? '✅ Already Paid' : '🔄 Now Paid'}`);
  console.log(`  - Invoice Generated: ${invoiceUrl ? '✅ YES' : '❌ NO'}`);
  if (invoiceUrl) {
    console.log(`  - Invoice URL: ${invoiceUrl}`);
  }
  console.log(`  - New Order Alert: ${alertSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log('='.repeat(60));
}

// Run the test
runFullTest().catch(console.error);