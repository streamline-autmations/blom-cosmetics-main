import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Download, Eye, EyeOff, LogOut, RefreshCw } from 'lucide-react';

/**
 * Affiliate partner portal.
 *
 * Intentionally chrome-free: no storefront header, nav or cart. This is a business tool
 * that happens to live on the shop's domain, and the partner should never be one stray
 * click away from the consumer site.
 *
 * All data arrives from affiliate-stats, which scopes every query to the affiliate id held
 * in the server-side session. This page has no Supabase client and no keys.
 */

interface Totals {
  clicks: number;
  unique_clicks: number;
  clicks_30d: number;
  orders: number;
  sales_cents: number;
  commission_cents: number;
  pending_cents: number;
  approved_cents: number;
  paid_cents: number;
  reversed_cents: number;
}

interface MonthRow {
  month: string;
  clicks: number;
  orders: number;
  sales_cents: number;
  commission_cents: number;
}

interface OrderRow {
  order_number: string;
  date: string;
  kind: string | null;
  sale_cents: number;
  commission_cents: number;
  status: string;
  method: string | null;
}

interface PayoutRow {
  period_start: string;
  period_end: string;
  commission_count: number;
  total_cents: number;
  status: string;
  paid_at: string | null;
  reference: string | null;
}

interface Dashboard {
  affiliate: { code: string; name: string; commission_rate: number; attribution_days: number };
  totals: Totals;
  monthly: MonthRow[];
  recent_orders: OrderRow[];
  payouts: PayoutRow[];
}

