import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, X, Check, Loader2, Phone, Search, 
  Package, Receipt, CreditCard, Wallet, MoreHorizontal, TrendingUp 
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
    // Matches your schema: amount, payment_method, expense_date, notes, description
    await supabase.from('expenses').insert([{
      amount: Number(amount),
      payment_method: 'Supplier Pay',
      expense_date: new Date().toISOString().split('T')[0],
      notes: `Payment to ${distName} (${note})`,
      description: `Debt settlement for ${distName}: ${note}`
    }]);
  };

  const handlePayment = async (dist: Distributor, amount: number, type: string) => {
    if (amount <= 0) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('distributors')
        .update({ total_debt: dist.total_debt - amount })
        .eq('id', dist.id);

      if (!error) {
        await logExpense(dist.name, amount, type);
        await fetchDistributors();
        alert(`Recorded KES ${amount.toLocaleString()} payment.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...formData, total_debt: Number(formData.total_debt) };
    if (editingId) await supabase.from('distributors').update(payload).eq('id', editingId);
    else await supabase.from('distributors').insert([payload]);
    setIsModalOpen(false);
    fetchDistributors();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Suppliers</h1>
          <p className="text-slate-500 font-bold">Manage debts and financial settlements</p>
        </div>
        <button onClick={() => { setEditingId(null); setFormData({name:'', phone:'', total_debt:0}); setIsModalOpen(true); }} 
          className="bg-amber-500 text-white p-4 rounded-2xl shadow-lg hover:bg-amber-600 transition-all active:scale-95">
          <UserPlus size={24} />
        </button>
      </div>

      <div className="max-w-7xl mx-auto mb-6">
        <div className="relative bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-2 flex items-center gap-2 w-full md:w-80">
          <Search className="text-slate-400" size={20} />
          <input type="text" placeholder="Search suppliers..." className="outline-none flex-1 text-slate-600 bg-transparent py-1 font-bold"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {distributors.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map(dist => (
          <div key={dist.id} className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm group hover:border-amber-500 transition-all">
            <div className="flex justify-between mb-6">
              <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500">
                <Package size={24} />
              </div>
              <button onClick={() => { setEditingId(dist.id); setFormData({name: dist.name, phone: dist.phone, total_debt: dist.total_debt}); setIsModalOpen(true); }} className="text-slate-300 hover:text-slate-600">
                 <MoreHorizontal size={20} />
              </button>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-1 uppercase tracking-tight">{dist.name}</h3>
            <p className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2"><Phone size={14}/> {dist.phone}</p>
            
            <div className="bg-slate-900 p-6 rounded-2xl text-white mb-6 shadow-xl shadow-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Owed</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-black">KES {dist.total_debt.toLocaleString()}</p>
                <TrendingUp size={20} className={dist.total_debt > 0 ? "text-amber-500" : "text-emerald-500"} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handlePayment(dist, dist.total_debt, 'Full Settlement')} 
                className="bg-amber-500 text-white py-4 rounded-xl font-black text-[10px] uppercase hover:bg-amber-600 transition-all active:scale-95 shadow-md">
                Full Pay
              </button>
              <button onClick={() => {
                const amt = prompt(`Enter amount to pay ${dist.name}:`);
                if (amt) handlePayment(dist, Number(amt), 'Installment');
              }} className="bg-slate-100 text-slate-700 py-4 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all">
                Installment
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{editingId ? 'Edit' : 'Add'} Supplier</h2>
               <button onClick={() => setIsModalOpen(false)} className="bg-slate-50 p-2 rounded-full text-slate-400"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Supplier Name" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 font-bold outline-amber-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input required placeholder="Phone Number" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 font-bold outline-amber-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input type="number" placeholder="Current Debt (KES)" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 font-bold outline-amber-500" value={formData.total_debt} onChange={e => setFormData({...formData, total_debt: Number(e.target.value)})} />
              <button type="submit" disabled={loading} className="w-full py-5 bg-amber-500 text-white font-black rounded-2xl shadow-lg hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <><Check size={20}/> SAVE SUPPLIER</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}