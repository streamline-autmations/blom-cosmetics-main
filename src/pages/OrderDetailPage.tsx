import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

// Update Types to include financial breakdown
type Order = {
  id: string;
  m_payment_id: string | null;
  order_number: string | null;
  status: string;
  shipping_status: string | null;
  order_packed_at: string | null;
  total: number;
  subtotal: number;      // Added
  shipping: number;      // Added
  discount: number;      // Added
  coupon_code: string | null; // Added
  created_at: string;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  fulfillment_method: string | null;
  delivery_address: any;
  invoice_url: string | null;
  items: any[];
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = id || '';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Order ${orderId} - BLOM Cosmetics`;
    (async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all financial fields
        let { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            subtotal_cents,
            shipping_cents,
            discount_cents,
            coupon_code
          `)
          .eq('id', orderId)
          .maybeSingle();

        if (orderError) throw orderError;
        if (!orderData) { setOrder(null); setLoading(false); return; }

        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        // Calculate financial values from cents
        const subtotal = (orderData.subtotal_cents || 0) / 100;
        const shipping = (orderData.shipping_cents || 0) / 100;
        const discount = (orderData.discount_cents || 0) / 100;
        
        // FORCE CORRECT TOTAL: Subtotal + Shipping - Discount
        const calculatedTotal = Math.max(0, subtotal + shipping - discount);

        setOrder({
          ...orderData,
          total: calculatedTotal, // Override DB total with calculated one
          subtotal,
          shipping,
          discount,
          coupon_code: orderData.coupon_code,
          items: itemsData || []
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div></div>;
  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showMobileMenu={true} />
      <main className="section-padding">
        <Container>
          <div className="max-w-4xl mx-auto bg-white rounded-xl border p-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between pb-6 border-b">
              <div>
                <h1 className="text-3xl font-bold mb-2">RECEIPT</h1>
                <div className="text-sm text-gray-600">
                  <div>Receipt #: {order.m_payment_id}</div>
                  <div>Date: {new Date(order.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <img src="https://yvmnedjybrpvlupygusf.supabase.co/storage/v1/object/public/assets/blom_logo.png" className="h-16 object-contain" alt="Logo" />
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        {item.product_name}
                        {item.variant_title && <span className="text-gray-500"> - {item.variant_title}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-medium">
                         R {(item.line_total || (item.quantity * item.unit_price)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                
                {/* SMART FOOTER: Shows Discount & Calculated Total */}
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-4 py-2 text-right text-gray-600">Subtotal</td>
                    <td className="px-4 py-2 text-right">R {order.subtotal.toFixed(2)}</td>
                  </tr>
                  
                  {order.shipping > 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-2 text-right text-gray-600">Shipping</td>
                      <td className="px-4 py-2 text-right">R {order.shipping.toFixed(2)}</td>
                    </tr>
                  )}

                  {/* COUPON ROW */}
                  {order.discount > 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-2 text-right text-green-600 font-medium">
                        Coupon {order.coupon_code ? `(${order.coupon_code})` : ''}
                      </td>
                      <td className="px-4 py-2 text-right text-green-600 font-medium">
                        -R {order.discount.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  <tr className="border-t">
                    <td colSpan={2} className="px-4 py-3 text-right font-bold text-gray-900">Total Paid</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      R {order.total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
             {/* Buttons */}
             <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => window.location.href = '/account?full=1&tab=orders'}>Back</Button>
             </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
