// Simulate PayFast ITN webhook for order BL-MIJ9P3QJ
// This is the normal workflow that should trigger invoice generation

const orderData = {
    m_payment_id: "BL-19ACBFB542B",
    status: "paid",
    payment_status: "paid",
    buyer_email: "ezannenel5@gmail.com",
    buyer_name: "Ezanne Brink",
    site_url: "https://blom-cosmetics.co.za",
    total: 2335,
    currency: "ZAR"
};

console.log("🚀 Simulating PayFast ITN webhook for order BL-MIJ9P3QJ");
console.log("Payload:", JSON.stringify(orderData, null, 2));

// Call the order-status function (which should trigger invoice generation)
async function simulatePayFastITN() {
    try {
        console.log("\n📡 Calling order-status function...");
        
        const response = await fetch('/.netlify/functions/order-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();
        
        console.log("\n📋 Order-status response:");
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${result.success}`);
        console.log(`   Invoice Generated: ${result.invoice_generated}`);
        console.log(`   Webhook Called: ${result.webhook_called}`);
        console.log(`   Webhook Success: ${result.webhook_success}`);

        if (result.invoice_generated) {
            console.log("\n🎉 SUCCESS! Invoice has been generated for order BL-MIJ9P3QJ");
        } else {
            console.log("\n⚠️ Invoice generation may have failed");
        }

        return result;

    } catch (error) {
        console.error("❌ Error calling order-status function:", error.message);
        throw error;
    }
}

// If this script fails due to environment issues, try direct invoice generation
async function fallbackInvoiceGeneration() {
    console.log("\n🔄 Trying direct invoice generation as fallback...");
    
    try {
        const response = await fetch('/.netlify/functions/invoice-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                m_payment_id: orderData.m_payment_id,
                site_url: orderData.site_url
            })
        });

        console.log(`Invoice generation response status: ${response.status}`);
        
        if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/pdf')) {
                console.log("✅ Invoice PDF generated successfully!");
                
                // Extract filename from response headers
                const contentDisposition = response.headers.get('content-disposition');
                if (contentDisposition) {
                    const filename = contentDisposition.match(/filename="([^"]+)"/);
                    if (filename) {
                        console.log(`📄 Invoice filename: ${filename[1]}`);
                    }
                }
            } else {
                console.log("📄 Invoice response received (check content type)");
            }
        } else {
            const errorText = await response.text();
            console.log(`❌ Invoice generation failed: ${response.status} - ${errorText}`);
        }

    } catch (error) {
        console.error("❌ Fallback invoice generation failed:", error.message);
    }
}

// Main execution
async function main() {
    try {
        await simulatePayFastITN();
    } catch (error) {
        console.log("\n⚠️ Primary method failed, trying fallback...");
        await fallbackInvoiceGeneration();
    }
}

main().then(() => {
    console.log("\n✨ Process completed!");
}).catch((error) => {
    console.error("\n❌ Process failed:", error.message);
});