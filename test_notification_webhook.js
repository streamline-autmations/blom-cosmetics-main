#!/usr/bin/env node

/**
 * Test Webhook for Order BL-MIJ9P3QJ (BL-19ACBFB542B)
 * This sends the webhook payload to test the notification workflow
 */

const WEBHOOK_URL = 'https://cute-stroopwafel-203cac.netlify.app/.netlify/functions/new-order-alert';

// The exact payload for order BL-MIJ9P3QJ
const webhookPayload = {
  body: {
    order_number: "BL-MIJ9P3QJ",
    m_payment_id: "BL-19ACBFB542B",
    status: "paid",
    payment_status: "paid", 
    total: "2335.00",
    currency: "ZAR",
    buyer_email: "ezannenel5@gmail.com",
    buyer_name: "Ezanne Brink",
    buyer_phone: "0732526092",
    amount_paid: "2335.00",
    payment_date: "2025-11-29 15:49:00"
  },
  executionMode: "production",
  webhookUrl: WEBHOOK_URL
};

async function testWebhook() {
  console.log('🚀 Testing webhook for order BL-MIJ9P3QJ (BL-19ACBFB542B)');
  console.log('Customer: Ezanne Brink (ezannenel5@gmail.com)');
  console.log('Amount: R2335.00');
  console.log('');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    const responseText = await response.text();
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📋 Response Body: ${responseText || '(empty)'}`);
    console.log('');

    if (response.ok) {
      console.log('✅ SUCCESS! Webhook processed successfully');
      console.log('');
      console.log('🎉 What should happen:');
      console.log('1. ✅ WhatsApp notification sent to Ezanne Brink');
      console.log('2. ✅ Email receipt sent to ezannenel5@gmail.com');
      console.log('3. ✅ Invoice generated');
      console.log('4. ✅ Order confirmation workflow triggered');
    } else {
      console.log('❌ Webhook failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (typeof fetch === 'undefined') {
  console.log('❌ node-fetch not available');
  console.log('💡 Use curl instead:');
  console.log('');
  console.log(`curl -X POST "${WEBHOOK_URL}" \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'' + JSON.stringify(webhookPayload) + '\'');
} else {
  testWebhook();
}