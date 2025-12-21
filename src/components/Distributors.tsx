import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, X, Check, Loader2, Phone, Search, 
  Package, Receipt, CreditCard, Wallet, MoreHorizontal, TrendingUp, History, Calendar, PlusCircle 
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

  // --- LOG TRANSACTION (Expense or Debt Increase) ---
  const logTransaction = async (distName: string, amount: number, note: string) => {
    await supabase.from('expenses').insert([{
      amount: Number(amount),
      payment_method: 'Supplier Trans',
      expense_date: new Date().toISOString().split('T')[0],
      notes: `${distName}: ${note}`,
      description: `Supplier Transaction for ${distName}`
    }]);
  };

  // --- ADD NEW DEBT (PURCHASE) ---
  const handleAddDebt = async (dist: Distributor) => {
    const amt = prompt(`Enter value of new stock/purchase from ${dist.name}:`);
    if (!amt || isNaN(Number(amt))) return;

    setLoading(true);
    const newDebtTotal = Number(dist.total_debt) + Number(amt);
    const { error } = await supabase
      .from('distributors')
      .update({ total_debt: newDebtTotal })
      .eq('id', dist.id);

    if (!error) {
      await logTransaction(dist.name, Number(amt), 'New Purchase/Debt Added');
      await fetchDistributors();
      alert("Debt updated successfully!");
    }
    setLoading(false);
  };

  // --- RECORD PAYMENT (DEBT SETTLEMENT) ---
  const handlePayment = async (dist: Distributor, amount: number, type: string) => {
    if (amount <= 0) return;
    setLoading(true);
    const { error } = await supabase
      .from('distributors')
      .update({ total_debt: dist.total_debt - amount })
      .eq('id', dist.id);

    if (!error) {
      await logTransaction(dist.name, amount, `Payment (${type})`);
      await fetchDistributors();
      alert("Payment Successful");
    }
    setLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { 
      name: formData.name, 
      phone: formData.phone, 
      total_debt: Number(formData.total_debt) 
    };

    if (editingId) {
      await supabase.from('distributors').update(payload).eq('id', editingId);
    } else {
      await supabase.from('distributors').insert([payload]);
    }

    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', total_debt: 0 });
    fetchDistributors();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Suppliers</h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Financial Partner Tracking</p>
          </div>
          <button 
            onClick={() => { setEditingId(null); setFormData({name:'', phone:'', total_debt:0}); setIsModalOpen(true); }} 
            className="bg-amber-500 text-slate-900 p-5 rounded-2xl shadow-xl hover:bg-amber-400 transition-all active:scale-95"
          >
            <UserPlus size={24} strokeWidth={3} />
          </button>
        </div>

        {/* SEARCH */}
        <div className="mb-10">
          <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-3 flex items-center gap-3 w-full md:w-96 focus-within:border-amber-500 transition-all">
            <Search className="text-slate-400" size={20} />
            <input type="text" placeholder="Search by name..." className="outline-none flex-1 text-slate-700 bg-transparent font-bold"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {distributors.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map(dist => (
            <div key={dist.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:border-amber-500 transition-all group">
              <div className="flex justify-between mb-6">
                <div className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500"><Package size={24} /></div>
                <div className="flex gap-2">
                   <button onClick={() => viewHistory(dist.name)} className="text-slate-400 hover:text-amber-500 p-2"><History size={20}/></button>
                   <button onClick={() => { setEditingId(dist.id); setFormData({name: dist.name, phone: dist.phone, total_debt: dist.total_debt}); setIsModalOpen(true); }} className="text-slate-400 hover:text-slate-900 p-2"><MoreHorizontal size={20}/></button>
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 uppercase mb-1 tracking-tight truncate">{dist.name}</h3>
              <p className="text-sm font-bold text-slate-400 mb-6">{dist.phone}</p>

              <div className="bg-slate-900 p-6 rounded-3xl text-white mb-6 shadow-xl shadow-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance Owed</p>
                <p className="text-3xl font-black italic text-amber-500">KES {dist.total_debt.toLocaleString()}</p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handlePayment(dist, dist.total_debt, 'Full Settlement')} className="bg-amber-500 text-slate-900 py-4 rounded-xl font-black text-[10px] uppercase hover:bg-amber-400 transition-all">Full Pay</button>
                  <button onClick={() => { const amt = prompt("Enter amount:"); if(amt) handlePayment(dist, Number(amt), 'Partial'); }} className="bg-slate-100 text-slate-700 py-4 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all">Partial</button>
                </div>
                <button 
                  onClick={() => handleAddDebt(dist)}
                  className="w-full flex items-center justify-center gap-2 py-4 border-2 border-slate-100 rounded-xl font-black text-[10px] uppercase text-slate-500 hover:bg-slate-900 hover:text-amber-500 hover:border-slate-900 transition-all"
                >
                  <PlusCircle size={16} /> Add Purchase / New Debt
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: ADD/EDIT SUPPLIER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase italic">{editingId ? 'Update' : 'New'} Supplier</h2>
              <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-400"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <input required placeholder="Business Name" className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input required placeholder="Phone Number" className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input type="number" placeholder="Initial Debt (KES)" className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-amber-500" value={formData.total_debt} onChange={e => setFormData({...formData, total_debt: Number(e.target.value)})} />
              <button type="submit" className="w-full py-5 bg-slate-900 text-amber-500 font-black rounded-[2rem] shadow-xl hover:bg-slate-800 transition-all uppercase tracking-widest text-sm mt-4">
                {loading ? <Loader2 className="animate-spin" /> : 'Sync Supplier'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL (Kept as is) */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tight">Payment Records</h2>
              <button onClick={() => setIsHistoryOpen(false)} className="bg-slate-100 p-2 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              {history.map((h, i) => (
                <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="font-black text-slate-800 uppercase text-sm">{h.notes}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{h.expense_date}</p>
                  </div>
                  <p className="font-black text-slate-900 italic text-lg">KES {h.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}