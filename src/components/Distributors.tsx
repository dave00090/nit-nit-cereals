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

  // --- UPDATED LOG EXPENSE WITH created_at ---
  const logExpense = async (distName: string, amountValue: number, note: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('expenses').insert([{
        title: `Supplier Payment: ${distName}`,
        amount: Number(amountValue),
        category: 'Supplier Payment',
        description: note,
        // Using created_at instead of date to match Supabase schema
        created_at: new Date().toISOString(), 
        user_id: user?.id 
      }]);

      if (error) {
        console.error("Expense Log Error:", error.message);
        alert(`Debt updated, but expense record failed: ${error.message}`);
      }
    } catch (err) {
      console.error("System Error:", err);
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
    const amountStr = prompt(`Current Debt: KES ${dist.total_debt.toLocaleString()}\nEnter amount paid:`);
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
    const payload = { ...formData, total_debt: Number(formData.total_debt) };
    if (editingId) await supabase.from('distributors').update(payload).eq('id', editingId);
    else await supabase.from('distributors').insert([payload]);
    setIsModalOpen(false);
    fetchDistributors();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Suppliers</h1>
          <p className="text-slate-500 font-medium tracking-tight">Financial records for Nit-Nit Cereals</p>
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
          <button onClick={handleAddNew} className="bg-amber-500 text-white p-4 rounded-xl hover:bg-amber-600 shadow-lg transition-all active:scale-95">
            <UserPlus size={24} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {distributors
          .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((dist) => (
            <div key={dist.id} className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:border-amber-500 transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-6">
                <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Package size={28} />
                </div>
                <button onClick={() => handleEdit(dist)} className="p-2 text-slate-400 hover:text-slate-900 rounded-xl">
                  <MoreHorizontal size={24} />
                </button>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{dist.name}</h3>
                <div className="flex items-center gap-2 text-slate-400 font-bold">
                  <Phone size={14} />
                  <span className="text-sm">{dist.phone}</span>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl text-white mb-8 shadow-xl shadow-slate-200">
                <div className="flex justify-between items-start mb-3">
                  <Wallet size={20} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Balance Owed</span>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-black">KES {dist.total_debt.toLocaleString()}</p>
                  <TrendingUp size={20} className={dist.total_debt > 0 ? "text-amber-500" : "text-emerald-500"} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <button 
                  onClick={() => handleFullPayment(dist)}
                  className="flex flex-col items-center justify-center gap-2 py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-md active:scale-95"
                >
                  <Receipt size={20} /> Record Payment
                </button>
                <button 
                  onClick={() => handleInstallment(dist)}
                  className="flex flex-col items-center justify-center gap-2 py-4 bg-slate-100 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  <CreditCard size={20} /> Installment
                </button>
              </div>
            </div>
          ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-800">{editingId ? 'Edit Partner' : 'Add Partner'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full text-slate-400"><X size={24}/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input required placeholder="Distributor Name" className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-amber-500 font-bold"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <input required placeholder="Phone Number" className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-amber-500 font-bold"
                value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              <input type="number" placeholder="Total Debt" className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-amber-500 font-bold"
                value={formData.total_debt} onChange={(e) => setFormData({...formData, total_debt: Number(e.target.value)})} />
              <button type="submit" className="w-full py-5 bg-amber-500 text-white font-black rounded-2xl shadow-lg hover:bg-amber-600 transition-all flex items-center justify-center gap-3 mt-4">
                {loading ? <Loader2 className="animate-spin" /> : <><Check size={20}/> Confirm Changes</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}