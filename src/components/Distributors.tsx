import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, X, Check, Loader2, Phone, Search, 
  Package, Receipt, CreditCard, Wallet, MoreHorizontal, TrendingUp, History, Calendar 
} from 'lucide-react';

interface Distributor {
  id: string;
  name: string;
  phone: string;
  total_debt: number;
}

export default function Distributors() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', total_debt: 0 });

  useEffect(() => { fetchDistributors(); }, []);

  async function fetchDistributors() {
    setLoading(true);
    const { data } = await supabase.from('distributors').select('*').order('name');
    if (data) setDistributors(data);
    setLoading(false);
  }

  const logExpense = async (distName: string, amount: number, note: string) => {
    await supabase.from('expenses').insert([{
      amount: Number(amount),
      payment_method: 'Supplier Pay',
      expense_date: new Date().toISOString().split('T')[0],
      notes: `Payment to ${distName} (${note})`,
      description: `Debt settlement for ${distName}: ${note}`
    }]);
  };

  const viewHistory = async (distName: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .ilike('notes', `%${distName}%`)
      .order('expense_date', { ascending: false });
    if (data) setHistory(data);
    setIsHistoryOpen(true);
    setLoading(false);
  };

  const handlePayment = async (dist: Distributor, amount: number, type: string) => {
    if (amount <= 0) return;
    setLoading(true);
    const { error } = await supabase
      .from('distributors')
      .update({ total_debt: dist.total_debt - amount })
      .eq('id', dist.id);

    if (!error) {
      await logExpense(dist.name, amount, type);
      await fetchDistributors();
      alert("Payment Successful");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, total_debt: Number(formData.total_debt) };
    if (editingId) await supabase.from('distributors').update(payload).eq('id', editingId);
    else await supabase.from('distributors').insert([payload]);
    setIsModalOpen(false);
    fetchDistributors();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Suppliers</h1>
          <p className="text-slate-500 font-bold tracking-tight">Credit and debt management</p>
        </div>
        <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="bg-amber-500 text-slate-900 p-4 rounded-2xl shadow-xl hover:bg-amber-400 transition-all">
          <UserPlus size={24} strokeWidth={3} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {distributors.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map(dist => (
          <div key={dist.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm group hover:border-amber-500 transition-all">
            <div className="flex justify-between mb-6">
              <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500"><Package size={24} /></div>
              <button onClick={() => viewHistory(dist.name)} className="text-slate-400 hover:text-amber-500 flex items-center gap-1 text-[10px] font-black uppercase"><History size={16}/> History</button>
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase mb-6 truncate">{dist.name}</h3>
            <div className="bg-slate-900 p-6 rounded-3xl text-white mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Debt Balance</p>
              <p className="text-2xl font-black italic">KES {dist.total_debt.toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handlePayment(dist, dist.total_debt, 'Full Settlement')} className="bg-amber-500 text-slate-900 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-amber-400 transition-all">Full Pay</button>
              <button onClick={() => { const amt = prompt("Amount:"); if(amt) handlePayment(dist, Number(amt), 'Partial'); }} className="bg-slate-100 text-slate-700 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all">Partial</button>
            </div>
          </div>
        ))}
      </div>

      {/* HISTORY MODAL */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8 sticky top-0 bg-white pb-4">
              <h2 className="text-2xl font-black uppercase tracking-tight">Payment Records</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="bg-slate-100 p-2 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              {history.map((h, i) => (
                <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="font-black text-slate-800 uppercase text-sm">{h.notes}</p>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-widest mt-1"><Calendar size={12}/> {h.expense_date}</p>
                  </div>
                  <p className="font-black text-slate-900 italic text-lg">KES {h.amount.toLocaleString()}</p>
                </div>
              ))}
              {history.length === 0 && <p className="text-center text-slate-400 font-bold py-10">No payment history found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL SAME AS BEFORE... */}
    </div>
  );
}