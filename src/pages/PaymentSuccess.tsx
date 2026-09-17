import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Container } from '../components/layout/Container';
import { cartStore } from '../lib/cart';
import { CheckCircle, FileText, Truck, ShoppingBag } from 'lucide-react';

export default function PaymentSuccess() {
  const [orderInfo, setOrderInfo] = useState<any>(null);

  useEffect(() => {
    // Get pending order from localStorage
    const pendingOrder = localStorage.getItem('blom_pending_order');
    if (pendingOrder) {
      setOrderInfo(JSON.parse(pendingOrder));
      localStorage.removeItem('blom_pending_order');
    }
    
    // Clear cart on successful payment
    cartStore.clearCart();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showMobileMenu={true} />
      <main className="py-16">
        <Container>
          <div className="max-w-2xl mx-auto">
            {/* Professional Success Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-8 py-6 border-b border-gray-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-500 rounded-full">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Payment Successful</h1>
                <p className="text-gray-600 text-center">Your order has been processed and confirmed</p>
              </div>

              {/* Content */}
              <div className="px-8 py-6">
                {/* Order Summary */}
                {orderInfo && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-600">Order ID</span>
                        <span className="text-sm font-mono text-gray-900">#{orderInfo.orderId}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-600">Subtotal</span>
                        <span className="text-sm text-gray-900">R{(orderInfo.total - orderInfo.shipping).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-600">Shipping</span>
                        <span className="text-sm text-gray-900">{orderInfo.shipping === 0 ? 'FREE' : `R${orderInfo.shipping.toFixed(2)}`}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-base font-semibold text-gray-900">Total</span>
                        <span className="text-base font-semibold text-gray-900">R{orderInfo.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-medium text-gray-600">Status</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Paid
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4">
                  {orderInfo && (
                    <>
                      {/* View Receipt Button */}
                      <a
                        href={`/.netlify/functions/invoice-pdf?inline=1&m_payment_id=${encodeURIComponent(orderInfo.orderId)}&v=${Date.now()}`}
                        target="_blank" rel="noopener"
                        className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        View Receipt
                      </a>
                      
                      {/* Download Receipt Button */}
                      <a
                        href={`/.netlify/functions/invoice-pdf?m_payment_id=${encodeURIComponent(orderInfo.orderId)}&download=1&v=${Date.now()}`}
                        className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        Download Receipt (PDF)
                      </a>
                    </>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a 
                      href="/track-order" 
                      className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Truck className="w-5 h-5 mr-2" />
                      Track Order
                    </a>
                    <a 
                      href="/shop" 
                      className="flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Continue Shopping
                    </a>
                  </div>
                </div>

                {/* Support Info */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 text-center">
                    Need help? Contact us at{' '}
                    <a href="mailto:shopblomcosmetics@gmail.com" className="text-blue-600 hover:text-blue-700 font-medium">
                      shopblomcosmetics@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}


