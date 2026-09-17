// Fix order BL-MIJ9P3QJ by marking as paid and generating invoice
// This simulates what should happen when PayFast sends the ITN webhook

const orderData = {
    m_payment_id: "BL-19ACBFB542B",
    status: "paid",
    buyer_email: "ezannenel5@gmail.com",
    site_url: "https://blom-cosmetics.co.za"
};

console.log("🚀 Starting invoice fix for order BL-MIJ9P3QJ");
console.log("Order data:", JSON.stringify(orderData, null, 2));

// Simulate the order-status function call
async function markOrderAsPaid() {
    try {
        console.log("\n📋 Step 1: Marking order as paid...");
        
        // First, let's manually update the order in Supabase using the API
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !serviceKey) {
            throw new Error("Supabase credentials not found");
        }

        // Update order status
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.4fc6796e-3b62-4890-8d8d-0e645f6599a3`, {
            method: 'PATCH',
            headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                status: 'paid',
                payment_status: 'paid',
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Failed to update order: ${updateResponse.status} ${errorText}`);
        }

        console.log("✅ Order marked as paid successfully");

        // Step 2: Generate invoice
        console.log("\n📄 Step 2: Generating invoice...");
        
        const invoiceResponse = await fetch(`/.netlify/functions/invoice-pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                m_payment_id: orderData.m_payment_id,
                site_url: orderData.site_url
            })
        });

        if (!invoiceResponse.ok) {
            const errorText = await invoiceResponse.text();
            throw new Error(`Invoice generation failed: ${invoiceResponse.status} ${errorText}`);
        }

        console.log("✅ Invoice generated successfully");

        // Step 3: Verify the invoice URL was set
        console.log("\n🔍 Step 3: Verifying invoice URL...");
        
        const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.4fc6796e-3b62-4890-8d8d-0e645f6599a3&select=invoice_url,status,payment_status`, {
            headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`
            }
        });

        if (verifyResponse.ok) {
            const result = await verifyResponse.json();
            if (result && result.length > 0) {
                console.log("📋 Order status after fix:");
                console.log(`   Status: ${result[0].status}`);
                console.log(`   Payment Status: ${result[0].payment_status}`);
                console.log(`   Invoice URL: ${result[0].invoice_url || 'NOT SET'}`);
                
                if (result[0].invoice_url) {
                    console.log(`🎉 SUCCESS! Invoice URL: ${result[0].invoice_url}`);
                } else {
                    console.log("⚠️  Warning: Invoice URL was not set properly");
                }
            }
        }

        console.log("\n🎯 Fix completed!");

    } catch (error) {
        console.error("❌ Error during fix:", error.message);
        throw error;
    }
}

// Execute the fix
markOrderAsPaid()
    .then(() => {
        console.log("\n✅ Order fix completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Order fix failed:", error.message);
        process.exit(1);
    });