// =============================================================================
// PAYFAST ITN TEST SCRIPT FOR ORDER BL-MIHIANYT
// This script sends a test ITN webhook to mark the order as paid
// =============================================================================

const https = require('https');

// PayFast ITN webhook endpoint
const webhookUrl = 'https://cute-stroopwafel-203cac.netlify.app/.netlify/functions/payfast-itn';

// Form data that simulates a PayFast ITN notification
const formData = {
    merchant_id: '10000100',
    merchant_key: '46f0cd694581a',
    payment_status: 'COMPLETE', // This MUST be COMPLETE (uppercase)
    item_name: 'Order BL-MIHIANYT',
    item_description: 'Payment for order BL-MIHIANYT',
    custom_str1: 'BL-MIHIANYT',
    name_first: 'annamarie',
    name_last: 'ernst',
    email_address: 'ernstannamarie18@gmail.com',
    m_payment_id: 'BL-19AC5A26DD5', // Critical field to identify the order
    amount: '290.00', // Must match the order total exactly
    signature: 'e2b04e0c7ab2360ec2b7ba60d4b9e6e9' // Test signature
};

// Convert form data to URL encoded string
function buildFormData(data) {
    return Object.entries(data)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
}

const postData = buildFormData(formData);

// HTTP request options
const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('🚀 Sending PayFast ITN webhook test...');
console.log('📋 Order Details:');
console.log(`   Order ID: c7c88c8d-a961-4692-9ae7-fbfacf151e88`);
console.log(`   Order Number: BL-MIHIANYT`);
console.log(`   PayFast Payment ID: BL-19AC5A26DD5`);
console.log(`   Amount: R290.00`);
console.log(`   Customer: annamarie ernst (ernstannamarie18@gmail.com)`);
console.log('');
console.log('📤 Sending webhook to:', webhookUrl);
console.log('');

// Make the HTTP request
const req = https.request(webhookUrl, options, (res) => {
    let responseData = '';
    
    console.log(`📊 Response Status: ${res.statusCode} ${res.statusMessage}`);
    console.log('📋 Response Headers:', res.headers);
    console.log('');

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('📥 Response Body:', responseData || '(empty - this is normal for ITN)');
        console.log('');

        if (res.statusCode === 200) {
            console.log('✅ SUCCESS: ITN webhook sent successfully!');
            console.log('🔍 Your order should now be marked as paid.');
            console.log('');
            console.log('🧪 To verify, run this SQL query:');
            console.log('   SELECT order_number, status, payment_status, paid_at');
            console.log('   FROM public.orders WHERE id = \'c7c88c8d-a961-4692-9ae7-fbfacf151e88\';');
        } else {
            console.log('❌ FAILED: ITN webhook failed.');
            console.log('🔍 Check the response above for error details.');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request Error:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting tips:');
    console.log('1. Check your internet connection');
    console.log('2. Verify the webhook URL is accessible');
    console.log('3. Check your firewall/network settings');
    console.log('4. Verify your environment variables are set correctly');
});

req.write(postData);
req.end();

console.log('⏳ Waiting for response...');