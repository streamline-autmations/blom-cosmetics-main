#!/usr/bin/env node

/**
 * Quick PayFast Webhook Test for Order BL-19ACBFB542B
 * This will test the webhook with your real order
 */

const crypto = require('crypto');

// Configuration
const WEBHOOK_URL = 'https://blom-cosmetics.co.za/.netlify/functions/payfast-itn';
const MERCHANT_ID = '10000100';
const MERCHANT_KEY = '46f0cd694581a';

// Your order details
const ORDER_ID = 'BL-19ACBFB542B';
const AMOUNT = '2335.00';

function encPF(v) {
  return encodeURIComponent(String(v ?? ''))
    .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, '+');
}

function generateSignature(fields) {
  const signatureOrder = [
    'merchant_id', 'merchant_key', 'return_url', 'cancel_url',
    'notify_url', 'name_first', 'name_last', 'email_address',
    'm_payment_id', 'amount', 'item_name', 'custom_str1'
  ];

  const parts = [];
  for (const key of signatureOrder) {
    const val = fields[key];
    if (val !== undefined && val !== null && String(val) !== '') {
      parts.push(`${key}=${encPF(val)}`);
    }
  }

  let baseString = parts.join('&');
  return crypto.createHash('md5').update(baseString).digest('hex');
}

async function testWebhook() {
  console.log('🚀 Testing PayFast Webhook for Order:', ORDER_ID);
  console.log('Amount: R' + AMOUNT);
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('');

  // Build ITN data
  const itnData = {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url: 'https://blom-cosmetics.co.za/checkout/status',
    cancel_url: 'https://blom-cosmetics.co.za/checkout/cancel',
    notify_url: 'https://blom-cosmetics.co.za/.netlify/functions/payfast-itn',
    name_first: 'Test',
    name_last: 'Customer',
    email_address: 'test@example.com',
    m_payment_id: ORDER_ID,
    amount: AMOUNT,
    item_name: 'Test Order ' + ORDER_ID,
    custom_str1: ORDER_ID,
    payment_status: 'COMPLETE',
    pnl: 'TEST12345',
    pf_payment_id: '7890'
  };

  // Generate signature
  const signature = generateSignature(itnData);
  itnData.signature = signature;

  console.log('Generated signature:', signature);
  console.log('');

  try {
    // Check if node-fetch is available
    let fetch;
    try {
      fetch = require('node-fetch');
    } catch (e) {
      console.log('❌ node-fetch not found. Installing...');
      console.log('Please run: npm install node-fetch');
      console.log('');
      console.log('💡 Alternative: Use this curl command instead:');
      console.log('');
      console.log('curl -X POST "' + WEBHOOK_URL + '" \\');
      console.log('  -H "Content-Type: application/x-www-form-urlencoded" \\');
      console.log('  -d "' + new URLSearchParams(itnData).toString() + '"');
      return;
    }

    // Send request
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(itnData)) {
      formData.append(key, value);
    }

    console.log('📡 Sending webhook request...');
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const responseText = await response.text();
    
    console.log('');
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Body:', responseText || '(empty - successful)');
    console.log('');

    if (response.ok) {
      console.log('✅ SUCCESS! Webhook processed successfully');
      console.log('');
      console.log('🔍 What should happen next:');
      console.log('1. ✅ Order BL-19ACBFB542B should change from "pending" to "paid"');
      console.log('2. ✅ Order confirmation workflow should trigger');
      console.log('3. ✅ Invoice should be generated');
      console.log('4. ✅ N8N webhook should receive notification');
      console.log('');
      console.log('📋 To verify:');
      console.log('- Check your Netlify function logs for debug messages');
      console.log('- Verify order status in your database');
      console.log('- Check if customer receives confirmation');
    } else {
      console.log('❌ FAILED: Webhook returned error');
      console.log('Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('💡 If you get certificate errors, try:');
    console.log('1. Use the curl command shown above');
    console.log('2. Or try from a different network/machine');
  }
}

// Check dependencies
try {
  require('node-fetch');
  testWebhook();
} catch (e) {
  console.log('⚠️ node-fetch not installed');
  console.log('');
  console.log('Install with: npm install node-fetch');
  console.log('Then run: node quick_webhook_test.js');
  console.log('');
  console.log('💡 Or use this curl command directly:');
  const itnData = {
    merchant_id: '10000100',
    merchant_key: '46f0cd694581a',
    return_url: 'https://blom-cosmetics.co.za/checkout/status',
    cancel_url: 'https://blom-cosmetics.co.za/checkout/cancel',
    notify_url: 'https://blom-cosmetics.co.za/.netlify/functions/payfast-itn',
    name_first: 'Test',
    name_last: 'Customer',
    email_address: 'test@example.com',
    m_payment_id: 'BL-19ACBFB542B',
    amount: '2335.00',
    item_name: 'Test Order BL-19ACBFB542B',
    custom_str1: 'BL-19ACBFB542B',
    payment_status: 'COMPLETE',
    signature: 'd32942cf2f0abd86f80ec82fe12060fb'
  };
  console.log('');
  console.log('curl -X POST "https://blom-cosmetics.co.za/.netlify/functions/payfast-itn" \\');
  console.log('  -H "Content-Type: application/x-www-form-urlencoded" \\');
  console.log('  -d "' + new URLSearchParams(itnData).toString() + '"');
}