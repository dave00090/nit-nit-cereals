import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, Pencil, X, Check, Loader2, 
  Phone, Search, Package, Receipt, CreditCard, Wallet, 
  MoreHorizontal, TrendingUp 
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

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    total_debt: 0
  });

  useEffect(() => {
    fetchDistributors();
  }, []);

  async function fetchDistributors() {
    setLoading(true);
    const { data } = await supabase.from('distributors').select('*').order('name');
    if (data) setDistributors(data);
    setLoading(false);
  }

  // --- BULLETPROOF LOG EXPENSE FUNCTION ---
  const logExpense = async (distName: string, amount: number, note: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('expenses').insert([{
        title: `Supplier Payment: ${distName}`,
        amount: Number(amount),
        category: 'Supplier Payment',
        description: note,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        user_id: user?.id // Only sends if user is logged in
      }]);

      if (error) {
        console.error("Expense Log Error:", error.message);
        alert("Debt updated, but expense record failed. Check console for details.");
      }
    } catch (err) {
      console.error("System Error logging expense:", err);
    }
  };

  // --- PAYMENT LOGIC ---
  const handleFullPayment = async (dist: Distributor) => {
    if (dist.total_debt <= 0) return alert("No debt to clear.");
    if (!confirm(`Clear KES ${dist.total_debt.toLocaleString()} for ${dist.name}?`)) return;
    
    const amountToLog = dist.total_debt;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('distributors')
        .update({ total_debt: 0 })
        .eq('id', dist.id);

      if (error) throw error;

      await logExpense(dist.name, amountToLog, 'Full Settlement');
      await fetchDistributors();
      alert("Payment successful and recorded in Expenses.");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallment = async (dist: Distributor) => {
    const amountStr = prompt(`Debt: KES ${dist.total_debt.toLocaleString()}\nEnter amount paid:`);
    if (!amountStr) return;
    const amountPaid = parseFloat(amountStr);

    if (isNaN(amountPaid) || amountPaid <= 0 || amountPaid > dist.total_debt) {
      alert("Invalid amount.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('distributors')
        .update({ total_debt: dist.total_debt - amountPaid })
        .eq('id', dist.id);

      if (error) throw error;

      await logExpense(dist.name, amountPaid, 'Installment');
      await fetchDistributors();
      alert(`Recorded KES ${amountPaid.toLocaleString()} payment.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD LOGIC ---
  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', total_debt: 0 });
    setIsModalOpen(true);
  };

  const handleEdit = (dist: Distributor) => {
    setEditingId(dist.id);
    setFormData({ name: dist.name, phone: dist.phone, total_debt: dist.total_debt });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, total_debt: Number(formData.total_debt) };
      if (editingId) await supabase.from('distributors').update(payload).eq('id', editingId);
      else await supabase.from('distributors').insert([payload]);
      setIsModalOpen(false);
      fetchDistributors();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Suppliers</h1>
          <p className="text-slate-500 font-medium">Manage partner debts and expense records</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-2 flex items-center gap-2 w-80">
            <Search className="text-slate-400" size={20} />
            <input 
              type="text" placeholder="Search partners..."
              className="outline-none flex-1 text-slate-600 bg-transparent py-1"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleAddNew} className="bg-amber-500 text-white p-4 rounded-xl hover:bg-amber-600 shadow-lg active:scale-95 transition-all">
            <UserPlus size={24} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {distributors
          .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((dist) => (
            <div key={dist.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-amber-500 transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                  <Package size={24} />
                </div>
                <button onClick={() => handleEdit(dist)} className="p-2 text-slate-400 hover:text-slate-900 rounded-lg">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-1">{dist.name}</h3>
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone size={14} />
                  <span className="text-sm font-medium">{dist.phone}</span>
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl text-white mb-6">
                <div className="flex justify-between items-start mb-2">
                  <Wallet size={16} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Balance Owed</span>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-xl font-black">KES {dist.total_debt.toLocaleString()}</p>
                  <TrendingUp size={18} className={dist.total_debt > 0 ? "text-amber-500" : "text-emerald-500"} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button 
                  onClick={() => handleFullPayment(dist)}
                  className="flex items-center justify-center gap-2 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95 shadow-md"
                >
                  <Receipt size={14} /> Record Payment
                </button>
                <button 
                  onClick={() => handleInstallment(dist)}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  <CreditCard size={14} /> Installment
                </button>
              </div>
            </div>
          ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">{editingId ? 'Edit Partner' : 'Add Partner'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-400"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Name" className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-bold"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input required placeholder="Phone" className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-bold"
                value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              <input type="number" placeholder="Opening Debt" className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-bold"
                value={formData.total_debt} onChange={(e) => setFormData({...formData, total_debt: Number(e.target.value)})} />
              <button type="submit" className="w-full py-4 bg-amber-500 text-white font-black rounded-xl shadow-lg hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : <><Check size={20}/> Save Partner</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}