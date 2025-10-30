'use client';

import React, { useEffect, useState } from 'react';
import { useDonationModal } from '@/lib/contexts/donation-modal-context';
import { Button } from '@/components/ui/button';

type Method = 'bkash' | 'rocket' | 'nagad' | 'bank' | 'paypal';

export default function DonationModal() {
  const { isOpen, close } = useDonationModal();
  const [date, setDate] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('BDT');
  const [method, setMethod] = useState<Method>('bkash');
  const [trxId, setTrxId] = useState('');
  const [agent, setAgent] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      try {
        const t = localStorage.getItem('access_token');
        if (t && t !== 'undefined' && t !== 'null') headers['Authorization'] = `Bearer ${t}`;
      } catch {}
      await fetch('/api/donations-submissions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ date, amount: Number(amount), currency, method, trx_id: trxId, agent, contact, notes })
      });
      try { localStorage.setItem('donation_last_submitted', new Date().toISOString()); } catch {}
      close();
    } catch {
      // keep open on error
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <div className="relative bg-card text-foreground w-full max-w-5xl mx-4 rounded-xl border shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative hidden md:block">
            <img src="/donation.png" alt="Donation methods" className="h-full w-full object-cover" />
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold">Support Blood Node</h3>
              <button onClick={close} aria-label="Close" className="rounded-md px-2 py-1 hover:bg-accent">✕</button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Please submit this form after you complete your donation via bKash/Rocket/Nagad/Bank/PayPal.</p>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Date of Donation</label>
                  <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <div className="mt-1 flex gap-2">
                    <input type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2" required />
                    <select value={currency} onChange={e=>setCurrency(e.target.value)} className="w-28 rounded-md border border-input bg-background px-3 py-2">
                      <option>BDT</option>
                      <option>USD</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Donation Method</label>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {(['bkash','rocket','nagad','bank','paypal'] as Method[]).map(m => (
                    <label key={m} className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer ${method===m? 'bg-accent' : ''}`}>
                      <input type="radio" name="method" className="accent-red-600" checked={method===m} onChange={()=>setMethod(m)} />
                      <span className="capitalize">{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">TrxID (Transaction ID)</label>
                  <input value={trxId} onChange={e=>setTrxId(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-medium">Agent/Account Number</label>
                  <input value={agent} onChange={e=>setAgent(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Contact Number (optional)</label>
                  <input value={contact} onChange={e=>setContact(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-medium">Further Info (optional)</label>
                  <input value={notes} onChange={e=>setNotes(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit">Submit</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


