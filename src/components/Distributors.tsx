import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, Pencil, Trash2, X, Check, Loader2, 
  Phone, Search, Package, Receipt, CreditCard, Wallet, MoreHorizontal, ArrowUpRight
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
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Partner Network</h1>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-slate-500 font-medium">{distributors.length} Total Suppliers</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
              <input 
                type="text" placeholder="Quick search..."
                className="pl-12 pr-6 py-4 bg-white border-none shadow-sm rounded-2xl w-full md:w-80 outline-none ring-2 ring-transparent focus:ring-slate-900/5 transition-all font-medium text-slate-600"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={handleAddNew} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 group">
              <UserPlus size={24} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Network Value</p>
            <p className="text-2xl font-black text-slate-900">KES {distributors.reduce((a,b) => a + b.total_debt, 0).toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl text-slate-900"><TrendingUp size={24} /></div>
        </div>
      </div>

      {/* GRID DISPLAY */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {distributors
          .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((dist) => (
            <div key={dist.id} className="group bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 relative overflow-hidden">
              {/* Decorative Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -mr-10 -mt-10 group-hover:bg-amber-50 transition-colors duration-500"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                    <Package size={28} />
                  </div>
                  <button onClick={() => handleEdit(dist)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                    <MoreHorizontal size={24} />
                  </button>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-amber-600 transition-colors">{dist.name}</h3>
                  <div className="flex items-center gap-2 text-slate-400 font-bold">
                    <Phone size={14} />
                    <span className="text-sm tracking-wide">{dist.phone}</span>
                  </div>
                </div>

                {/* VISUAL DEBT CARD */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-[2rem] text-white shadow-xl shadow-slate-200 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <Wallet size={20} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Balance Owed</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-black tracking-tighter">KES {dist.total_debt.toLocaleString()}</p>
                    <ArrowUpRight size={20} className="text-emerald-400" />
                  </div>
                </div>

                {/* QUICK ACTIONS */}
                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                    <Receipt size={14} /> Full Pay
                  </button>
                  <button className="flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                    <CreditCard size={14} /> Split
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* MODAL SYSTEM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl p-10 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-900">{editingId ? 'Refine' : 'Add'} Partner</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900"><X size={24}/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Full Legal Name</label>
                <input required className="w-full bg-slate-50 px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-slate-900 transition-all font-bold text-slate-700"
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Direct Contact</label>
                <input required className="w-full bg-slate-50 px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-slate-900 transition-all font-bold text-slate-700"
                  value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>

              <div className="group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Opening Balance (KES)</label>
                <input type="number" className="w-full bg-slate-50 px-6 py-4 rounded-2xl outline-none focus:ring-2 ring-slate-900 transition-all font-bold text-slate-700"
                  value={formData.total_debt} onChange={(e) => setFormData({...formData, total_debt: Number(e.target.value)})} />
              </div>

              <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-[1.5rem] shadow-2xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin" /> : <><Check size={20}/> Confirm Details</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper icon
function TrendingUp({size}: {size: number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
}