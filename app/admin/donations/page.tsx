'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminNav } from '@/components/admin/admin-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Item = {
  _id: string;
  date: string;
  amount: number;
  currency: string;
  method: string;
  trx_id?: string;
  agent?: string;
  contact?: string;
  notes?: string;
  created_at: string;
};

export default function AdminDonationsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [method, setMethod] = useState<string>('');
  const [q, setQ] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (method) params.set('method', method);
    if (q) params.set('q', q);
    const headers: Record<string,string> = {};
    try {
      const t = localStorage.getItem('admin_token');
      if (t && t !== 'undefined' && t !== 'null') headers['Authorization'] = `Bearer ${t}`;
    } catch {}
    const res = await fetch(`/api/donations-submissions?${params.toString()}`, { cache: 'no-store', credentials: 'include', headers });
    if (res.ok) {
      const data = await res.json();
      setItems(data.data || []);
    } else {
      console.warn('Failed to load donations', res.status);
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const csv = useMemo(() => {
    const header = ['date','amount','currency','method','trx_id','agent','contact','notes'];
    const rows = items.map(i => [i.date, i.amount, i.currency, i.method, i.trx_id||'', i.agent||'', i.contact||'', i.notes||'']);
    return [header, ...rows].map(r => r.map(x => `"${String(x).replaceAll('"','""')}"`).join(',')).join('\n');
  }, [items]);

  const download = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'donations.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Donation Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-sm font-medium">Method</label>
                <select value={method} onChange={e=>setMethod(e.target.value)} className="block mt-1 border rounded-md bg-background px-3 py-2">
                  <option value="">All</option>
                  <option value="bkash">bKash</option>
                  <option value="rocket">Rocket</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">Bank</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium">Search</label>
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder="trx id, agent, contact, notes" className="block mt-1 w-full border rounded-md bg-background px-3 py-2" />
              </div>
              <Button onClick={fetchItems} disabled={loading}>{loading ? 'Loading...' : 'Filter'}</Button>
              <Button variant="secondary" onClick={download}>Export CSV</Button>
            </div>
          </CardContent>
        </Card>

        <div className="overflow-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Amount</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">TrxID</th>
                <th className="px-3 py-2 text-left">Agent</th>
                <th className="px-3 py-2 text-left">Contact</th>
                <th className="px-3 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i._id} className="border-t">
                  <td className="px-3 py-2">{new Date(i.date || i.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{i.amount} {i.currency}</td>
                  <td className="px-3 py-2 capitalize">{i.method}</td>
                  <td className="px-3 py-2">{i.trx_id}</td>
                  <td className="px-3 py-2">{i.agent}</td>
                  <td className="px-3 py-2">{i.contact}</td>
                  <td className="px-3 py-2">{i.notes}</td>
                </tr>
              ))}
              {!items.length && (
                <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={7}>No submissions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}


