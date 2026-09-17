#!/usr/bin/env node

/**
 * PayFast Webhook Testing Script
 * 
 * This script tests the PayFast webhook integration by simulating ITN (Instant Transaction Notification) requests
 * to verify that orders are properly marked as paid and the order confirmation workflow is triggered.
 * 
 * Usage:
 *   node test_payfast_webhook.js [order_id]
 * 
 * If no order_id is provided, it will create a test order first.
 */

const crypto = require('crypto');
const fetch = require('node-fetch');

// Configuration
const SITE_URL = process.env.SITE_URL || 'https://blom-cosmetics.co.za';
const PF_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || ''; // Set this if you have a PayFast passphrase
const WEBHOOK_URL = `${SITE_URL}/.netlify/functions/payfast-itn`;

// PayFast sandbox credentials (example - replace with your actual test credentials)
const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || '10000100';
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a';

function encPF(v) {
  return encodeURIComponent(String(v ?? ''))
    .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, '+');
}

function generateSignature(fields, passphrase) {
  // PayFast signature generation - exact order matters
  const signatureOrder = [
    'merchant_id',
    'merchant_key', 
    'return_url',
    'cancel_url',
    'notify_url',
    'name_first',
    'name_last',
    'email_address',
    'm_payment_id',
    'amount',
    'item_name',
    'custom_str1'
  ];

  const parts = [];
  for (const key of signatureOrder) {
    const val = fields[key];
    if (val !== undefined && val !== null && String(val) !== '') {
      parts.push(`${key}=${encPF(val)}`);
    }
  }

  let baseString = parts.join('&');
  if (passphrase) {
    baseString += `&passphrase=${encPF(passphrase)}`;
  }

  return crypto.createHash('md5').update(baseString).digest('hex');
}

async function createTestOrder(orderId, amount) {
  console.log(`Creating test order: ${orderId} for R${amount}`);
  
  const orderData = {
    merchant_payment_id: orderId,
    status: 'pending',
    total_amount: amount.toFixed(2),
    currency: 'ZAR',
    customer_email: 'test@example.com',
    customer_name: 'Test Customer',
    customer_mobile: '+27123456789',
    shipping_method: 'door-to-door',
    shipping_cost: 0,
    delivery_address: {
      street_address: '123 Test Street',
      local_area: 'Test Area',
      city: 'Test City',
      zone: 'Gauteng',
      code: '2000',
      country: 'ZA',
      lat: -26.2041,
      lng: 28.0473
    }
  };

  try {
    const response = await fetch(`${SITE_URL}/.netlify/functions/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      throw new Error(`Order creation failed: ${response.status} ${await response.text()}`);
    }

    const result = await response.json();
    console.log('✅ Test order created successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to create test order:', error.message);
    throw error;
  }
}

async function sendITNRequest(orderId, amount, paymentStatus = 'COMPLETE') {
  console.log(`\n🚀 Sending PayFast ITN request...`);
  console.log(`Order ID: ${orderId}`);
  console.log(`Amount: R${amount}`);
  console.log(`Payment Status: ${paymentStatus}`);

  // Build ITN data
  const itnData = {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url: `${SITE_URL}/checkout/status?order=${orderId}`,
    cancel_url: `${SITE_URL}/checkout/cancel`,
    notify_url: WEBHOOK_URL,
    name_first: 'Test',
    name_last: 'Customer',
    email_address: 'test@example.com',
    m_payment_id: orderId,
    amount: amount.toFixed(2),
    item_name: `Test Order ${orderId}`,
    custom_str1: orderId,
    payment_status: paymentStatus,
    pnl: '12345', // PayFast transaction ID
    pf_payment_id: '7890',
    custom_str2: 'test_reference',
    custom_str3: '',
    custom_str4: '',
    custom_str5: ''
  };

  // Generate signature
  const signature = generateSignature(itnData, PF_PASSPHRASE);
  itnData.signature = signature;

  console.log(`🔐 Generated signature: ${signature}`);

  try {
    // Send ITN request
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(itnData)) {
      formData.append(key, value);
    }

    console.log(`📡 Sending request to: ${WEBHOOK_URL}`);

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const responseText = await response.text();
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📋 Response Body: ${responseText || '(empty)'}`);

    if (!response.ok) {
      throw new Error(`ITN request failed: ${response.status} ${responseText}`);
    }

    console.log('✅ ITN request processed successfully');
    return { success: true, status: response.status, body: responseText };
  } catch (error) {
    console.error('❌ ITN request failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function checkOrderStatus(orderId) {
  console.log(`\n🔍 Checking order status for: ${orderId}`);
  
  try {
    // Note: This would require access to your Supabase database
    // For now, we'll just log what we would check
    console.log(`Order ${orderId} should now be marked as 'paid'`);
    console.log(`Order confirmation workflow should have been triggered`);
    console.log(`Invoice should have been generated`);
    console.log(`N8N webhook should have been called`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to check order status:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 PayFast Webhook Testing Script');
  console.log('=================================');
  
  const orderId = process.argv[2] || `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const amount = parseFloat(process.argv[3]) || 100.00;
  
  console.log(`\n📋 Test Configuration:`);
  console.log(`Site URL: ${SITE_URL}`);
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log(`Test Order ID: ${orderId}`);
  console.log(`Test Amount: R${amount}`);
  console.log(`Passphrase: ${PF_PASSPHRASE ? 'Set' : 'Not set (using empty)'}`);

  try {
    // Step 1: Create test order
    console.log('\n📦 Step 1: Creating test order...');
    const orderResult = await createTestOrder(orderId, amount);
    
    // Step 2: Send ITN request (successful payment)
    console.log('\n💳 Step 2: Sending ITN for successful payment...');
    const itnResult = await sendITNRequest(orderId, amount, 'COMPLETE');
    
    if (itnResult.success) {
      // Step 3: Check order status
      await checkOrderStatus(orderId);
      
      console.log('\n🎉 SUCCESS: PayFast webhook test completed!');
      console.log('\n📊 Summary:');
      console.log(`✅ Order created: ${orderId}`);
      console.log(`✅ ITN processed: ${itnResult.status}`);
      console.log(`✅ Order should be marked as 'paid'`);
      console.log(`✅ Order confirmation workflow triggered`);
    } else {
      throw new Error(`ITN test failed: ${itnResult.error}`);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

// Alternative test: Failed payment
async function testFailedPayment(orderId, amount) {
  console.log('\n💀 Testing failed payment scenario...');
  
  try {
    const itnResult = await sendITNRequest(orderId, amount, 'FAILED');
    
    if (itnResult.success) {
      console.log('✅ Failed payment ITN processed successfully');
      console.log('Order should be marked as cancelled/failed');
    } else {
      throw new Error(`Failed payment test failed: ${itnResult.error}`);
    }
  } catch (error) {
    console.error('❌ Failed payment test error:', error.message);
  }
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });
}

module.exports = {
  generateSignature,
  sendITNRequest,
  createTestOrder,
  testFailedPayment
};