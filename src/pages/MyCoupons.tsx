import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { Ticket, Calendar, Copy, Check, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authService, AuthState } from '../lib/auth';

interface Coupon {
  id: string;
  code: string;
  type: string | null;
  value: number | null;
  percent: number | null;
  valid_until: string | null;
  used_count: number;
  max_uses: number;
  min_order_cents: number | null;
  max_discount_cents: number | null;
  locked_email: string | null;
  status: string;
  created_at: string;
}

export default function MyCoupons() {
  const [authState, setAuthState] = useState<AuthState>({ user: null, loading: true, error: null });
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'My Coupons - BLOM Cosmetics';
    const unsub = authService.subscribe((s) => setAuthState(s));
    return unsub;
  }, []);

  useEffect(() => {
    const fetchCoupons = async () => {
      if (!authState.user) { setLoading(false); return; }
      try {
        setLoading(true);
        setError(null);
        const { data, error: rpcError } = await supabase.rpc('get_my_active_coupons');
        if (rpcError) throw rpcError;
        setCoupons(data || []);
      } catch (err: any) {
        console.error('Error fetching coupons:', err);
        setError(err.message || 'Failed to load coupons');
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, [authState.user]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

  const copyToClipboard = async (coupon: Coupon) => {
    try {
      await navigator.clipboard.writeText(coupon.code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = coupon.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(coupon.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const discountLabel = (coupon: Coupon) => {
    if (coupon.code.startsWith('RING-')) return 'R399 PAIR';
    if (coupon.type === 'fixed' && coupon.value) return `R${coupon.value} OFF`;
    if (coupon.type === 'percent' && coupon.percent) return `${coupon.percent}% OFF`;
    if (coupon.percent) return `${coupon.percent}% OFF`;
    if (coupon.value) return `R${coupon.value} OFF`;
    return 'Discount';
  };

  const discountSublabel = (coupon: Coupon) => {
    if (coupon.type === 'percent' && coupon.max_discount_cents) {
      return `Up to R${(coupon.max_discount_cents / 100).toFixed(0)} off`;
    }
    return null;
  };

  const usesRemaining = (coupon: Coupon) => coupon.max_uses - coupon.used_count;

  if (authState.loading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showMobileMenu={true} />
        <main className="section-padding">
          <Container>
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your coupons…</p>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  if (!authState.user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showMobileMenu={true} />
        <main className="section-padding">
          <Container>
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
              <p className="text-gray-600 mb-6">You need to be logged in to view your coupons.</p>
              <Button onClick={() => (window.location.href = '/login?redirect=/account/coupons')}>Log In</Button>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showMobileMenu={true} />
      <main className="section-padding">
        <Container>
          <div className="mb-6">
            <Button variant="outline" onClick={() => (window.location.href = '/account')}>
              ← Back to Account
            </Button>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <Ticket className="h-7 w-7 text-pink-500" />
              <h1 className="text-3xl font-bold text-gray-900">My Coupons</h1>
            </div>
            <p className="text-gray-500 text-sm">Your active discount codes — click any code to copy it</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {coupons.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No active coupons</h2>
              <p className="text-gray-500">You don't have any active coupons right now. Check back after your next purchase!</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {coupons.map((coupon) => {
                const isCopied = copiedId === coupon.id;
                const isRingOffer = coupon.code.startsWith('RING-');
                const remaining = usesRemaining(coupon);
                const sub = discountSublabel(coupon);

                return (
                  <div
                    key={coupon.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    {/* Top strip */}
                    <div className="bg-gradient-to-r from-pink-400 to-blue-300 px-5 py-4 flex items-center justify-between">
                      <div>
                        <div className="text-white font-extrabold text-2xl leading-none">{discountLabel(coupon)}</div>
                        {sub && <div className="text-pink-100 text-xs mt-0.5">{sub}</div>}
                      </div>
                      <Tag className="h-8 w-8 text-white/60" />
                    </div>

                    {/* Perforated divider */}
                    <div className="flex items-center px-4">
                      <div className="w-4 h-4 rounded-full bg-gray-50 border border-gray-100 -ml-6 flex-shrink-0" />
                      <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1" />
                      <div className="w-4 h-4 rounded-full bg-gray-50 border border-gray-100 -mr-6 flex-shrink-0" />
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4">
                      {/* Code */}
                      <button
                        onClick={() => copyToClipboard(coupon)}
                        className="w-full bg-gray-50 hover:bg-pink-50 border-2 border-dashed border-gray-200 hover:border-pink-300 rounded-lg px-4 py-3 flex items-center justify-between gap-3 transition-colors group mb-4"
                      >
                        <code className="text-lg font-bold text-gray-800 tracking-widest">{coupon.code}</code>
                        <span className={`flex items-center gap-1 text-xs font-medium flex-shrink-0 ${isCopied ? 'text-green-600' : 'text-pink-500 group-hover:text-pink-600'}`}>
                          {isCopied
                            ? <><Check className="h-3.5 w-3.5" /> Copied!</>
                            : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                        </span>
                      </button>

                      {/* Details */}
                      <div className="space-y-1.5 text-sm text-gray-500">
                        {coupon.min_order_cents && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">Min. order</span>
                            <span className="font-medium text-gray-700">R{(coupon.min_order_cents / 100).toFixed(0)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span>{coupon.valid_until ? `Expires ${formatDate(coupon.valid_until)}` : 'Never expires'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket className="h-3.5 w-3.5 text-gray-400" />
                          <span>{remaining} use{remaining !== 1 ? 's' : ''} remaining</span>
                        </div>
                        {isRingOffer && (
                          <div className="pt-3">
                            <p className="mb-3 text-xs leading-5 text-gray-500">
                              One White and one Clear Petal Paste for R399 together.
                            </p>
                            <Button
                              fullWidth
                              size="sm"
                              onClick={() => { window.location.href = '/offers/trendy-ring-petal-paste'; }}
                            >
                              Shop your course offer
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
