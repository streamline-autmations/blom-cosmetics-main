// Fix order BL-MIJ9P3QJ invoice generation
// Uses the correct Netlify function URL and proper order data

const orderData = {
    m_payment_id: "BL-19ACBFB542B",
    order_number: "BL-MIJ9P3QJ",
    status: "paid",
    payment_status: "paid",
    buyer_email: "ezannenel5@gmail.com",
    buyer_name: "Ezanne Brink",
    site_url: "https://blom-cosmetics.co.za",
    total: 2335,
    currency: "ZAR"
};

console.log("🚀 Starting invoice generation for order BL-MIJ9P3QJ");
console.log("Order details:", JSON.stringify(orderData, null, 2));

// Use the correct Netlify function URL
const netlifyBaseUrl = "https://blom-cosmetics.co.za/.netlify/functions";

async function generateInvoiceForOrder() {
    try {
        console.log("\n📧 Step 1: Calling order-status function...");
        
        // Call order-status function to mark order as paid and trigger invoice generation
        const orderStatusResponse = await fetch(`${netlifyBaseUrl}/order-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        console.log(`Order-status response: ${orderStatusResponse.status}`);
        const orderStatusResult = await orderStatusResponse.json();
        console.log("Order-status result:", orderStatusResult);

        if (!orderStatusResponse.ok) {
            console.log("⚠️ Order-status call failed, trying direct invoice generation...");
            
            console.log("\n📄 Step 2: Direct invoice generation...");
            
            // Fallback: Call invoice-pdf function directly
            const invoiceResponse = await fetch(`${netlifyBaseUrl}/invoice-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    m_payment_id: orderData.m_payment_id,
                    site_url: orderData.site_url
                })
            });

            console.log(`Invoice generation response: ${invoiceResponse.status}`);
            
            if (invoiceResponse.ok) {
                const contentType = invoiceResponse.headers.get('content-type');
                console.log(`Content-Type: ${contentType}`);
                
                if (contentType && contentType.includes('application/pdf')) {
                    console.log("✅ SUCCESS: Invoice PDF generated!");
                    
                    // Get filename from headers
                    const contentDisposition = invoiceResponse.headers.get('content-disposition');
                    if (contentDisposition) {
                        const filename = contentDisposition.match(/filename="([^"]+)"/);
                        if (filename) {
                            console.log(`📄 Invoice filename: ${filename[1]}`);
                        }
                    }
                    
                    console.log("🎉 Invoice has been generated and uploaded to Supabase Storage!");
                    console.log("💡 The invoice URL should now be available in the order record.");
                }
            } else {
                const errorText = await invoiceResponse.text();
                console.log(`❌ Invoice generation failed: ${invoiceResponse.status} - ${errorText}`);
            }
        } else {
            console.log("✅ Order-status function completed successfully!");
            
            if (orderStatusResult.invoice_generated) {
                console.log("🎉 SUCCESS: Invoice has been generated for order BL-MIJ9P3QJ!");
            } else {
                console.log("⚠️ Order marked as paid, but invoice generation may have failed");
                console.log("💡 You can manually trigger invoice generation by visiting:");
                console.log(`   ${netlifyBaseUrl}/invoice-pdf?m_payment_id=${orderData.m_payment_id}`);
            }
        }

    } catch (error) {
        console.error("❌ Error during invoice generation:", error.message);
        console.log("\n💡 MANUAL WORKAROUND:");
        console.log("If this automated approach fails, you can manually generate the invoice by:");
        console.log(`1. Visiting: ${netlifyBaseUrl}/invoice-pdf?m_payment_id=${orderData.m_payment_id}`);
        console.log("2. Or by calling the function directly from the Netlify dashboard");
    }
}

// Execute the invoice generation
generateInvoiceForOrder()
    .then(() => {
        console.log("\n✨ Process completed! Check your order record for the invoice URL.");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Process failed:", error.message);
        process.exit(1);
    });