const money = (cents: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format((cents || 0) / 100);

const count = (value: number) => new Intl.NumberFormat('en-ZA').format(value || 0);

const monthLabel = (month: string) => {
  const [year, m] = month.split('-');
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString('en-ZA', {
    month: 'long',
    year: 'numeric',
  });
};

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  approved: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  pending: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  reversed: 'bg-rose-50 text-rose-700 ring-rose-600/20',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${
      STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 ring-slate-500/20'
    }`}
  >
    {status}
  </span>
);

const LoginScreen: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/affiliate-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not sign you in.');
        return;
      }
      onSuccess();
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F8F9FA] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6C757D]">
            Blom Cosmetics
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#212529]">Partner portal</h1>
          <p className="mt-2 text-sm text-[#6C757D]">
            Sign in to view your referrals, sales and commission.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5 rounded-lg bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div>
            <label htmlFor="partner-email" className="block text-sm font-medium text-[#343A40]">
              Email address
            </label>
            <input
              id="partner-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 block h-11 w-full rounded-md border border-slate-300 px-3 text-base text-[#212529] outline-none focus:border-[#FF74A4] focus:ring-2 focus:ring-[#FF74A4]/30"
            />
          </div>

          <div>
            <label htmlFor="partner-password" className="block text-sm font-medium text-[#343A40]">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="partner-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block h-11 w-full rounded-md border border-slate-300 pl-3 pr-11 text-base text-[#212529] outline-none focus:border-[#FF74A4] focus:ring-2 focus:ring-[#FF74A4]/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#6C757D] hover:text-[#212529]"
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-md bg-[#FF74A4] text-base font-semibold text-white transition-colors hover:bg-[#f2568e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#6C757D]">
          Access is limited to registered partner accounts.
        </p>
      </div>
    </div>
  );
};

const ReferralLink: React.FC<{ code: string; days: number; rate: number }> = ({ code, days, rate }) => {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/?ref=${code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="rounded-lg bg-[#CEE5FF]/40 p-5 ring-1 ring-[#CEE5FF]">
      <h2 className="text-sm font-semibold text-[#212529]">Your referral link</h2>
      <p className="mt-1 text-sm text-[#343A40]">
        Every sale from this link earns {(rate * 100).toFixed(0)}% commission, for {days} days after
        the visitor clicks.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-md bg-white px-3 py-2.5 font-mono text-sm text-[#212529] ring-1 ring-black/5">
          {link}
        </code>
        <button
          onClick={copy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#212529] px-4 text-sm font-medium text-white transition-colors hover:bg-black sm:h-auto"
        >
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </section>
  );
};

const Metric: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-lg bg-white p-5 ring-1 ring-black/5">
    <p className="text-sm text-[#6C757D]">{label}</p>
    <p className="mt-1.5 text-2xl font-semibold tabular-nums text-[#212529]">{value}</p>
    {hint && <p className="mt-1 text-xs text-[#6C757D]">{hint}</p>}
  </div>
);

const EmptyRow: React.FC<{ colSpan: number; message: string }> = ({ colSpan, message }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-[#6C757D]">
      {message}
    </td>
  </tr>
);

const Dashboard: React.FC<{ data: Dashboard; onSignOut: () => void; onRefresh: () => void }> = ({
  data,
  onSignOut,
  onRefresh,
}) => {
  const { affiliate, totals, monthly, recent_orders: orders, payouts } = data;
  const conversion = totals.unique_clicks > 0 ? (totals.orders / totals.unique_clicks) * 100 : 0;
  // A wall of zero rows reads as broken rather than new.
  const activeMonths = monthly.filter((m) => m.clicks > 0 || m.orders > 0);

  const exportCsv = () => {
    const header = ['Order', 'Date', 'Type', 'Qualifying sale', 'Commission', 'Status'];
    const rows = orders.map((o) => [
      o.order_number,
      new Date(o.date).toISOString().slice(0, 10),
      o.kind || 'product',
      (o.sale_cents / 100).toFixed(2),
      (o.commission_cents / 100).toFixed(2),
      o.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `blom-${affiliate.code}-commission-statement.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-dvh bg-[#F8F9FA]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6C757D]">
              Blom Cosmetics · Partner portal
            </p>
            <h1 className="mt-1 text-xl font-semibold text-[#212529]">{affiliate.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-[#343A40] ring-1 ring-black/10 transition-colors hover:bg-[#F8F9FA]"
            >
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </button>
            <button
              onClick={onSignOut}
              className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-[#343A40] ring-1 ring-black/10 transition-colors hover:bg-[#F8F9FA]"
            >
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <ReferralLink
          code={affiliate.code}
          days={affiliate.attribution_days}
          rate={Number(affiliate.commission_rate)}
        />

        {/* Commission is the number that matters — it gets its own block, not a fourth
            identical tile in a grid. */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg bg-[#212529] p-6 text-white lg:row-span-2">
            <p className="text-sm text-white/70">Commission earned</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums">{money(totals.commission_cents)}</p>
            <dl className="mt-6 space-y-3 border-t border-white/15 pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-white/70">Awaiting payout</dt>
                <dd className="tabular-nums font-medium">
                  {money(totals.approved_cents + totals.pending_cents)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/70">Paid out</dt>
                <dd className="tabular-nums font-medium">{money(totals.paid_cents)}</dd>
              </div>
              {totals.reversed_cents > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-white/70">Reversed</dt>
                  <dd className="tabular-nums font-medium">{money(totals.reversed_cents)}</dd>
                </div>
              )}
            </dl>
          </div>

          <Metric label="Visitors referred" value={count(totals.unique_clicks)} hint={`${count(totals.clicks_30d)} in the last 30 days`} />
          <Metric label="Orders" value={count(totals.orders)} hint={`${conversion.toFixed(1)}% of referred visitors`} />
          <Metric label="Qualifying sales" value={money(totals.sales_cents)} hint="Excludes shipping and discounts" />
          <Metric label="Commission rate" value={`${(Number(affiliate.commission_rate) * 100).toFixed(0)}%`} hint={`${affiliate.attribution_days}-day attribution`} />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#212529]">Month by month</h2>
          <div className="mt-3 overflow-x-auto rounded-lg bg-white ring-1 ring-black/5">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-[#6C757D]">
                  <th scope="col" className="px-4 py-3 font-medium">Month</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Visitors</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Orders</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Sales</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {activeMonths.length === 0 ? (
                  <EmptyRow colSpan={5} message="No activity yet. Months appear here once your link starts sending visitors." />
                ) : activeMonths.map((row) => (
                  <tr key={row.month}>
                    <td className="px-4 py-3 font-medium text-[#212529]">{monthLabel(row.month)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{count(row.clicks)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{count(row.orders)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(row.sales_cents)}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-[#212529]">
                      {money(row.commission_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#212529]">Referred orders</h2>
            {orders.length > 0 && (
              <button
                onClick={exportCsv}
                className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-[#343A40] ring-1 ring-black/10 transition-colors hover:bg-white"
              >
                <Download size={16} aria-hidden="true" />
                Download statement
              </button>
            )}
          </div>
          <div className="mt-3 overflow-x-auto rounded-lg bg-white ring-1 ring-black/5">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-[#6C757D]">
                  <th scope="col" className="px-4 py-3 font-medium">Order</th>
                  <th scope="col" className="px-4 py-3 font-medium">Date</th>
                  <th scope="col" className="px-4 py-3 font-medium">Type</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Qualifying sale</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Commission</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.length === 0 ? (
                  <EmptyRow
                    colSpan={6}
                    message="No referred orders yet. Orders appear here as soon as a customer who used your link completes a purchase."
                  />
                ) : (
                  orders.map((order) => (
                    <tr key={order.order_number}>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-[#212529]">{order.order_number}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#343A40]">{dateLabel(order.date)}</td>
                      <td className="px-4 py-3 capitalize text-[#343A40]">{order.kind || 'product'}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[#343A40]">{money(order.sale_cents)}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-[#212529]">
                        {money(order.commission_cents)}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-[#6C757D]">
            Order values shown are the qualifying amount used to calculate commission: product
            subtotal after discounts, excluding delivery.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[#212529]">Payout history</h2>
          <div className="mt-3 overflow-x-auto rounded-lg bg-white ring-1 ring-black/5">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-[#6C757D]">
                  <th scope="col" className="px-4 py-3 font-medium">Period</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Orders</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {payouts.length === 0 ? (
                  <EmptyRow colSpan={5} message="No payouts recorded yet." />
                ) : (
                  payouts.map((payout) => (
                    <tr key={`${payout.period_start}-${payout.period_end}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-[#343A40]">
                        {dateLabel(payout.period_start)} – {dateLabel(payout.period_end)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{count(payout.commission_count)}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums text-[#212529]">
                        {money(payout.total_cents)}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={payout.status} /></td>
                      <td className="px-4 py-3 text-[#6C757D]">{payout.reference || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export const PartnerPortalPage: React.FC = () => {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/.netlify/functions/affiliate-stats');
      if (res.status === 401) {
        setAuthed(false);
        setData(null);
        return;
      }
      if (!res.ok) {
        setError('Could not load your dashboard. Please try again.');
        return;
      }
      setData(await res.json());
      setAuthed(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/.netlify/functions/affiliate-auth');
        if (res.ok) await loadStats();
      } finally {
        setChecking(false);
      }
    })();
  }, [loadStats]);

  const signOut = async () => {
    try {
      const res = await fetch('/.netlify/functions/affiliate-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      if (!res.ok) {
        // Don't claim a clean sign-out while the session may still be usable.
        setError('Could not sign you out completely. Please close this browser.');
        return;
      }
    } catch {
      setError('Could not sign you out completely. Please close this browser.');
      return;
    }
    setAuthed(false);
    setData(null);
  };

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F8F9FA]">
        <p className="text-sm text-[#6C757D]">Loading…</p>
      </div>
    );
  }

  if (!authed || !data) {
    return (
      <>
        <LoginScreen
          onSuccess={async () => {
            setChecking(true);
            await loadStats();
            setChecking(false);
          }}
        />
        {error && (
          <p role="alert" className="pb-8 text-center text-sm text-rose-700">
            {error}
          </p>
        )}
      </>
    );
  }

  return <Dashboard data={data} onSignOut={signOut} onRefresh={loadStats} />;
};

export default PartnerPortalPage;
