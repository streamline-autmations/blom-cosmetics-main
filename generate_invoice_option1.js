// STEP-BY-STEP GUIDE: Generate Invoice for Order BL-MIJ9P3QJ
// Option 1 - Direct Invoice Generation

const ORDER_ID = "BL-19ACBFB542B";
const BASE_URL = "https://blom-cosmetics.co.za/.netlify/functions";

console.log("🚀 GENERATING INVOICE FOR ORDER BL-MIJ9P3QJ");
console.log("================================================");

// Option 1A: Direct URL (Copy and paste into browser)
console.log("\n📱 OPTION 1A - COPY THIS URL INTO YOUR BROWSER:");
console.log(`🔗 ${BASE_URL}/invoice-pdf?m_payment_id=${ORDER_ID}`);
console.log("\n💡 Steps:");
console.log("   1. Copy the URL above");
console.log("   2. Open new browser tab");
console.log("   3. Paste URL and press Enter");
console.log("   4. Invoice PDF will open/download");

// Option 1B: Command line (if you have access)
console.log("\n💻 OPTION 1B - COMMAND LINE (if available):");
console.log(`curl -L "${BASE_URL}/invoice-pdf?m_payment_id=${ORDER_ID}&download=1" -o invoice-${ORDER_ID}.pdf`);

// Option 1C: JavaScript fetch (in browser console)
console.log("\n🌐 OPTION 1C - BROWSER CONSOLE (F12 > Console):");
console.log(`fetch('${BASE_URL}/invoice-pdf?m_payment_id=${ORDER_ID}&download=1')
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice-${ORDER_ID}.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  });`);

// Test the invoice generation
async function testInvoiceGeneration() {
    try {
        console.log("\n🧪 TESTING INVOICE GENERATION...");
        
        const response = await fetch(`${BASE_URL}/invoice-pdf?m_payment_id=${ORDER_ID}`);
        
        console.log(`Response Status: ${response.status}`);
        console.log(`Content-Type: ${response.headers.get('content-type')}`);
        
        if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/pdf')) {
                console.log("✅ SUCCESS! Invoice PDF generated successfully!");
                
                // Extract filename from headers
                const contentDisposition = response.headers.get('content-disposition');
                if (contentDisposition) {
                    const filename = contentDisposition.match(/filename="([^"]+)"/);
                    if (filename) {
                        console.log(`📄 Invoice filename: ${filename[1]}`);
                    }
                }
                
                console.log("\n🎉 Your invoice is ready!");
                console.log("💾 You can now download or view the PDF");
            } else {
                console.log("⚠️ Response received but not PDF format");
            }
        } else {
            console.log(`❌ Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.log("Error details:", errorText);
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
        console.log("\n💡 If this fails, use Option 1A (browser URL) above");
    }
}

// Uncomment to test
// testInvoiceGeneration();