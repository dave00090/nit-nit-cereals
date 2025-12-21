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
    // Sync with your schema: amount, payment_method, expense_date, notes, description
    await supabase.from('expenses').insert([{
      amount: Number(amount),
      payment_method: 'Supplier Pay',
      expense_date: new Date().toISOString().split('T')[0],
      notes: `Payment to ${distName} (${note})`,
      description: `Settlement for ${distName}: ${note}`
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
        alert(`Success: KES ${amount.toLocaleString()} recorded.`);
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
              Suppliers
            </h1>
            <p className="text-slate-500 font-bold">Manage credit balances and settlements</p>
          </div>
          
          <button 
            onClick={() => { setEditingId(null); setFormData({name:'', phone:'', total_debt:0}); setIsModalOpen(true); }} 
            className="bg-amber-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all active:scale-95"
          >
            <UserPlus size={20} strokeWidth={3} />
            ADD NEW SUPPLIER
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-10">
          <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-3 flex items-center gap-3 w-full md:w-96 focus-within:border-amber-500 transition-all">
            <Search className="text-slate-400" size={20} />
            <input 
              type="text" placeholder="Search by name..." 
              className="outline-none flex-1 text-slate-700 bg-transparent font-bold"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {/* SUPPLIERS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {distributors.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map(dist => (
            <div key={dist.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:border-amber-500 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-amber-500 group-hover:text-slate-900 transition-all duration-300">
                  <Package size={28} />
                </div>
                <button 
                  onClick={() => { setEditingId(dist.id); setFormData({name: dist.name, phone: dist.phone, total_debt: dist.total_debt}); setIsModalOpen(true); }}
                  className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
                >
                  <MoreHorizontal size={24} />
                </button>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight truncate">{dist.name}</h3>
                <div className="flex items-center gap-2 text-slate-400 font-bold mt-1">
                  <Phone size={14} className="text-amber-500" />
                  <span className="text-sm tracking-wide">{dist.phone}</span>
                </div>
              </div>

              {/* DEBT CARD */}
              <div className="bg-slate-900 p-6 rounded-3xl text-white mb-8 shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Balance Owed</span>
                    <TrendingUp size={16} className={dist.total_debt > 0 ? "text-amber-500" : "text-emerald-500"} />
                  </div>
                  <p className="text-3xl font-black italic">KES {dist.total_debt.toLocaleString()}</p>
                </div>
                <Wallet className="absolute -right-4 -bottom-4 text-white/5" size={80} />
              </div>

              {/* ACTIONS */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handlePayment(dist, dist.total_debt, 'Full Settlement')}
                  className="bg-amber-500 text-slate-900 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/10 active:scale-95"
                >
                  Full Pay
                </button>
                <button 
                  onClick={() => {
                    const amt = prompt(`Enter installment amount for ${dist.name}:`);
                    if (amt) handlePayment(dist, Number(amt), 'Partial Payment');
                  }}
                  className="bg-slate-100 text-slate-700 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Installment
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {editingId ? 'Edit' : 'Add'} Supplier
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-3 rounded-full text-slate-400 hover:text-red-500 transition-all">
                <X size={20} strokeWidth={3} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier Business Name</label>
                <input required className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Contact</label>
                <input required className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500 transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Opening Debt Balance (KES)</label>
                <input type="number" className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500 transition-all" value={formData.total_debt} onChange={e => setFormData({...formData, total_debt: Number(e.target.value)})} />
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-amber-500 font-black rounded-[2rem] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 mt-4 uppercase tracking-widest text-sm">
                {loading ? <Loader2 className="animate-spin" /> : <><Check size={20} strokeWidth={3}/> Sync Supplier</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}