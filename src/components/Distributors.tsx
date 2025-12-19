import { useEffect, useState } from 'react';
import { Plus, MinusCircle, History, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Distributors() {
  const [distributors, setDistributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDistributors();
  }, []);

  const loadDistributors = async () => {
    const { data } = await supabase.from('distributors').select('*').order('name');
    setDistributors(data || []);
    setLoading(false);
  };

  const handlePayment = async (distId: string, currentDebt: number) => {
    const amount = prompt("Enter installment amount paid ($):");
    if (!amount || isNaN(parseFloat(amount))) return;

    const val = parseFloat(amount);
    // Record the payment
    await supabase.from('distributor_transactions').insert([
      { distributor_id: distId, amount: val, type: 'payment', notes: 'Installment payment' }
    ]);
    // Update the balance
    await supabase.from('distributors').update({ total_debt: currentDebt - val }).eq('id', distId);
    loadDistributors();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Distributor Debts</h2>
        <button className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Distributor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {distributors.map(d => (
          <div key={d.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg">{d.name}</h3>
            <p className="text-sm text-slate-500">{d.phone}</p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-slate-400 uppercase font-bold">Total Debt Owed</p>
              <p className="text-2xl font-black text-red-600">${parseFloat(d.total_debt).toFixed(2)}</p>
            </div>
            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => handlePayment(d.id, d.total_debt)}
                className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Pay Installment
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}